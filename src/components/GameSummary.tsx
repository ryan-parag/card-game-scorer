import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Home, Repeat, BadgePlus, CircleSlash2, CheckCircle2, Hash, UsersRound, LandPlot, Medal, ArrowUp, ArrowDown, Copy, Check, Maximize2, ShieldHalf, CalendarDays, ClipboardCheck, Trash2 } from 'lucide-react';
import { Game } from '../types/game';
import { ScoringSystem } from '../hooks/useScoringSystem';
import { resolveRanking, sortPlayersByRanking, leaderboardHighTotal, leaderboardLowTotal } from '../utils/playerRanking';
import { useWindowSize } from 'react-use'
import Confetti from 'react-confetti'
import { motion, AnimatePresence, useInView } from 'framer-motion';
import moment from 'moment';
import { PlayerAvatar } from './ui/PlayerAvatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import NumberFlow from '@number-flow/react';
import { ScoreProgressChart } from './ScoreProgressChart';
import { Button } from './ui/button';
import DelayedNumber from './ui/DelayedNumber';

interface GameSummaryProps {
  game: Game;
  onNewGame: () => void;
  onHome: () => void;
  onPlayAgainWithSamePlayers?: () => void;
  onDeleteGame?: () => void;
  isDark: boolean;
  profileIds?: Set<string>;
  activeSystem?: ScoringSystem | null;
  leagueName?: string | null;
  seasonName?: string | null;
}

