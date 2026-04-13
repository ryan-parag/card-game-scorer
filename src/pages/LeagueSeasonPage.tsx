import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CalendarDays, Trophy, Medal, Loader, ShieldHalf, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import { rowToGame } from '../lib/supabase';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { useLeagues, computeSeasonStatus } from '../hooks/useLeagues';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Game } from '../types/game';
import moment from 'moment';

type Tab = 'standings' | 'games';

interface StandingsEntry {
  userId: string;
  displayName: string;
  color: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
  rank: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
        <Trophy className="w-3.5 h-3.5" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
        <Medal className="w-3.5 h-3.5" />
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-500 dark:text-orange-400">
        <Medal className="w-3.5 h-3.5" />
      </span>
    );
  return (
    <span className="flex items-center justify-center w-7 h-7 text-sm font-semibold tabular-nums text-stone-500 dark:text-stone-400">
      {rank}
    </span>
  );
}

export const LeagueSeasonPage = () => {
  const { leagueId, seasonId } = useParams<{ leagueId: string; seasonId: string }>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>('standings');
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    supabase?.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  const { leagues, loading: leaguesLoading } = useLeagues(currentUserId);
  const league = leagues.find(l => l.id === leagueId);
  const season = league?.seasons.find(s => s.id === seasonId);

  useEffect(() => {
    if (!supabase || !seasonId || !league) return;

    const fetchGames = async () => {
      setGamesLoading(true);
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('season_id', seasonId)
        .order('updated_at', { ascending: false });

      const allGames: Game[] = (data ?? []).map(rowToGame);
      const completed = allGames.filter(g => g.status === 'completed');

      setGames(allGames);

      // Build standings from completed games only
      const memberMap = Object.fromEntries(
        league.members.map(m => [
          m.user_id,
          m.profile.display_name ?? m.profile.email.split('@')[0],
        ])
      );

      const scoreMap: Record<string, {
        displayName: string; color: string; avatar: string;
        totalScore: number; gamesPlayed: number;
      }> = {};

      for (const game of completed) {
        for (const player of game.players) {
          const memberId = league.members.find(m => m.user_id === player.id)?.user_id;
          const key = memberId ?? player.name;
          if (!scoreMap[key]) {
            scoreMap[key] = {
              displayName: memberId ? (memberMap[memberId] ?? player.name) : player.name,
              color: player.color ?? '#888',
              avatar: player.avatar ?? '',
              totalScore: 0,
              gamesPlayed: 0,
            };
          }
          scoreMap[key].totalScore += player.totalScore ?? 0;
          scoreMap[key].gamesPlayed += 1;
        }
      }

      const sorted = Object.values(scoreMap)
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((entry, i) => ({ ...entry, userId: '', rank: i + 1 }));

      setStandings(sorted);
      setGamesLoading(false);
    };

    fetchGames();
  }, [seasonId, league]);

  if (leaguesLoading) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(`/leagues/${leagueId}`)} />
        <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center">
          <Loader className="w-6 h-6 text-stone-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!league || !season) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(`/leagues/${leagueId}`)} />
        <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Season not found</h1>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/leagues/${leagueId}`)}>
              Back to league
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status = computeSeasonStatus(season.start_date, season.end_date);
  const statusStyles = {
    upcoming: 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500',
  };
  const statusLabels = { upcoming: 'Upcoming', active: 'Active', completed: 'Ended' };
  const completedGames = games.filter(g => g.status === 'completed');

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(`/leagues/${leagueId}`)} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col gap-4">

          {/* Season header */}
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-stone-500 dark:text-stone-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-stone-900 dark:text-white">{season.name}</h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
                    {statusLabels[status]}
                  </span>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1">
                  <ShieldHalf className="w-3.5 h-3.5" />
                  <Link to={`/leagues/${leagueId}`} className="hover:underline">{league.name}</Link>
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                  {moment(season.start_date).format('MMM D, YYYY')} – {moment(season.end_date).format('MMM D, YYYY')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tab card */}
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            {/* Tab toggle */}
            <div className="p-4 pb-0">
              <div className="grid grid-cols-2 gap-2 bg-stone-200 dark:bg-stone-800 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
                {([
                  { value: 'standings' as Tab, label: 'Standings', icon: <Trophy className="w-3.5 h-3.5" /> },
                  { value: 'games' as Tab, label: 'Games', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
                ]).map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-sm transition-all duration-200 ${
                      tab === value
                        ? 'bg-white dark:bg-stone-950 shadow-sm font-medium text-stone-900 dark:text-white'
                        : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="p-4 lg:p-6"
              >
                {tab === 'standings' && (
                  <>
                    {gamesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader className="w-5 h-5 text-stone-400 animate-spin" />
                      </div>
                    ) : standings.length === 0 ? (
                      <div className="text-center py-8 text-stone-400 dark:text-stone-600">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No completed games in this season yet.</p>
                        <p className="text-xs mt-1 text-stone-300 dark:text-stone-700">
                          Tag a game to this season when creating it.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {standings.map((entry, i) => (
                          <motion.div
                            key={entry.displayName}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.1, delay: 0.04 * i }}
                            className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800 px-3 py-3"
                          >
                            <RankBadge rank={entry.rank} />
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 overflow-hidden"
                              style={{ backgroundColor: entry.color }}
                            >
                              <PlayerAvatar
                                player={{
                                  id: '',
                                  name: entry.displayName,
                                  color: entry.color,
                                  avatar: entry.avatar,
                                  totalScore: entry.totalScore,
                                  roundScores: [],
                                }}
                                index={i}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-stone-900 dark:text-white truncate text-sm">
                                {entry.displayName}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                {entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'game' : 'games'}
                              </p>
                            </div>
                            <span className="tabular-nums font-semibold text-stone-900 dark:text-white text-sm shrink-0">
                              {entry.totalScore.toLocaleString()}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {tab === 'games' && (
                  <>
                    {gamesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader className="w-5 h-5 text-stone-400 animate-spin" />
                      </div>
                    ) : games.length === 0 ? (
                      <div className="text-center py-8 text-stone-400 dark:text-stone-600">
                        <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No games tagged to this season yet.</p>
                        <p className="text-xs mt-1 text-stone-300 dark:text-stone-700">
                          Select this season when creating a new game.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {games.map((game, i) => {
                          const winner = game.status === 'completed'
                            ? [...game.players].sort((a, b) =>
                                game.ranking === 'low-wins'
                                  ? a.totalScore - b.totalScore
                                  : b.totalScore - a.totalScore
                              )[0]
                            : null;
                          return (
                            <motion.div
                              key={game.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.1, delay: 0.04 * i }}
                            >
                              <Link
                                to={`/game/${game.id}`}
                                className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/70 px-3 py-3 transition-colors group"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                                      {game.name}
                                    </p>
                                    {game.status === 'in-progress' && (
                                      <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                        Live
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <p className="text-xs text-stone-500 dark:text-stone-400">
                                      {game.players.length} players · {game.maxRounds} rounds
                                    </p>
                                    {winner && (
                                      <p className="text-xs text-stone-500 dark:text-stone-400">
                                        · Winner: <span className="font-medium text-stone-700 dark:text-stone-300">{winner.name}</span> ({winner.totalScore.toLocaleString()})
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-xs text-stone-400 dark:text-stone-500">
                                    {moment(game.updatedAt).fromNow()}
                                  </p>
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                        {games.length > completedGames.length && (
                          <p className="text-xs text-center text-stone-400 dark:text-stone-600 pt-1">
                            {games.length - completedGames.length} game{games.length - completedGames.length !== 1 ? 's' : ''} still in progress — standings update when completed
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
