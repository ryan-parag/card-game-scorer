import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Game, Player } from '../types/game';
import { useGame } from '../hooks/useGame';
import { getGame, getSettings, saveSettings, saveGame } from '../utils/storage';
import { generateAvatarSeed } from '../utils/avatar';
import { useProfileIds } from '../hooks/useProfileIds';
import { useScoringSystem, ScoringSystem } from '../hooks/useScoringSystem';
import { useLeagues } from '../hooks/useLeagues';
import type { LeagueMember } from '../hooks/useLeagues';
import { supabase } from '../lib/supabase';
import Topbar from '../components/ui/Topbar';
import { ScoreInterface } from '../components/ScoreInterface';
import { GameSummary } from '../components/GameSummary';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PageState = 'loading' | 'not-found' | 'game' | 'summary';

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isDark, setIsDark] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  const {
    game,
    setGame,
    updateScore,
    updateProposedScore,
    addPlayer,
    removePlayer,
    reorderPlayers,
    updatePlayer,
    setMaxRounds,
    setCollectProposedScores,
    setRanking,
    nextRound,
    completeGame,
    undo,
    canUndo
  } = useGame();

  const profileIds = useProfileIds(game?.players.map(p => p.id) ?? []);

  // Resolve the active scoring system, league name, and season name for this game
  const { systems: scoringSystems } = useScoringSystem();
  const [gameSystemId, setGameSystemId] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    if (game?.season_id) {
      supabase
        .from('league_seasons')
        .select('name, scoring_system_id, league:leagues(name)')
        .eq('id', game.season_id)
        .single()
        .then(({ data }) => {
          setGameSystemId((data as any)?.scoring_system_id ?? null);
          setSeasonName((data as any)?.name ?? null);
          const league = (data as any)?.league;
          setLeagueName(Array.isArray(league) ? (league[0]?.name ?? null) : (league?.name ?? null));
        });
    } else if (game?.league_id) {
      supabase
        .from('leagues')
        .select('name')
        .eq('id', game.league_id)
        .single()
        .then(({ data }) => setLeagueName(data?.name ?? null));
    } else {
      setGameSystemId(null);
      setLeagueName(null);
      setSeasonName(null);
    }
  }, [game?.season_id, game?.league_id]);
  const activeSystem: ScoringSystem | null =
    gameSystemId ? (scoringSystems.find(s => s.id === gameSystemId) ?? null) : null;

  const { leagues } = useLeagues(userId);
  const leagueMembers: LeagueMember[] | undefined = game?.league_id
    ? leagues.find(l => l.id === game.league_id)?.members
    : undefined;

  // Load game from storage on mount
  useEffect(() => {
    const loadGame = async () => {
      try {
        // Check if there's a new game being passed via state
        const state = location.state as { newGame?: Game } | null | undefined;
        if (state?.newGame) {
          setGame(state.newGame, 'start_game');
          setPageState('game');
          // Clear the state so it doesn't persist on navigation
          navigate('.', { replace: true, state: {} });
          return;
        }

        const foundGame = gameId ? await getGame(gameId) : null;
        
        if (foundGame) {
          setGame(foundGame, 'continue_game');
          setPageState(foundGame.status === 'completed' ? 'summary' : 'game');
        } else {
          setPageState('not-found');
        }
      } catch (error) {
        console.error('Error loading game:', error);
        setPageState('not-found');
      }
    };

    // Load theme
    const settings = getSettings();
    const isDarkMode = settings.theme === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    supabase?.auth.getUser().then(({ data }) => setUserId(data.user?.id));
    loadGame();
  }, [gameId, setGame, navigate, location.state]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveSettings({ theme: newTheme ? 'dark' : 'light' });
  };

  const handleCompleteGame = () => {
    completeGame();
    setPageState('summary');
  };

  const handlePlayAgainWithSamePlayers = async () => {
    if (!game) return;
    
    const resetPlayers: Player[] = game.players.map(player => ({
      ...player,
      totalScore: 0,
      roundScores: [],
      proposedScore: undefined
    }));
    
    const newGame: Game = {
      id: Date.now().toString(),
      name: `${game.name} (Rematch)`,
      players: resetPlayers,
      rounds: [],
      currentRound: 1,
      maxRounds: game.maxRounds,
      collectProposedScores: game.collectProposedScores,
      ranking: game.ranking ?? 'high-wins',
      gameType: game.gameType,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await saveGame(newGame);
      setGame(newGame, 'start_game');
      navigate(`/game/${newGame.id}`, { replace: true });
    } catch (error) {
      console.error('Error saving rematch game:', error);
    }
  };

  const handleGoToRound = (roundNumber: number) => {
    if (game) {
      const updatedGame = {
        ...game,
        currentRound: roundNumber
      };
      setGame(updatedGame, 'go_to_round');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (pageState === 'loading') {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBackToHome} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32 flex items-center justify-center">
          <div className="text-center flex flex-col items-center">
            <Loader className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground text-sm">Loading game…</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'not-found') {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBackToHome} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Game not found</h1>
            <p className="text-muted-foreground mb-6">
              This game doesn't exist or has been deleted.
            </p>
            <Button onClick={handleBackToHome} variant="secondary">
              Return to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {pageState === 'game' && game && (
        <>
          <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBackToHome} />
          <ScoreInterface
            game={game}
            onUpdateScore={updateScore}
            onUpdateProposedScore={updateProposedScore}
            onSetMaxRounds={setMaxRounds}
            onSetCollectProposedScores={setCollectProposedScores}
            onSetRanking={setRanking}
            onNextRound={nextRound}
            onCompleteGame={handleCompleteGame}
            onUndo={undo}
            canUndo={canUndo}
            onBack={handleBackToHome}
            onGoToRound={handleGoToRound}
            onAddPlayer={() => {
              const newPlayer: Player = {
                id: Date.now().toString(),
                name: '',
                color: '#3B82F6',
                avatar: '',
                totalScore: 0,
                roundScores: []
              };
              addPlayer(newPlayer);
            }}
            onRemovePlayer={removePlayer}
            onReorderPlayers={reorderPlayers}
            onUpdatePlayer={(playerId, updates) => {
              if (typeof updates.name === 'string') {
                updatePlayer(playerId, { ...updates, avatar: generateAvatarSeed(updates.name) });
              } else {
                updatePlayer(playerId, updates);
              }
            }}
            isDark={isDark}
            leagueMembers={leagueMembers}
          />
        </>
      )}

      {pageState === 'summary' && game && (
        <>
          <Topbar toggleTheme={toggleTheme} isDark={isDark} />
          <GameSummary
            game={game}
            onNewGame={() => navigate('/new-game')}
            onHome={handleBackToHome}
            onPlayAgainWithSamePlayers={handlePlayAgainWithSamePlayers}
            isDark={isDark}
            profileIds={profileIds}
            activeSystem={activeSystem}
            leagueName={leagueName}
            seasonName={seasonName}
          />
        </>
      )}
    </div>
  );
};