function longestConsecutiveZeroRounds(scores: number[], playedRounds: number): number {
  let best = 0;
  let current = 0;
  for (let i = 0; i < playedRounds; i++) {
    const s = scores[i];
    if (s === 0) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

/** True when every played round has a recorded score and none are 0. */
function hasNoZeroScoreRounds(scores: number[], playedRounds: number): boolean {
  if (playedRounds <= 0) return false;
  for (let i = 0; i < playedRounds; i++) {
    const s = scores[i];
    if (s === undefined || s === null || s === 0) return false;
  }
  return true;
}

const GameStat =({ label, value, icon}) => {
  return(
    <div className={`flex flex-row justify-center items-center rounded-lg px-1 py-2 gap-0 bg-black/5 dark:bg-white/5 text-foreground`}>
      <div className="opacity-50 mr-1.5">
        {
          icon && icon
        }
      </div>
      <div className="text-sm font-bold mr-1">
        <DelayedNumber value={value} />
      </div>
      <div className="text-sm">
        {label}
      </div>
    </div>
  )
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  game,
  onNewGame,
  onHome,
  onPlayAgainWithSamePlayers,
  onDeleteGame,
  isDark: _isDark,
  profileIds,
  activeSystem,
  leagueName,
  seasonName,
}) => {
  // Prop is currently only used to mirror theme state at the app level (Tailwind `dark:` classes handle styling).
  // This `void` keeps linting happy without changing behavior.
  void _isDark;
  const ranking = resolveRanking(game);
  const sortedPlayers = sortPlayersByRanking(game.players, ranking);
  const winner = sortedPlayers[0];

  // Map player id → championship points based on finish position
  const champPtsMap: Record<string, number> = {};
  if (activeSystem) {
    sortedPlayers.forEach((player, i) => {
      const pts = activeSystem.rules.find(r => r.rank === i + 1)?.points ?? 0;
      champPtsMap[player.id] = pts;
    });
  }
  const recordedRounds = game.rounds.filter((round) => round.completed).length || game.rounds.length;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const roundsFromPlayerScores = game.players.reduce(
    (maxRounds, player) => Math.max(maxRounds, player.roundScores.length),
    0
  );
  const totalRounds = Math.max(
    recordedRounds,
    roundsFromPlayerScores,
    game.status === 'completed' ? game.currentRound : 0
  );
  const averageScore = game.players.length > 0
    ? Math.round(game.players.reduce((sum, p) => sum + p.totalScore, 0) / game.players.length)
    : 0;
  const leaderTotal =
    game.players.length > 0
      ? ranking === 'low-wins'
        ? leaderboardLowTotal(game.players)
        : leaderboardHighTotal(game.players)
      : 0;
  const leaderTotalLabel = ranking === 'low-wins' ? 'Lowest score' : 'Highest score';

  const getAveragePerRound = (totalScore: number) => {
    if (totalRounds <= 0) return 0;
    return Math.round(totalScore / totalRounds);
  };

  const zeroStreaks = game.players.map((player) => ({
    player,
    streak: longestConsecutiveZeroRounds(player.roundScores, totalRounds)
  }));
  const maxZeroStreak = zeroStreaks.length > 0
    ? Math.max(0, ...zeroStreaks.map(({ streak }) => streak))
    : 0;
  const playersWithLongestZeroStreak = maxZeroStreak > 0
    ? zeroStreaks.filter(({ streak }) => streak === maxZeroStreak).map(({ player }) => player)
    : [];

  const playersWithNoZeroRounds = game.players.filter((player) =>
    hasNoZeroScoreRounds(player.roundScores, totalRounds)
  );

  const [isVisible, setIsVisible] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const { width, height } = useWindowSize()

  const ref = useRef(null)
  const isInView = useInView(ref)

  setTimeout(() => {
    setIsVisible(false);
  }, 3000);

  const generateRankingsTable = () => {
    const gameDate = moment(game.updatedAt).format('MMM D, YYYY');
    const header = `${game.name} • ${gameDate} • ${game.maxRounds} Rounds`;
    const rankings = sortedPlayers
      .map((player, index) => {
        const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const emojiPart = emoji ? ` ${emoji}` : '';
        return `${index + 1}. ${player.name}${emojiPart}, ${player.totalScore}pts`;
      })
      .join('\n');
    const gameUrl = `${window.location.origin}/game/${game.id}`;
    return `${header}\n\n${rankings}\n\n${gameUrl}`;
  };

  const handleCopyRankings = async () => {
    try {
      const table = generateRankingsTable();
      await navigator.clipboard.writeText(table);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy rankings:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary py-12 px-4">
      <Confetti width={width} height={height} initialVelocityY={100} gravity={.2} recycle={isVisible} />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 32, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: -12 }}
              exit={{ opacity: 0, y: 32, rotate: 0 }}
              transition={{ duration: 0.24, delay: 0.1, type: "spring", stiffness: 150 }}
              className="mx-auto flex items-center justify-center w-16 lg:w-24 h-16 lg:h-24 bg-gradient-to-b from-yellow-400 to-yellow-700 rounded-2xl lg:rounded-3xl mb-6 shadow-2xl shadow-yellow-500/50 overflow-hidden border border-yellow-500 dark:border-yellow-800 transform relative"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: .3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.6, type: "spring", stiffness: 145 }}
                className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-white"
              />
              <Trophy className="w-8 lg:w-12 h-8 lg:h-12 text-white" />
            </motion.div>
          </AnimatePresence>
          <h1 className="text-4xl text-foreground mb-2">
            Game Complete!
          </h1>
          <p className="text-xl text-muted-foreground">
            {game.name} • <DelayedNumber value={game.maxRounds} delay={300} /> Rounds
          </p>
          <span className="text-sm mt-1 inline-flex items-center gap-1 rounded-full bg-muted border-border text-muted-foreground py-0.5 px-3">
            {ranking === 'low-wins' ? `Lowest total wins` : `Highest total wins`}
            <div>
              {
                ranking === 'low-wins' ? (
                  <ArrowDown size={16}/>
                )
                : (
                  <ArrowUp size={16}/>
                )
              }
            </div>
          </span>
          <div className="flex flex-col items-center gap-y-2 pt-1 mt-1">
            <div className="h-px w-full max-w-[32px] border-t border-border"/>
            <small className="text-xs md:text-sm text-muted-foreground">
              Completed {moment(game.updatedAt).fromNow()}
            </small>
            {(leagueName || seasonName || activeSystem) && (
              <div className="flex flex-col items-start justify-center gap-1.5 mt-0.5 rounded-xl p-3 border border-border bg-card shadow-inner w-full max-w-sm">
                {leagueName && (
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-xs text-muted-foreground">League</span>
                    <Link
                      to={`/leagues/${game.league_id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm bg-muted text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <ShieldHalf className="w-3 h-3 shrink-0" />
                      {leagueName}
                    </Link>
                  </div>
                )}
                {seasonName && (
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-xs text-muted-foreground">Season</span>
                    <Link
                      to={`/leagues/${game.league_id}/seasons/${game.season_id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm bg-muted text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <CalendarDays className="w-3 h-3 shrink-0" />
                      {seasonName}
                    </Link>
                  </div>
                )}
                {activeSystem && (
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-xs text-muted-foreground">Scoring</span>
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <span className="inline-flex items-center text-sm underline decoration-dotted underline-offset-2">
                          <ClipboardCheck className="w-4 h-4 mr-1 shrink-0" />
                          {activeSystem.name}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" align="end">
                        <p className="text-xs font-semibold text-foreground mb-2">
                          {activeSystem.name}
                        </p>
                        {activeSystem.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {activeSystem.description}
                          </p>
                        )}
                        <div className="flex flex-col gap-1">
                          <div className="grid grid-cols-2 gap-x-2 text-xs font-medium text-muted-foreground pb-1 border-b border-border">
                            <span>Finish</span>
                            <span className="text-right">Points</span>
                          </div>
                          {activeSystem.rules.map(rule => (
                            <div key={rule.id} className="grid grid-cols-2 gap-x-2 text-xs">
                              <span className="text-foreground">
                                {rule.rank === 1 ? '1st' : rule.rank === 2 ? '2nd' : rule.rank === 3 ? '3rd' : `${rule.rank}th`}
                              </span>
                              <span className="text-right font-medium tabular-nums text-foreground">
                                {rule.points}
                              </span>
                            </div>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Winner Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          className="bg-gradient-to-b dark:from-muted dark:to-yellow-900/50 from-background to-yellow-500/30 rounded-2xl px-8 py-12 mb-8 text-center shadow-xl border border-border"
        >
          <h2 className="text-3xl font-bold mb-2">
            🎉 {winner.name} Wins! 🎉
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 border-white"
              style={{ backgroundColor: winner.color }}
            >
              <PlayerAvatar player={winner} index={0} avatarStyle={game.avatarStyle} />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold ">
              <DelayedNumber value={winner.totalScore} delay={500} /> Points
              </div>
              <div className="text-yellow-700 dark:text-yellow-300">
                Final Score
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final Rankings */}
        <motion.div
          className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.24, delay: 0.6, type: "spring", stiffness: 150 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">
              Final Rankings
            </h3>
            <button
              onClick={handleCopyRankings}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-foreground"
              title="Copy rankings to clipboard"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                className={`flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 rounded-xl transition-all duration-200 ${
                  index === 0
                    ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-800/20 dark:to-yellow-900/40 border-2 border-yellow-500/20 dark:border-yellow-500/10'
                    : index === 1
                    ? 'bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 border-2 border-zinc-500/20 dark:border-zinc-500/10'
                    : index === 2
                    ? 'bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-800/20 dark:to-orange-900/40 border-2 border-orange-500/20 dark:border-orange-500/10'
                    : 'bg-muted'
                }`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.24, delay: .2*index, type: "spring", stiffness: 150 }}
              >
                <div className="flex-1 flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg"
                      style={{ backgroundColor: player.color }}
                    >
                      <PlayerAvatar player={player} index={index} avatarStyle={game.avatarStyle} />
                    </div>
                    <div className={`absolute -bottom-2 -right-2 p-2 rounded-full bg-card border-1 font-semibold hidden md:inline-flex items-center justify-center w-8 h-8 ${
                      index === 0 ? 'text-yellow-600 text-xl' :
                      index === 1 ? 'text-muted-foreground text-xl' :
                      index === 2 ? 'text-orange-600 text-xl' :
                      'text-muted-foreground text-md'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-foreground">
                      {profileIds?.has(player.id) ? (
                        <Link to={`/u/${player.id}`} className="hover:underline">
                          {player.name}
                        </Link>
                      ) : player.name}
                    </div>
                    <div className="text-muted-foreground text-xs md:text-sm">
                      <DelayedNumber value={player.totalScore} /> points • Avg: <DelayedNumber value={getAveragePerRound(player.totalScore)} /> per round
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right flex flex-row md:flex-col items-center md:justify-end gap-2 pl-14 md:pl-0">
                  {activeSystem ? (
                    <div className="md:text-right">
                      <div className="text-lg md:text-2xl font-bold text-foreground tabular-nums">
                        <DelayedNumber value={player.totalScore + (champPtsMap[player.id] ?? 0)} />
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {player.totalScore} pts | Rank: {champPtsMap[player.id] ?? 0} pts
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground">
                        Final Score
                      </div>
                      <div className="text-lg md:text-2xl font-bold text-foreground">
                        <DelayedNumber value={player.totalScore} />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Score Progress Chart */}
        <motion.div
          className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.24, delay: 0.65, type: "spring", stiffness: 150 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">
              Score Progression
            </h3>
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors z-10"
              title="Expand chart to fullscreen"
            >
              <Maximize2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <ScoreProgressChart players={game.players} setIsFullscreen={() => setIsFullscreen()} isFullscreen={isFullscreen} isDark={document.documentElement.classList.contains('dark')} />
        </motion.div>

        {/* Game Statistics */}
        <motion.div
          className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-28"
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.24, delay: 0.7, type: "spring", stiffness: 150 }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Game Statistics
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-6">
            {maxZeroStreak > 0 && (
              <div className="flex flex-col justify-center gap-1 rounded-lg col-span-1 md:col-span-4 bg-muted md:min-h-[4.5rem] overflow-hidden">
                <div className="text-center px-3 py-3">
                  <div className="inline-flex items-center gap-2 text-red-700 dark:text-red-300 text-xs font-medium py-1 px-3 bg-red-500/5 border border-red-500/20 dark:border-red-500/30 rounded-full">
                    <CircleSlash2 className="size-4 shrink-0 text-red-500 dark:text-red-500" aria-hidden />
                    Longest 0-point streak
                  </div>
                  <div className="text-lg md:text-xl font-bold text-foreground leading-tight mt-2">
                    {playersWithLongestZeroStreak.map((p) => p.name).join(', ')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <DelayedNumber value={maxZeroStreak} delay={600} />{' '}
                    {maxZeroStreak === 1 ? 'round' : 'rounds'} in a row
                  </div>
                </div>
              </div>
            )}
            {playersWithNoZeroRounds.length > 0 && (
              <div className="flex flex-col justify-center gap-1 rounded-lg col-span-1 md:col-span-4 bg-muted md:min-h-[4.5rem] overflow-hidden">
                <div className="text-center px-3 py-3">
                  <div className="inline-flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium py-1 px-3 bg-emerald-500/10 border border-emerald-500/25 dark:border-emerald-500/35 rounded-full">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    No scoreless rounds
                  </div>
                  <div className="text-lg md:text-xl font-bold text-foreground leading-tight mt-2">
                    {playersWithNoZeroRounds.map((p) => p.name).join(', ')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Scored in every round ({totalRounds} {totalRounds === 1 ? 'round' : 'rounds'}), never 0
                  </div>
                </div>
              </div>
            )}
            <GameStat color={'stone'} label={'Rounds Played'} value={totalRounds} icon={<Hash size={20}/>} />
            <GameStat color={'yellow'} label={'Players'} value={game.players.length} icon={<UsersRound size={20}/>} />
            <GameStat color={'green'} label={'Average Score'} value={averageScore} icon={<LandPlot size={20}/>} />
            <GameStat color={'red'} label={leaderTotalLabel} value={leaderTotal} icon={<Medal size={20}/>} />
          </div>
          {onDeleteGame && (
            <Button
              variant="outline"
              size={'sm'}
              onClick={() => setIsConfirmingDelete(true)}
              className="mt-4 transition p-4 flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 active:shadow-inner border-l border-border"
            >
              <Trash2 className="w-5 h-5 mr-1" />
              Delete Game
            </Button>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="grid grid-cols-3 gap-0 fixed bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full bg-card/50 border border-border backdrop-blur-md shadow-xl shadow-foreground/10 overflow-hidden w-full max-w-[380px] lg:max-w-sm lg:max-w-fit lg:w-auto"
          initial={{ opacity: 0, bottom: 0 }}
          animate={{ opacity: 1, bottom: '8px' }}
          exit={{ opacity: 0, bottom: 0 }}
          transition={{ duration: 0.12, delay: 0.6, type: "spring", stiffness: 180 }}
        >
          <button
            onClick={onHome}
            className="transition p-4 flex items-center justify-center hover:bg-foreground/10 active:shadow-inner"
          >
            <Home className="w-6 h-6" />
            <span className="ml-2 font-medium">Home</span>
          </button>
          <button
            onClick={onNewGame}
            className="transition p-4 flex items-center justify-center hover:bg-foreground/10 border-x border-x-border active:shadow-inner"
          >
            <BadgePlus className="w-6 h-6" />
            <span className="ml-2 font-medium">New</span>
          </button>
          {onPlayAgainWithSamePlayers && (
            <button
              onClick={onPlayAgainWithSamePlayers}
              className="transition p-4 flex items-center justify-center hover:bg-foreground/10 active:shadow-inner"
            >
              <Repeat className="w-6 h-6" />
              <span className="ml-2 font-medium">Restart</span>
            </button>
          )}
        </motion.div>

        {isConfirmingDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
                <h2 className="text-lg font-bold">Delete game?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete <span className="font-medium text-foreground">{game.name}</span> and all its scores. This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setIsConfirmingDelete(false); onDeleteGame(); }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};