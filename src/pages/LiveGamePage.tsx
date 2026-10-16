import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { CheckCircle2, Loader, Radio, Trophy, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import { useLiveGame } from '../hooks/useLiveGame';
import { rankPlayers, resolveRanking, getWinners } from '../utils/playerRanking';
import Topbar from '../components/ui/Topbar';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/button';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { WinProbabilityCard } from '../components/WinProbabilityCard';

export const LiveGamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { game, status, isConnected, scorekeeperAway } = useLiveGame(gameId);

  useEffect(() => {
    const dark = getSettings().theme === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    supabase?.auth.getUser().then(({ data }) => setIsSignedIn(!!data.user));
  }, []);

  const toggleTheme = () => {
    const dark = !isDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    saveSettings({ theme: dark ? 'dark' : 'light' });
  };

  const handleBack = () => navigate('/');

  if (status === 'loading') {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBack} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32 flex items-center justify-center">
          <div className="text-center flex flex-col items-center">
            <Loader className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground text-sm">Joining game…</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'not-found' || !game) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBack} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Game not found</h1>
            <p className="text-muted-foreground mb-6">
              {isSignedIn
                ? "This game doesn't exist, was deleted, or belongs to a league you're not in."
                : "This game doesn't exist or was deleted. If it's a league game, sign in as a league member to watch."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {!isSignedIn && (
                <Button asChild>
                  <Link to="/signin">Sign in</Link>
                </Button>
              )}
              <Button onClick={handleBack} variant="secondary">
                Return to home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ranking = resolveRanking(game);
  const isCompleted = game.status === 'completed';
  const ranked = rankPlayers(game.players, ranking);
  const winners = isCompleted ? getWinners(game.players, ranking) : [];
  const roundIndex = game.currentRound - 1;
  const hasScores = game.players.some(p => p.roundScores.length > 0);
  const playerIndexById = Object.fromEntries(game.players.map((p, i) => [p.id, i]));

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBack} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-16 lg:pt-20 px-4 pb-32">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-xs border bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Final
                </span>
              ) : isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm text-xs font-semibold border bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
                  </span>
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-xs border bg-muted text-muted-foreground border-border">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Reconnecting…
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {ranking === 'low-wins' ? 'Lowest score wins' : 'Highest score wins'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground break-words">{game.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isCompleted
                ? `${game.maxRounds} rounds played`
                : `Round ${game.currentRound} of ${game.maxRounds}`}
              {game.targetScore !== undefined && ` · First to ${game.targetScore}`}
            </p>
          </div>

          {!isCompleted && scorekeeperAway && (
            <div className="flex items-start gap-2 mb-6 px-4 py-3 rounded-xl text-sm bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
              <span>The scorekeeper's connection dropped. New scores will show up here once they're back online.</span>
            </div>
          )}

          {isCompleted && winners.length > 0 && (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
              <Trophy className="w-5 h-5 shrink-0" />
              <span className="font-medium">
                {winners.length > 1
                  ? `${winners.map(w => w.name).join(' & ')} tied for the win!`
                  : `${winners[0].name} wins with ${winners[0].totalScore} points!`}
              </span>
            </div>
          )}

          <Panel border="none" animate={false} padding="none" className="overflow-hidden mb-6">
            <ol>
              {ranked.map(({ player, rank, tied }) => {
                const roundScore = player.roundScores[roundIndex];
                const toGo = game.targetScore !== undefined && ranking === 'high-wins'
                  ? game.targetScore - player.totalScore
                  : undefined;
                return (
                  <motion.li
                    key={player.id}
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 bg-card"
                  >
                    <span className="w-7 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
                      {tied ? `T${rank}` : rank}
                    </span>
                    <div
                      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: player.color }}
                    >
                      <PlayerAvatar player={player} index={playerIndexById[player.id]} avatarStyle={game.avatarStyle} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {!isCompleted && roundScore !== undefined
                          ? `${roundScore >= 0 ? '+' : ''}${roundScore} this round`
                          : !isCompleted ? 'No score yet this round' : null}
                        {!isCompleted && toGo !== undefined && toGo > 0 && ` · ${toGo} to go`}
                      </div>
                    </div>
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      <NumberFlow value={player.totalScore} />
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          </Panel>

          {!isCompleted && hasScores && <WinProbabilityCard game={game} />}

          {!isSignedIn && (
            <Panel className="mt-6 text-center">
              <Radio className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <h2 className="font-semibold text-foreground mb-1">Keep score for your own games</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Track rounds, see live win odds and share results with your group. It's free.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link to="/new-game">Start a game</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/signup">Create an account</Link>
                </Button>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
