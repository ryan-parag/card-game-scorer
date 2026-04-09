import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Loader, Medal } from 'lucide-react';
import moment from 'moment';
import { Game } from '../types/game';
import { getGames, getSettings, saveSettings } from '../utils/storage';
import {
  buildGameGroups,
  buildLeaderboard,
  periodCutoff,
  GameGroup,
  LeaderboardEntry,
} from '../utils/leaderboard';
import { Button } from '../components/ui/button';
import Topbar from '../components/ui/Topbar';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';

type Period = 'week' | 'month';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last 30 days' },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
        <Trophy className="w-4 h-4" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
        <Medal className="w-4 h-4" />
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-500 dark:text-orange-400">
        <Medal className="w-4 h-4" />
      </span>
    );
  return (
    <span className="flex items-center justify-center w-8 h-8 text-sm font-semibold tabular-nums text-stone-500 dark:text-stone-400">
      {rank}
    </span>
  );
}

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [gameGroupKey, setGameGroupKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getGames();
      setGames(list);
    } catch (e) {
      console.error(e);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    load();
  }, [load]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  // Only consider completed high-wins games within the selected period for grouping options
  const eligibleGames = games.filter(
    (g) =>
      g.status === 'completed' &&
      g.ranking === 'high-wins' &&
      new Date(g.updatedAt) >= periodCutoff(period)
  );
  const gameGroups: GameGroup[] = buildGameGroups(eligibleGames);
  const entries: LeaderboardEntry[] = buildLeaderboard(games, period, gameGroupKey);

  // Reset group selection when period changes
  const prevPeriod = React.useRef(period);
  if (prevPeriod.current !== period) {
    prevPeriod.current = period;
    setGameGroupKey(null);
  }

  // If the selected group no longer exists after data loads, reset
  useEffect(() => {
    if (
      gameGroupKey !== null &&
      !gameGroups.some((g) => g.key === gameGroupKey)
    ) {
      setGameGroupKey(null);
    }
  }, [gameGroups, gameGroupKey]);

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
              <Trophy className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-950 dark:text-white">
                Leaderboard
              </h1>
              <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base">
                Top 10 scores across completed games
              </p>
            </div>
          </div>

          <motion.div
            className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl pb-4 lg:pb-8 overflow-hidden border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Filters */}
            <div className="w-full p-4 lg:px-8">
              {/* Period toggle */}
              <div className="w-full overflow-hidden grid grid-cols-2 gap-2 bg-stone-200 dark:bg-stone-800 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
                {PERIOD_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPeriod(value)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                      period === value
                        ? 'bg-white dark:bg-stone-950 shadow-sm'
                        : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 lg:px-8 mb-6">
              {/* Game group select */}
              <select
                value={gameGroupKey ?? ''}
                onChange={(e) => setGameGroupKey(e.target.value || null)}
                className="flex-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base px-3 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500"
              >
                <option value="">All games</option>
                {gameGroups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.count} {g.count === 1 ? 'game' : 'games'})
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center flex flex-col items-center py-12">
                <Loader className="w-8 h-8 mb-4 text-stone-400 animate-spin" />
                <p className="text-stone-500 dark:text-stone-400 text-sm">Loading…</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                No completed games found for this period.
              </div>
            ) : (
              <div className="space-y-2 px-4 lg:px-8">
                {entries.map((entry, i) => (
                  <motion.div
                    key={`${entry.gameId}-${entry.playerName}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12, delay: 0.04 * i }}
                    className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800 px-3 py-3"
                  >
                    <RankBadge rank={entry.rank} />

                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 overflow-hidden"
                      style={{ backgroundColor: entry.playerColor }}
                    >
                      <PlayerAvatar
                        player={{
                          id: '',
                          name: entry.playerName,
                          color: entry.playerColor,
                          avatar: entry.playerAvatar,
                          totalScore: entry.score,
                          roundScores: [],
                        }}
                        index={i}
                        avatarStyle={entry.avatarStyle}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-950 dark:text-white truncate">
                        {entry.playerName}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        <Link
                          to={`/game/${entry.gameId}`}
                          className="underline"
                        >
                          {entry.gameName}
                        </Link>
                        {' \u2022 '}{moment(entry.playedAt).fromNow()}
                      </p>
                    </div>

                    <span className="tabular-nums font-semibold text-stone-950 dark:text-white shrink-0">
                      {entry.score.toLocaleString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
