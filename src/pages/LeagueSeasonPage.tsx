import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CalendarDays, Trophy, Medal, Loader, ShieldHalf, Gamepad2, Pencil, FlagOff, ClipboardCheck, BadgePlus, Check, CircleDashed, Flame, Swords, Scale, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import { rowToGame } from '../lib/supabase';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { DatePicker } from '../components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useLeagues, computeSeasonStatus, INDEFINITE_END_DATE, formatSeasonEndDate } from '../hooks/useLeagues';
import { useScoringSystem } from '../hooks/useScoringSystem';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Game } from '../types/game';
import moment from 'moment';
import { formatGameDate } from '../utils/formatGameDate';
import BlurBg from '../components/ui/BlurBg';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../components/ui/hover-card';
import { SeasonProgressChart } from '../components/SeasonProgressChart';
import HoverShim from '../components/ui/HoverShim';
import DelayedNumber from '@/components/ui/DelayedNumber';
import { Tooltip, TooltipProvider } from '../components/ui/tooltip';
import { computeSeasonStandings, SeasonStandingsEntry } from '../utils/seasonStandings';
import { Tag } from '@/components/ui/tag';

type Tab = 'standings' | 'games';

type StandingsEntry = SeasonStandingsEntry;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
        <Trophy className="w-3.5 h-3.5" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground">
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
    <span className="flex items-center justify-center w-7 h-7 text-sm font-semibold tabular-nums text-muted-foreground">
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
  const [standingsMode, setStandingsMode] = useState<'total' | 'game-pts' | 'rank-pts'>('total');
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

  const { leagues, loading: leaguesLoading, updateSeason } = useLeagues(currentUserId);
  const league = leagues.find(l => l.id === leagueId);
  const season = league?.seasons.find(s => s.id === seasonId);
  const isAdmin = league?.members.some(m => m.user_id === currentUserId) ?? false;

  const { systems: scoringSystems } = useScoringSystem(currentUserId);
  const activeSystem = season?.scoring_system_id
    ? scoringSystems.find(s => s.id === season.scoring_system_id) ?? null
    : null;

  const [editingDates, setEditingDates] = useState(false);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editNoEndDate, setEditNoEndDate] = useState(false);
  const [editScoringSystemId, setEditScoringSystemId] = useState<string>('none');
  const [savingDates, setSavingDates] = useState(false);
  const [dateError, setDateError] = useState('');
  const [endingseason, setEndingSeason] = useState(false);

  const openEditDates = () => {
    if (!season) return;
    setEditStart(season.start_date);
    const isIndefinite = season.end_date === INDEFINITE_END_DATE;
    setEditNoEndDate(isIndefinite);
    setEditEnd(isIndefinite ? '' : season.end_date);
    setEditScoringSystemId(season.scoring_system_id ?? 'none');
    setDateError('');
    setEditingDates(true);
  };

  const handleSaveDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonId || !editStart) return;
    if (!editNoEndDate && !editEnd) return;
    setSavingDates(true);
    setDateError('');
    const endDate = editNoEndDate ? INDEFINITE_END_DATE : editEnd;
    const scoringSystemId = editScoringSystemId === 'none' ? null : editScoringSystemId;
    const err = await updateSeason(seasonId, { start_date: editStart, end_date: endDate, scoring_system_id: scoringSystemId });
    setSavingDates(false);
    if (err) { setDateError(err); return; }
    setEditingDates(false);
  };

  const handleEndSeason = async () => {
    if (!seasonId || !confirm('End this season now? This sets the end date to today.')) return;
    setEndingSeason(true);
    const today = new Date().toISOString().split('T')[0];
    await updateSeason(seasonId, { end_date: today, status: 'completed' });
    setEndingSeason(false);
  };

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
      setStandings(computeSeasonStandings(completed, league.members, activeSystem));
      setGamesLoading(false);
    };

    fetchGames();
  }, [seasonId, league, activeSystem]);

  if (leaguesLoading) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(`/leagues/${leagueId}`)} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
          <Loader className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (!league || !season) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(`/leagues/${leagueId}`)} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">Season not found</h1>
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
    upcoming: 'bg-muted text-muted-foreground',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-muted text-muted-foreground',
  };
  const statusLabels = { upcoming: 'Upcoming', active: 'Active', completed: 'Ended' };
  const completedGames = games.filter(g => g.status === 'completed');

  // Season at a glance
  const inProgressGames = games.filter(g => g.status === 'in-progress');
  const totalRounds = completedGames.reduce((sum, g) => sum + g.maxRounds, 0);
  const avgPlayers = completedGames.length > 0
    ? completedGames.reduce((sum, g) => sum + g.players.length, 0) / completedGames.length
    : 0;

  // Spotlight: most dominant win + closest game
  const gameSpotlights = completedGames
    .filter(g => g.players.length >= 2)
    .map(game => {
      const sorted = [...game.players].sort((a, b) =>
        game.ranking === 'low-wins' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore
      );
      return { game, winner: sorted[0], second: sorted[1], gap: Math.abs(sorted[0].totalScore - sorted[1].totalScore) };
    });
  const mostDominant = gameSpotlights.length > 0 ? [...gameSpotlights].sort((a, b) => b.gap - a.gap)[0] : null;
  const closestGame = gameSpotlights.length > 0 ? [...gameSpotlights].sort((a, b) => a.gap - b.gap)[0] : null;

  // Spotlight: current win streak
  const completedSorted = [...completedGames].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  const winStreaks: Record<string, number> = {};
  for (const game of completedSorted) {
    const sorted = [...game.players].sort((a, b) =>
      game.ranking === 'low-wins' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore
    );
    const winnerKey = league.members.find(m => m.user_id === sorted[0].id)?.user_id ?? sorted[0].name;
    for (const player of game.players) {
      const pKey = league.members.find(m => m.user_id === player.id)?.user_id ?? player.name;
      winStreaks[pKey] = pKey === winnerKey ? (winStreaks[pKey] ?? 0) + 1 : 0;
    }
  }
  const topStreakEntry = Object.entries(winStreaks).sort(([, a], [, b]) => b - a)[0];
  const topStreakPlayer = topStreakEntry ? standings.find(s => s.userId === topStreakEntry[0] || s.displayName === topStreakEntry[0]) : null;
  const topStreakCount = topStreakEntry?.[1] ?? 0;

  return (
    <TooltipProvider>
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(`/leagues/${leagueId}`)} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center gap-3">

          <motion.div
            className="w-full flex flex-col text-center items-center gap-3 shadow-lg border border-border bg-card/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, translateY: '80px' }}
            animate={{ opacity: 1, translateY: '0px' }}
            exit={{ opacity: 0, translateY: '80px' }}
            transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          >
            <BlurBg/>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-teal-400 to-teal-700 shadow-2xl shadow-teal-500/50 border border-teal-500 dark:border-teal-800 text-white">
              <CalendarDays className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <span className="text-center text-muted-foreground flex justify-center items-center gap-1">
                <Link to={`/leagues/${leagueId}`}>
                  <Tag type="link">
                    <ShieldHalf className="w-3 h-3" />
                    {league.name}
                  </Tag>
                </Link>
              </span>
              <h1 className="text-lg md:text-2xl font-bold text-foreground mb-1">
                {season.name}
              </h1>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Tag size="sm" color={status === 'active' ? 'success' : status === 'upcoming' ? 'info' : 'default'}>
                  {statusLabels[status]}
                </Tag>
                {
                  statusLabels[status] === 'Active' && (
                    <Tag size="sm" color="secondary">
                      {formatSeasonEndDate(season.end_date) === 'No end date' ? 'No end date' : `Ends in ${moment(season.end_date).fromNow()}`}
                    </Tag>
                  )
                }
              </div>
            </div>
          </motion.div>

          {status === 'completed' && !gamesLoading && standings.length > 0 && (
            <motion.div
              className="w-full bg-gradient-to-b dark:from-muted dark:to-yellow-900/50 from-background to-yellow-500/30 rounded-2xl px-6 py-6 shadow-xl border border-border flex flex-col justify-start items-start"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <p className="text-sm text-muted-foreground mb-1">Season Champion</p>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 border-white/50 shrink-0 relative overflow-hidden"
                  style={{ backgroundColor: standings[0].color }}
                >
                  {standings[0].profileAvatarUrl
                    ? <img src={standings[0].profileAvatarUrl} alt={standings[0].displayName} className="w-full h-full object-cover" />
                    : <PlayerAvatar
                        player={{
                          id: standings[0].userId,
                          name: standings[0].displayName,
                          color: standings[0].color,
                          avatar: standings[0].avatar,
                          totalScore: standings[0].totalScore,
                          roundScores: [],
                        }}
                        index={0}
                      />
                  }
                  <div className="h-7 w-7 p-1.5 inline-flex items-center justify-center rounded-full absolute -bottom-3 -right-3 bg-yellow-500 border-2 border-card">
                    <Trophy size={20} className="text-yellow-900" />
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">{standings[0].displayName}</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <DelayedNumber delay={0} value={standings[0].totalScore} />  pts • <DelayedNumber delay={200} value={standings[0].gamesPlayed} /> {standings[0].gamesPlayed === 1 ? 'game' : 'games'} • <DelayedNumber delay={300} value={standings[0].podiums} /> {standings[0].podiums === 1 ? 'podium' : 'podiums'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!gamesLoading && games.length > 0 && (
            <motion.div
              className="w-full flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.06 }}
            >
              {[
                { label: 'Games Played', value: completedGames.length },
                { label: 'Total Rounds', value: totalRounds },
                { label: 'Avg # Players', value: avgPlayers > 0 ? avgPlayers.toFixed(1) : '—' }
              ].map(({ label, value }) => (
                <Tag key={label} color="default" size="default">
                  <span className="font-normal opacity-70">{label}:</span> {value}
                </Tag>
              ))}
            </motion.div>
          )}

          <motion.div
            className="w-full bg-card rounded-2xl shadow-xl overflow-hidden border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="p-4 pb-0">
              <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
                {([
                  { value: 'standings' as Tab, label: 'Standings', icon: <Trophy className="w-3.5 h-3.5" /> },
                  { value: 'games' as Tab, label: 'Games', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
                ]).map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-sm transition-all duration-200 ${
                      tab === value
                        ? 'bg-background shadow-sm font-medium text-foreground'
                        : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

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
                        <Loader className="w-5 h-5 text-muted-foreground animate-spin" />
                      </div>
                    ) : standings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No completed games in this season yet.</p>
                        <p className="text-xs mt-1 text-muted-foreground/50">
                          Tag a game to this season when creating it.
                        </p>
                      </div>
                    ) : (() => {
                      const displayedStandings = activeSystem
                        ? [...standings]
                            .sort((a, b) =>
                              standingsMode === 'total'    ? (b.champPts + b.rawPts) - (a.champPts + a.rawPts) :
                              standingsMode === 'rank-pts' ? b.champPts - a.champPts :
                 b.rawPts - a.rawPts
                            )
                            .map((entry, i) => ({ ...entry, rank: i + 1 }))
                        : standings;
                      return (
                      <div className="flex flex-col gap-1">
                        {activeSystem && (
                          <div className="flex items-center justify-start gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              Rank by:
                            </span>
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs shadow-inner border border-black/5 dark:border-white/5">
                              {([
                                { value: 'total',    label: 'Total Score' },
                                { value: 'game-pts', label: 'Game Pts' },
                                { value: 'rank-pts', label: 'Rank Pts' },
                              ] as const).map(({ value, label }) => (
                                <button
                                  key={value}
                                  onClick={() => setStandingsMode(value)}
                                  className={`px-2.5 py-1 rounded-md transition-colors ${standingsMode === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-[28px_1fr_auto_80px] items-center gap-x-2 px-3 pb-1">
                          <div />
                          <span className="text-xs text-muted-foreground">Player</span>
                          <span className="text-xs text-muted-foreground text-right px-2">
                            {activeSystem ? 'Score' : 'Pts'}
                          </span>
                          <span className="text-xs text-muted-foreground text-right">1st / Podiums</span>
                        </div>
                        {displayedStandings.map((entry, i) => (
                          <motion.div
                            key={entry.displayName}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.1, delay: 0.04 * i }}
                            className="grid grid-cols-[28px_1fr_auto_80px] items-center gap-x-1 lg:gap-x-2 rounded-xl bg-secondary px-2 lg:px-3 py-2.5"
                          >
                            <RankBadge rank={entry.rank} />
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 overflow-hidden"
                                style={{ backgroundColor: entry.color }}
                              >
                                {entry.profileAvatarUrl
                                  ? <img src={entry.profileAvatarUrl} alt={entry.displayName} className="w-full h-full object-cover" />
                                  : <PlayerAvatar
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
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate text-sm leading-tight">
                                  {entry.userId ? (
                                    <Link to={`/u/${entry.userId}`} className="hover:underline">
                                      {entry.displayName}
                                    </Link>
                                  ) : entry.displayName}
                                </p>
                                <p className="text-xs text-muted-foreground leading-tight">
                                  <DelayedNumber delay={0} value={entry.gamesPlayed} /> {entry.gamesPlayed === 1 ? 'game' : 'games'}
                                </p>
                              </div>
                            </div>
                            {activeSystem ? (
                              <div className="text-right px-2">
                                <p className="text-sm font-bold tabular-nums text-foreground leading-tight">
                                  {
                                    standingsMode === 'total'    ? <DelayedNumber delay={0} value={entry.totalScore} /> :
                                    standingsMode === 'rank-pts' ? <DelayedNumber delay={0} value={entry.champPts} /> :
                                    <DelayedNumber delay={0} value={entry.rawPts} />
                                  }
                                  <br/>
                                  <span className="text-muted-foreground text-xs font-normal">
                                    Avg.&nbsp;
                                    <DelayedNumber delay={0} value={Math.round(entry.totalScore / entry.gamesPlayed)} />
                                  </span>
                                   
                                </p>
                              </div>
                            ) : (
                              <span className="tabular-nums font-semibold text-foreground text-sm text-right px-2">
                                <DelayedNumber delay={0} value={entry.rawPts} />
                              </span>
                            )}
                            <div className="flex flex-col items-end gap-0.5">
                              <Tooltip content={`${entry.wins} Win${entry.wins === 1 ? '' : 's'} • ${entry.podiums} podium${entry.podiums === 1 ? '' : 's'}`}>
                              <div className="flex gap-1 items-center">
                                  <Tag color="default" type="link">
                                    <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
                                    <DelayedNumber delay={0} value={entry.wins} />
                                  </Tag>
                                  <Tag color="default" type="link">
                                    <Medal className="w-3 h-3 text-amber-500 shrink-0" />
                                    <DelayedNumber delay={0} value={entry.podiums} />
                                  </Tag>
                              </div>
                              </Tooltip>
                              <span className="text-muted-foreground text-xs font-normal">{(entry.podiums / entry.gamesPlayed * 100).toFixed(1)}%</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                    })()}
                  </>
                )}

                {tab === 'games' && (
                  <>
                    {!gamesLoading && games.length !== 0 && (
                      <div className="flex justify-end mb-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5 text-xs"
                          onClick={() => navigate('/new-game', { state: { leagueId, seasonId } })}
                        >
                          <BadgePlus className="w-3.5 h-3.5" />
                          New Game
                        </Button>
                      </div>
                    )}
                    {gamesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader className="w-5 h-5 text-muted-foreground animate-spin" />
                      </div>
                    ) : games.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm mb-4">No games tagged to this season yet.</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5 text-xs"
                          onClick={() => navigate('/new-game', { state: { leagueId, seasonId } })}
                        >
                          <BadgePlus className="w-3.5 h-3.5" />
                          New Game
                        </Button>
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
                                className="transition rounded-lg overflow-hidden relative w-full text-left bg-secondary hover:bg-muted h-auto py-4 px-3 lg:px-4 flex group"
                              >
                                <HoverShim/>
                                <div className="flex items-center justify-between w-full">
                                  <div className={`absolute top-0 left-0 lg:relative lg:top-auto lg:left-auto w-5 h-5 lg:w-8 lg:h-8 inline-flex items-center justify-center lg:rounded-full rounded-none rounded-br-md ${game.status === 'completed' ? 'bg-green-600/10' : 'bg-blue-600/10'}`}>
                                    {game.status === 'completed' ? <Check className="w-4 lg:w-5 h-4 lg:h-5 text-green-600 dark:text-green-400" /> : <CircleDashed className="w-4 lg:w-5 h-4 lg:h-5 text-blue-600 dark:text-blue-400" />}
                                  </div>
                                  <div className="flex-1 w-full pl-2 lg:pl-3">
                                    <h3 className="font-medium text-foreground truncate w-full">
                                      {game.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate pb-0.5">
                                      {game.players.length} players • {
                                        game.status === 'completed' ? (
                                          <span className="text-muted-foreground">{game.maxRounds} rounds</span>
                                        )
                                        :
                                        (
                                          <span>Round {game.currentRound}/{game.maxRounds}</span>
                                        )
                                      }
                                      &nbsp;• {`${formatGameDate(game.updatedAt)}`}
                                      {
                                        winner && <>&nbsp;• <span className="inline-flex relative transform translate-y-0.5"><Tag size="sm" color="warning"><Crown className="h-3 w-3"/> {winner.name}</Tag></span></>
                                      }
                                    </p>
                                  </div>
                                  <div className="hidden sm:flex -space-x-2">
                                    {game.players.slice(0, 2).map((player, i) => (
                                      <div
                                        key={i}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-background"
                                        style={{ backgroundColor: player.color }}
                                      >
                                        <PlayerAvatar player={player} index={i} avatarStyle={game.avatarStyle} />
                                      </div>
                                    ))}
                                    {game.players.length > 2 && (
                                      <div className="w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-background">
                                        +{game.players.length - 2}
                                      </div>
                                    )}
                                  </div>
                              </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                        {games.length > completedGames.length && (
                          <p className="text-xs text-center text-muted-foreground pt-1">
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
          {gameSpotlights.length > 0 && (
            <motion.div
              className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.08 }}
            >
              {mostDominant && (
                <div className="bg-card rounded-xl shadow border border-border p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Swords className="w-3.5 h-3.5" />
                    Most Dominant Win
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm truncate">
                      {league.members.find(m => m.user_id === mostDominant.winner.id)?.profile.display_name ?? mostDominant.winner.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{mostDominant.game.name}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">+{mostDominant.gap.toLocaleString()}pts</p>
                  <p className="text-xs text-muted-foreground">margin over 2nd place</p>
                </div>
              )}
              {closestGame && (
                <div className="bg-card rounded-xl shadow border border-border p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Scale className="w-3.5 h-3.5" />
                    Closest Game
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm truncate">
                      {league.members.find(m => m.user_id === closestGame.winner.id)?.profile.display_name ?? closestGame.winner.name} vs {league.members.find(m => m.user_id === closestGame.second.id)?.profile.display_name ?? closestGame.second.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{closestGame.game.name}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {closestGame.gap === 0 ? 'Tied' : `${closestGame.gap.toLocaleString()}pt${closestGame.gap !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-xs text-muted-foreground">margin between 1st and 2nd</p>
                </div>
              )}
            </motion.div>
          )}

          {completedGames.length > 0 && (
            <motion.div
              className="w-full bg-card rounded-2xl shadow-xl p-6 relative z-10"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <h3 className="text-base font-semibold text-foreground mb-4">
                Score Progression
              </h3>
              <SeasonProgressChart
                games={games}
                members={league.members}
                activeSystem={activeSystem}
                seasonStartDate={season.start_date}
                isDark={isDark}
              />
            </motion.div>
          )}

          <motion.div
            className="w-full bg-card rounded-2xl shadow-xl p-6 relative z-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {editingDates ? (
                    <motion.form
                      key="edit"
                      onSubmit={handleSaveDates}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="mt-3 flex flex-col gap-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
                          <DatePicker
                            value={editStart}
                            onChange={setEditStart}
                            placeholder="Pick start date"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">End date</label>
                          {editNoEndDate ? (
                            <div className="h-9 flex items-center text-sm text-muted-foreground italic">No end date</div>
                          ) : (
                            <DatePicker
                              value={editEnd}
                              onChange={setEditEnd}
                              placeholder="Pick end date"
                              min={editStart}
                            />
                          )}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <Checkbox
                          checked={editNoEndDate}
                          onCheckedChange={v => setEditNoEndDate(v === true)}
                        />
                        <span className="text-xs text-muted-foreground">No end date</span>
                      </label>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Scoring system</label>
                        <Select value={editScoringSystemId} onValueChange={setEditScoringSystemId}>
                          <SelectTrigger className="!text-sm !h-9">
                            <SelectValue placeholder="None — use raw score" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None — use raw score</SelectItem>
                            {scoringSystems.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {dateError && <p className="text-xs text-red-500">{dateError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" variant="secondary" disabled={savingDates}>
                          {savingDates ? 'Saving…' : 'Save'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingDates(false)}>
                          Cancel
                        </Button>
                      </div>
                    </motion.form>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-2 border border-border rounded-lg lg:border-transparent w-full overflow-hidden">
                        <div className="flex flex-col item-start w-full overflow-hidden lg:rounded-lg border-b lg:border border-border">
                          <div className="py-2 px-3 text-xs text-muted-foreground bg-transparent lg:bg-muted">Season Start</div>
                          <div className="py-1 px-3">{moment(season.start_date).format('MMM D, YYYY')}</div>
                        </div>
                        <div className="flex flex-col item-start w-full overflow-hidden lg:rounded-lg border-b lg:border border-border">
                          <div className="py-2 px-3 text-xs text-muted-foreground bg-transparent lg:bg-muted">Season End</div>
                          <div className="py-1 px-3">{formatSeasonEndDate(season.end_date) === 'No end date' ? 'No end date' : `${moment(season.end_date).format('MMM D, YYYY')}`}</div>
                        </div>
                        <div className="flex flex-col item-start w-full overflow-hidden lg:rounded-lg border-0 lg:border lg:border-border">
                          <div className="py-2 px-3 text-xs text-muted-foreground bg-transparent lg:bg-muted">Scoring System</div>
                          <div className="py-1 px-3 text-sm">
                            {activeSystem ? (
                              <HoverCard openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-default underline decoration-dotted underline-offset-2">
                                    <ClipboardCheck className="w-4 h-4 shrink-0" />
                                    {activeSystem.name}
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent side="top" align="start">
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
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </AnimatePresence>

                {isAdmin && !editingDates && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={openEditDates} className="gap-1.5 text-xs">
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    {status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={endingseason}
                        onClick={handleEndSeason}
                        className="gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-900 dark:hover:bg-orange-950"
                      >
                        <FlagOff className="w-3 h-3" />
                        {endingseason ? 'Ending…' : 'End season'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
      <motion.div
        className="grid grid-cols-5 gap-0 fixed z-20 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full fixed-button overflow-hidden w-full min-w-[320px] max-w-[320px] lg:w-auto"
        initial={{ opacity: 0, bottom: 0 }}
        animate={{ opacity: 1, bottom: '8px' }}
        exit={{ opacity: 0, bottom: 0 }}
        transition={{ duration: 0.12, delay: 0.6, type: "spring", stiffness: 180 }}
      >
          <button
            onClick={() => navigate('/new-game', { state: { leagueId, seasonId } })}
            className="transition p-4 flex items-center justify-center fixed-button-inner col-span-5"
          >
            <BadgePlus className="w-6 h-6" />
            <span className="ml-2 font-semibold">New Game in Season</span>
          </button>
        </motion.div>
    </div>
    </TooltipProvider>
  );
};
