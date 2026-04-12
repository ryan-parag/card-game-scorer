import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CalendarDays, Trophy, Medal, Loader, ShieldHalf } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { useLeagues, computeSeasonStatus } from '../hooks/useLeagues';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import moment from 'moment';

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
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gameCount, setGameCount] = useState(0);

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

  // Build standings from games tagged to this season
  useEffect(() => {
    if (!supabase || !seasonId || !league) return;

    const fetchGames = async () => {
      setGamesLoading(true);
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .eq('season_id', seasonId)
        .eq('status', 'completed');

      if (!games || games.length === 0) {
        setStandings([]);
        setGameCount(0);
        setGamesLoading(false);
        return;
      }

      setGameCount(games.length);

      // Aggregate scores per player, matching by player.id → league member user_id
      const scoreMap: Record<string, {
        displayName: string;
        color: string;
        avatar: string;
        totalScore: number;
        gamesPlayed: number;
      }> = {};

      // Pre-build a lookup of user_id → display name from league members
      const memberMap = Object.fromEntries(
        league.members.map(m => [
          m.user_id,
          m.profile.display_name ?? m.profile.email.split('@')[0],
        ])
      );

      for (const game of games) {
        const players: any[] = game.players ?? [];
        for (const player of players) {
          // Match by player.id (set to user_id when added as a friend)
          const memberId = league.members.find(m => m.user_id === player.id)?.user_id;
          const key = memberId ?? player.name; // fallback to name if not matched
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

      const sorted = Object.entries(scoreMap)
        .map(([, v]) => v)
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((entry, i) => ({ ...entry, userId: '', rank: i + 1 }));

      setStandings(sorted);
      setGamesLoading(false);
    };

    fetchGames();
  }, [seasonId, league]);

  const isLoading = leaguesLoading || gamesLoading;

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

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(`/leagues/${leagueId}`)} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-lg mx-auto mt-16 flex flex-col gap-4">

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

          {/* Standings */}
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <h2 className="text-base font-semibold text-stone-900 dark:text-white flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-stone-400" />
              Standings
              {!isLoading && gameCount > 0 && (
                <span className="text-sm font-normal text-stone-400">
                  ({gameCount} {gameCount === 1 ? 'game' : 'games'})
                </span>
              )}
            </h2>

            {isLoading ? (
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
          </motion.div>

        </div>
      </div>
    </div>
  );
};
