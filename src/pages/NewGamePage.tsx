import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarStyle, Game, Player } from '../types/game';
import { generateAvatarSeed } from '../utils/avatar';
import { GameSetup } from '../components/GameSetup';
import { PlayerSetup } from '../components/PlayerSetup';
import { getSettings, saveSettings, saveGame } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { useFriends } from '../hooks/useFriends';
import { useLeagues, computeSeasonStatus } from '../hooks/useLeagues';
import { supabase } from '../lib/supabase';

type Step = 'game-setup' | 'player-setup';

export const NewGamePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('game-setup');
  const [gameConfig, setGameConfig] = useState<Partial<Game>>({});
  const [isDark, setIsDark] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    supabase?.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const { friends } = useFriends(userId);
  const friendProfiles = friends.map(f => f.profile);

  const { leagues } = useLeagues(userId);
  // Only offer leagues that have at least one active or upcoming season
  const availableLeagues = leagues
    .map(l => ({
      id: l.id,
      name: l.name,
      seasons: l.seasons.filter(s => {
        const status = computeSeasonStatus(s.start_date, s.end_date);
        return status === 'active' || status === 'upcoming';
      }),
    }))
    .filter(l => l.seasons.length > 0);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  const PLAYER_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16',
    '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F43F5E',
  ];

  // When a league is selected, pre-populate players from its members (current user first)
  const leaguePlayers = useMemo((): Player[] | undefined => {
    if (!gameConfig.league_id) return undefined;
    const league = leagues.find(l => l.id === gameConfig.league_id);
    if (!league || league.members.length < 2) return undefined;

    // Sort: current user first, then everyone else alphabetically
    const sorted = [...league.members].sort((a, b) => {
      if (a.user_id === userId) return -1;
      if (b.user_id === userId) return 1;
      const nameA = a.profile.display_name ?? a.profile.email.split('@')[0];
      const nameB = b.profile.display_name ?? b.profile.email.split('@')[0];
      return nameA.localeCompare(nameB);
    });

    return sorted.map((m, i) => {
      const name = m.profile.display_name ?? m.profile.email.split('@')[0];
      return {
        id: m.user_id,
        name,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: generateAvatarSeed(name),
        totalScore: 0,
        roundScores: [],
      };
    });
  }, [gameConfig.league_id, leagues, userId]);

  const handleGameSetup = (config: Partial<Game>) => {
    setGameConfig(config);
    setStep('player-setup');
  };

  const handlePlayerSetup = async (players: Player[], avatarStyle: AvatarStyle) => {
    const newGame: Game = {
      id: Date.now().toString(),
      name: gameConfig.name || 'New Game',
      players,
      rounds: [],
      currentRound: 1,
      maxRounds: gameConfig.maxRounds || 10,
      collectProposedScores: gameConfig.collectProposedScores || false,
      ranking: gameConfig.ranking ?? 'high-wins',
      avatarStyle,
      gameType: gameConfig.gameType || 'standard',
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      league_id: gameConfig.league_id ?? null,
      season_id: gameConfig.season_id ?? null,
    };

    try {
      await saveGame(newGame);
      navigate(`/game/${newGame.id}`, { state: { newGame } });
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Topbar
        toggleTheme={toggleTheme}
        isDark={isDark}
        onBack={step === 'player-setup' ? () => setStep('game-setup') : () => navigate('/')}
      />

      {step === 'game-setup' && (
        <GameSetup
          onBack={() => navigate('/')}
          onNext={handleGameSetup}
          isDark={isDark}
          availableLeagues={availableLeagues}
        />
      )}

      {step === 'player-setup' && (
        <PlayerSetup
          onBack={() => setStep('game-setup')}
          onNext={handlePlayerSetup}
          isDark={isDark}
          friends={friendProfiles}
          initialPlayers={leaguePlayers}
        />
      )}
    </div>
  );
};
