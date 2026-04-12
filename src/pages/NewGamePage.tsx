import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarStyle, Game, Player } from '../types/game';
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
        />
      )}
    </div>
  );
};
