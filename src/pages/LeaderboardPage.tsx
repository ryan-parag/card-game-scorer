import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Loader, Medal } from 'lucide-react';
import moment from 'moment';
import { Game } from '../types/game';
import { getGames, getSettings, saveSettings } from '../utils/storage';
import {
  buildNameGroups,
  buildRoundGroups,
  buildLeaderboard,
  periodCutoff,
  GameGroup,
  LeaderboardEntry,
} from '../utils/leaderboard';
import Topbar from '../components/ui/Topbar';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

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
  const [selectedNameKey, setSelectedNameKey] = useState<string | null>(null);
  const [selectedRoundKey, setSelectedRoundKey] = useState<string | null>(null);

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
  const nameGroups: GameGroup[] = buildNameGroups(eligibleGames);
  const roundGroups: GameGroup[] = selectedNameKey
    ? buildRoundGroups(eligibleGames, selectedNameKey)
    : [];
  const entries: LeaderboardEntry[] = buildLeaderboard(games, period, selectedNameKey, selectedRoundKey);

  // Reset selections when period changes
  const prevPeriod = React.useRef(period);
  if (prevPeriod.current !== period) {
    prevPeriod.current = period;
    setSelectedNameKey(null);
    setSelectedRoundKey(null);
  }

  // If the selected name group no longer exists after data loads, reset
  useEffect(() => {
    if (selectedNameKey !== null && !nameGroups.some((g) => g.key === selectedNameKey)) {
      setSelectedNameKey(null);
      setSelectedRoundKey(null);
    }
  }, [nameGroups, selectedNameKey]);

  // If the selected round group no longer exists (e.g. name changed), reset
  useEffect(() => {
    if (selectedRoundKey !== null && !roundGroups.some((g) => g.key === selectedRoundKey)) {
      setSelectedRoundKey(null);
    }
  }, [roundGroups, selectedRoundKey]);

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center">
          {/* Header */}
          <motion.div
            className="w-full max-w-sm flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px', rotate: 0 }}
            animate={{ opacity: 1, y: '48px', rotate: 2 }}
            exit={{ opacity: 0, y: '80px', rotate: 0 }}
            transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          >
            <motion.div
              className="h-72 w-72 rounded-full absolute left-1/2 -translate-x-1/2 z-0 blur-3xl bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500"
              initial={{ opacity: 0, bottom: '-300px' }}
              animate={{ opacity: .2, bottom: '-200px'  }}
              exit={{ opacity: 0, bottom: '-300px' }}
              transition={{ duration: 0.36, delay: .1, type: "spring", stiffness: 140 }}
            />
            <motion.div
              className="h-48 w-48 rounded-full absolute right-12 z-0 blur-2xl bg-gradient-to-tr from-blue-500 via-teal-500 to-green-500"
              initial={{ opacity: 0, bottom: '-300px' }}
              animate={{ opacity: .12, bottom: '-100px'  }}
              exit={{ opacity: 0, bottom: '-300px' }}
              transition={{ duration: 0.36, delay: .2, type: "spring", stiffness: 140 }}
            />
            <motion.div
              className="h-24 w-24 rounded-full absolute left-0 z-0 blur-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500"
              initial={{ opacity: 0, bottom: '-300px' }}
              animate={{ opacity: .1, bottom: '-48px'  }}
              exit={{ opacity: 0, bottom: '-300px' }}
              transition={{ duration: 0.36, delay: .5, type: "spring", stiffness: 140 }}
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-yellow-400 to-yellow-700 shadow-2xl shadow-yellow-500/50 border border-yellow-500 dark:border-yellow-800">
              <Trophy className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-stone-950 dark:text-white mb-1">
                Leaderboard
              </h1>
              <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base">
                Top 10 scores across completed games
              </p>
            </div>
          </motion.div>

          <motion.div
            className="w-full relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl pt-1 lg:pt-4 pb-4 lg:pb-8 overflow-hidden border border-black/5 dark:border-white/5"
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
            <div className="px-4 lg:px-8 mb-6 flex items-start gap-2">
              {/* Step 1: game name group */}
              <Select
                value={selectedNameKey ?? '__all__'}
                onValueChange={(val) => {
                  setSelectedNameKey(val === '__all__' ? null : val);
                  setSelectedRoundKey(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All games</SelectItem>
                  {nameGroups.map((g) => (
                    <SelectItem key={g.key} value={g.key}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Step 2: round count sub-group */}
              {selectedNameKey && (
                <Select
                  value={selectedRoundKey ?? '__all__'}
                  onValueChange={(val) => setSelectedRoundKey(val === '__all__' ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All rounds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All rounds</SelectItem>
                    {roundGroups.map((g) => (
                      <SelectItem key={g.key} value={g.key}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
