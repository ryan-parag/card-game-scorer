import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Game, Player } from '../types/game';
import { useGame } from '../hooks/useGame';
import { getGame, getSettings, saveSettings, saveGame, deleteGame, syncPendingChanges, hasPendingGame } from '../utils/storage';
import { newGameId } from '../utils/gameId';
import { generateAvatarSeed } from '../utils/avatar';
import { useProfileLookup } from '../hooks/useProfileIds';
import { ClaimPlayerModal } from '../components/ClaimPlayerModal';
import { savePendingClaim, readPendingClaim, clearPendingClaim } from '../utils/claims';
import { useScoringSystem, ScoringSystem } from '../hooks/useScoringSystem';
import { useLeagues } from '../hooks/useLeagues';
import type { LeagueMember } from '../hooks/useLeagues';
import { supabase, rowToGame } from '../lib/supabase';
import { computeSeasonStandings, standingsKeyForPlayer, SeasonRankChange } from '../utils/seasonStandings';
import Topbar from '../components/ui/Topbar';
import { ScoreInterface } from '../components/ScoreInterface';
import { GameSummary } from '../components/GameSummary';
import { CloudOff, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '../components/ui/Modal';
import { useSyncStatus } from '../hooks/useSyncStatus';

type PageState = 'loading' | 'not-found' | 'game' | 'summary';

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isDark, setIsDark] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [authChecked, setAuthChecked] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [isConfirmingUnsyncedComplete, setIsConfirmingUnsyncedComplete] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [retrySyncFailed, setRetrySyncFailed] = useState(false);

  const {
    game,
    setGame,
    loadGame,
    setScoreKeeper,
    updateScore,
    updateProposedScore,
    addPlayer,
    removePlayer,
    reorderPlayers,
    updatePlayer,
    setMaxRounds,
    setCollectProposedScores,
    setRanking,
    setTargetScore,
    setLeague,
    nextRound,
    completeGame,
    undo,
    canUndo
  } = useGame();

  const [scoreKeeperName, setScoreKeeperName] = useState<string | null>(null);

  useEffect(() => {
    setScoreKeeper(userId ?? null);
  }, [userId, setScoreKeeper]);

  useEffect(() => {
    if (!supabase || !game?.score_recorded_by) {
      setScoreKeeperName(null);
      return;
    }
    supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', game.score_recorded_by)
      .single()
      .then(({ data }) => {
        setScoreKeeperName(data?.display_name ?? data?.email ?? null);
      });
  }, [game?.score_recorded_by]);

  const { profileIds, loaded: profilesLoaded } = useProfileLookup(game?.players.map(p => p.id) ?? []);

  // Finished games let people claim a typed-in player ("Amanda") as
  // themselves. Not offered once you're already in the game.
  const [claimingPlayer, setClaimingPlayer] = useState<Player | null>(null);
  const claimablePlayerIds = useMemo(() => {
    if (!supabase || !game || game.status !== 'completed' || !authChecked || !profilesLoaded) return new Set<string>();
    if (userId && game.players.some(p => p.id === userId)) return new Set<string>();
    return new Set(game.players.filter(p => !profileIds.has(p.id)).map(p => p.id));
  }, [game, authChecked, profilesLoaded, profileIds, userId]);

  const handleClaimPlayer = (player: Player) => {
    if (!game) return;
    if (userId) {
      setClaimingPlayer(player);
      return;
    }
    savePendingClaim({ gameId: game.id, playerId: player.id });
    navigate(`/signup?next=${encodeURIComponent(`/game/${game.id}`)}`);
  };

  // Pick up a claim started while signed out, once they're back and signed in.
  useEffect(() => {
    if (!game || !userId || !profilesLoaded) return;
    const pending = readPendingClaim();
    if (pending?.gameId !== game.id) return;
    clearPendingClaim();
    const player = game.players.find(p => p.id === pending.playerId);
    if (player && claimablePlayerIds.has(player.id)) setClaimingPlayer(player);
  }, [game, userId, profilesLoaded, claimablePlayerIds]);

  const reloadGame = async () => {
    if (!game) return;
    const fresh = await getGame(game.id);
    if (fresh) loadGame(fresh);
  };

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

  const { leagues, loading: leaguesLoading } = useLeagues(userId);
  const leagueMembers: LeagueMember[] | undefined = game?.league_id
    ? leagues.find(l => l.id === game.league_id)?.members
    : undefined;

  // Non-league games: any logged-in player can manage them.
  // League games: only members of that league can manage them.
  const canManageGame = !!game && !!userId && (
    !game.league_id || !!leagueMembers?.some(m => m.user_id === userId)
  );

  const canDeleteGame = canManageGame;
  const canEditGame = canManageGame;

  // People who can't save changes to an in-progress game (signed out, or not
  // in its league) get the read-only live view instead of the score editor.
  const accessResolved = !!game && (!supabase || (authChecked && (!userId || !game.league_id || !leaguesLoading)));
  useEffect(() => {
    // Without Supabase every game is local to this device, so there's no live view.
    if (!supabase || pageState !== 'game' || !game || !accessResolved || canManageGame) return;
    // This device still has unsaved scores for the game, so it's the
    // scorekeeper's (e.g. signed out mid-game) — leave the editor alone.
    if (hasPendingGame(game.id)) return;
    navigate(`/live/${game.id}`, { replace: true });
  }, [pageState, game, accessResolved, canManageGame, navigate]);

  const [seasonRankChanges, setSeasonRankChanges] = useState<Record<string, SeasonRankChange>>({});

  useEffect(() => {
    const computeRankMovement = async () => {
      if (!supabase || !game || game.status !== 'completed' || !game.season_id) {
        setSeasonRankChanges({});
        return;
      }

      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('season_id', game.season_id)
        .order('updated_at', { ascending: true });

      const seasonGames = (data ?? []).map(rowToGame).filter(g => g.status === 'completed');
      const gameIndex = seasonGames.findIndex(g => g.id === game.id);
      if (gameIndex === -1) {
        setSeasonRankChanges({});
        return;
      }

      const members = leagueMembers ?? [];
      const standingsBefore = computeSeasonStandings(seasonGames.slice(0, gameIndex), members, activeSystem);
      const standingsThrough = computeSeasonStandings(seasonGames.slice(0, gameIndex + 1), members, activeSystem);
      const rankBeforeByKey = Object.fromEntries(standingsBefore.map(s => [s.key, s.rank]));
      const rankThroughByKey = Object.fromEntries(standingsThrough.map(s => [s.key, s.rank]));

      const changes: Record<string, SeasonRankChange> = {};
      for (const player of game.players) {
        const key = standingsKeyForPlayer(player.id, player.name, members);
        const afterRank = rankThroughByKey[key];
        if (afterRank === undefined) continue;
        const beforeRank = rankBeforeByKey[key];
        if (beforeRank === undefined) {
          changes[player.id] = { direction: 'new', delta: 0 };
          continue;
        }
        const delta = beforeRank - afterRank;
        changes[player.id] = {
          direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
          delta: Math.abs(delta),
        };
      }
      setSeasonRankChanges(changes);
    };

    computeRankMovement();
  }, [game?.id, game?.status, game?.season_id, game?.updatedAt, leagueMembers, activeSystem]);

  useEffect(() => {
    const loadInitialGame = async () => {
      try {
        const state = location.state as { newGame?: Game } | null | undefined;
        if (state?.newGame) {
          loadGame(state.newGame);
          setPageState('game');
          navigate('.', { replace: true, state: {} });
          return;
        }

        const foundGame = gameId ? await getGame(gameId) : null;
        
        if (foundGame) {
          loadGame(foundGame);
          setPageState(foundGame.status === 'completed' ? 'summary' : 'game');
        } else {
          if (readPendingClaim()?.gameId === gameId) clearPendingClaim();
          setPageState('not-found');
        }
      } catch (error) {
        console.error('Error loading game:', error);
        setPageState('not-found');
      }
    };

    const settings = getSettings();
    const isDarkMode = settings.theme === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUserId(data.user?.id);
        setAuthChecked(true);
      });
    } else {
      setAuthChecked(true);
    }
    loadInitialGame();
  }, [gameId, loadGame, navigate, location.state]);

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

  const syncStatus = useSyncStatus(game?.id);

  const finishGame = () => {
    setIsConfirmingUnsyncedComplete(false);
    completeGame();
    setPageState('summary');
  };

  // Completing a game whose scores haven't uploaded would leave other players
  // looking at an unfinished game, so give the scorekeeper a chance to retry.
  const handleCompleteGame = () => {
    if (game && hasPendingGame(game.id)) {
      setRetrySyncFailed(false);
      setIsConfirmingUnsyncedComplete(true);
      return;
    }
    finishGame();
  };

  const handleRetrySyncBeforeComplete = async () => {
    if (!game) return;
    setIsRetryingSync(true);
    setRetrySyncFailed(false);
    await syncPendingChanges();
    setIsRetryingSync(false);
    if (hasPendingGame(game.id)) {
      setRetrySyncFailed(true);
    } else {
      finishGame();
    }
  };

  const handlePlayAgainWithSamePlayers = async () => {
    if (!game || isRestarting) return;
    setIsRestarting(true);
    setRestartError(null);

    const resetPlayers: Player[] = game.players.map(player => ({
      ...player,
      totalScore: 0,
      roundScores: [],
      proposedScore: undefined
    }));
    
    const newGame: Game = {
      id: newGameId(),
      name: `${game.name} (Rematch)`,
      players: resetPlayers,
      rounds: [],
      currentRound: 1,
      maxRounds: game.maxRounds,
      collectProposedScores: game.collectProposedScores,
      ranking: game.ranking ?? 'high-wins',
      targetScore: game.targetScore,
      gameType: game.gameType,
      status: 'in-progress',
      league_id: game.league_id ?? null,
      season_id: game.season_id ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await saveGame(newGame);
      loadGame(newGame);
      navigate(`/game/${newGame.id}`, { replace: true });
      setIsRestarting(false);
    } catch (error) {
      console.error('Error saving rematch game:', error);
      setRestartError('Could not start the rematch. Please try again.');
      setIsRestarting(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!game) return;
    try {
      await deleteGame(game.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const handleEditGame = () => {
    setPageState('game');
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

  if (pageState === 'loading' || (pageState === 'game' && !accessResolved)) {
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
              {userId
                ? "This game doesn't exist, was deleted, or belongs to a league you're not in."
                : "This game doesn't exist or was deleted. If it's a league game, sign in as a league member to see it."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {!userId && (
                <Button onClick={() => navigate('/signin')}>
                  Sign in
                </Button>
              )}
              <Button onClick={handleBackToHome} variant="secondary">
                Return to home
              </Button>
            </div>
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
            onSetTargetScore={setTargetScore}
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
            scoreKeeperName={scoreKeeperName}
            leagueMembers={leagueMembers}
            leagueName={leagueName}
            seasonName={seasonName}
            availableLeagues={leagues}
            onSetLeague={setLeague}
            onDeleteGame={canDeleteGame ? handleDeleteGame : undefined}
            canShareLive={canManageGame}
          />
          <Modal open={isConfirmingUnsyncedComplete} onClose={() => setIsConfirmingUnsyncedComplete(false)} className="max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <CloudOff className="w-5 h-5 text-amber-500 shrink-0" />
              <h2 className="text-lg font-bold">Scores haven't uploaded yet</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Some scores are only saved on this device, so other players can't see them yet.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              If you complete the game now, it will upload automatically the next time this device is online. Open ScoreKeeper on this device again if it doesn't.
            </p>
            {retrySyncFailed && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {syncStatus.isOnline ? 'Still couldn\'t upload. Check your connection and try again.' : 'This device is offline.'}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={finishGame} disabled={isRetryingSync}>Complete anyway</Button>
              <Button onClick={handleRetrySyncBeforeComplete} disabled={isRetryingSync}>
                {isRetryingSync ? 'Uploading…' : 'Try uploading'}
              </Button>
            </div>
          </Modal>
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
            isRestarting={isRestarting}
            restartError={restartError}
            onDeleteGame={canDeleteGame ? handleDeleteGame : undefined}
            onEditGame={canEditGame ? handleEditGame : undefined}
            isDark={isDark}
            profileIds={profileIds}
            claimablePlayerIds={claimablePlayerIds}
            onClaimPlayer={handleClaimPlayer}
            activeSystem={activeSystem}
            leagueName={leagueName}
            seasonName={seasonName}
            scoreKeeperName={scoreKeeperName}
            seasonRankChanges={seasonRankChanges}
          />
          {userId && (
            <ClaimPlayerModal
              game={game}
              player={claimingPlayer}
              userId={userId}
              onClose={() => setClaimingPlayer(null)}
              onClaimed={reloadGame}
            />
          )}
        </>
      )}
    </div>
  );
};
