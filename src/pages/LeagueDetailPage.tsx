import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldHalf, Users, CalendarDays, Plus, CircleUserRound,
  Search, Loader, ChevronRight, Crown, UserMinus, Trash2, LogOut, SlidersHorizontal,
  Trophy, Medal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { DatePicker } from '../components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useLeagues, computeSeasonStatus, INDEFINITE_END_DATE, formatSeasonEndDate } from '../hooks/useLeagues';
import type { LeagueMember, LeagueSeason } from '../hooks/useLeagues';
import { useScoringSystem } from '../hooks/useScoringSystem';
import { MemberAvatarGroup } from '../components/ui/MemberAvatarGroup';
import { Profile } from '../hooks/useFriends';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { rowToGame } from '../lib/supabase';
import { Game } from '../types/game';
import moment from 'moment';
import BlurBg from '../components/ui/BlurBg';

interface StandingsEntry {
  userId: string;
  displayName: string;
  color: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
  podiums: number;
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

function SeasonStatusBadge({ status }: { status: 'upcoming' | 'active' | 'completed' }) {
  const styles = {
    upcoming: 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500',
  };
  const labels = { upcoming: 'Upcoming', active: 'Active', completed: 'Ended' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

type Tab = 'seasons' | 'standings' | 'members' | 'admin';

export const LeagueDetailPage = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>('seasons');

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

  const { leagues, loading, addMember, removeMember, deleteSeason, createSeason, deleteLeague, updateLeague } =
    useLeagues(currentUserId);

  const league = leagues.find(l => l.id === leagueId);
  const isAdmin = league?.members.some(m => m.user_id === currentUserId && m.role === 'admin') ?? false;
  const myMembership = league?.members.find(m => m.user_id === currentUserId);

  // ── Member search ──────────────────────────────────────────────────────────
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<Profile[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [addMemberError, setAddMemberError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = memberQuery.trim();
    if (!trimmed || trimmed.length < 2) { setMemberResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      if (!supabase || !currentUserId) return;
      setMemberSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, email, avatar_url, display_name')
        .or(`display_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .neq('id', currentUserId)
        .limit(10);
      setMemberResults(data ?? []);
      setMemberSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [memberQuery, currentUserId]);

  const handleAddMember = async (profile: Profile) => {
    if (!leagueId) return;
    setAddingMemberId(profile.id);
    setAddMemberError('');
    const err = await addMember(leagueId, profile.id);
    if (err) setAddMemberError(err);
    else { setMemberQuery(''); setMemberResults([]); }
    setAddingMemberId(null);
  };

  const handleRemoveMember = async (member: LeagueMember) => {
    const label = member.user_id === currentUserId ? 'leave this league' : `remove ${member.profile.display_name ?? member.profile.email.split('@')[0]}`;
    if (!confirm(`Are you sure you want to ${label}?`)) return;
    await removeMember(member.id);
    if (member.user_id === currentUserId) navigate('/leagues');
  };

  const handleDeleteLeague = async () => {
    if (!leagueId || !confirm('Delete this league? This cannot be undone.')) return;
    await deleteLeague(leagueId);
    navigate('/leagues');
  };

  // ── Edit league name / description ────────────────────────────────────────
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingLeague, setSavingLeague] = useState(false);
  const [leagueEditError, setLeagueEditError] = useState('');
  const [leagueEditSaved, setLeagueEditSaved] = useState(false);
  const [leagueEditInitialised, setLeagueEditInitialised] = useState(false);

  useEffect(() => {
    if (league && !leagueEditInitialised) {
      setEditName(league.name);
      setEditDescription(league.description ?? '');
      setLeagueEditInitialised(true);
    }
  }, [league, leagueEditInitialised]);

  // ── League-wide standings ──────────────────────────────────────────────────
  const [leagueStandings, setLeagueStandings] = useState<StandingsEntry[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  useEffect(() => {
    if (!supabase || !leagueId || !league) return;
    setStandingsLoading(true);

    const memberMap = Object.fromEntries(
      league.members.map(m => [
        m.user_id,
        m.profile.display_name ?? m.profile.email.split('@')[0],
      ])
    );

    supabase
      .from('games')
      .select('*')
      .eq('league_id', leagueId)
      .eq('status', 'completed')
      .then(({ data }) => {
        const completed: Game[] = (data ?? []).map(rowToGame);
        const scoreMap: Record<string, {
          displayName: string; color: string; avatar: string;
          totalScore: number; gamesPlayed: number; podiums: number;
        }> = {};

        for (const game of completed) {
          const rankedPlayers = [...game.players].sort((a, b) =>
            game.ranking === 'low-wins'
              ? (a.totalScore ?? 0) - (b.totalScore ?? 0)
              : (b.totalScore ?? 0) - (a.totalScore ?? 0)
          );
          const podiumKeys = new Set(
            rankedPlayers.slice(0, 3).map(p => {
              const memberId = league.members.find(m => m.user_id === p.id)?.user_id;
              return memberId ?? p.name;
            })
          );

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
                podiums: 0,
              };
            }
            scoreMap[key].totalScore += player.totalScore ?? 0;
            scoreMap[key].gamesPlayed += 1;
            if (podiumKeys.has(key)) scoreMap[key].podiums += 1;
          }
        }

        const sorted = Object.entries(scoreMap)
          .sort(([, a], [, b]) => b.totalScore - a.totalScore)
          .map(([key, entry], i) => ({
            ...entry,
            userId: league.members.some(m => m.user_id === key) ? key : '',
            rank: i + 1,
          }));

        setLeagueStandings(sorted);
        setStandingsLoading(false);
      });
  }, [leagueId, league]);

  // ── Scoring systems (for season picker) ───────────────────────────────────
  const { systems: scoringSystems } = useScoringSystem(currentUserId);

  // ── Create season ──────────────────────────────────────────────────────────
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [seasonScoringSystemId, setSeasonScoringSystemId] = useState<string>('none');
  const [creatingseason, setCreatingSeason] = useState(false);
  const [seasonError, setSeasonError] = useState('');

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId || !seasonName || !seasonStart) return;
    if (!noEndDate && !seasonEnd) return;
    setCreatingSeason(true);
    setSeasonError('');
    const endDate = noEndDate ? INDEFINITE_END_DATE : seasonEnd;
    const err = await createSeason(
      leagueId, seasonName, seasonStart, endDate,
      seasonScoringSystemId === 'none' ? null : seasonScoringSystemId
    );
    setCreatingSeason(false);
    if (err) { setSeasonError(err); return; }
    setSeasonName(''); setSeasonStart(''); setSeasonEnd(''); setNoEndDate(false);
    setSeasonScoringSystemId('none');
    setShowCreateSeason(false);
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/leagues')} />
        <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center">
          <Loader className="w-6 h-6 text-stone-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/leagues')} />
        <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-2">League not found</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">This league doesn't exist or you're not a member.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/leagues')}>Back to leagues</Button>
          </div>
        </div>
      </div>
    );
  }

  const memberAlreadyInLeague = (profileId: string) =>
    league.members.some(m => m.user_id === profileId);

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/leagues')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center gap-3">
          <motion.div
            className="w-full flex flex-col text-center items-center gap-3 shadow-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px' }}
            animate={{ opacity: 1, y: '0px' }}
            exit={{ opacity: 0, y: '80px' }}
            transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          >
            <BlurBg/>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-700 shadow-2xl shadow-indigo-500/50 border border-indigo-500 dark:border-indigo-800 text-white">
              <ShieldHalf className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-stone-950 dark:text-white mb-1">
                {league.name}
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {league.description}
              </p>
            </div>
            <MemberAvatarGroup members={league.members} max={5} />
          </motion.div>

          {/* Tab card */}
          <motion.div
            className="w-full relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            {/* Tab strip */}
            <div className="p-4 pb-0">
              <div className={`grid gap-1.5 bg-stone-200 dark:bg-stone-800 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {([
                  { value: 'seasons' as Tab, label: 'Seasons', icon: <CalendarDays className="w-3.5 h-3.5" /> },
                  { value: 'standings' as Tab, label: 'Standings', icon: <Trophy className="w-3.5 h-3.5" /> },
                  { value: 'members' as Tab, label: 'Members', icon: <Users className="w-3.5 h-3.5" /> },
                  ...(isAdmin ? [{ value: 'admin' as Tab, label: 'Admin', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> }] : []),
                ] as { value: Tab; label: string; icon: React.ReactNode }[]).map(({ value, label, icon }) => (
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
                {/* ── Seasons ── */}
                {tab === 'seasons' && (
                  <>
                    {isAdmin && (
                      <div className="mb-4">
                        <Button size="sm" variant="outline" onClick={() => setShowCreateSeason(v => !v)} className="gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          New season
                        </Button>
                      </div>
                    )}
                    <AnimatePresence>
                      {showCreateSeason && (
                        <motion.form
                          onSubmit={handleCreateSeason}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4"
                        >
                          <div className="flex flex-col gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                            <Input
                              placeholder="Season name (e.g. Season 1)"
                              value={seasonName}
                              onChange={e => setSeasonName(e.target.value)}
                              required
                              autoFocus
                              className="!px-3 !py-2 !text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">Start date</label>
                                <DatePicker value={seasonStart} onChange={setSeasonStart} placeholder="Pick start date" />
                              </div>
                              <div>
                                <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">End date</label>
                                {noEndDate ? (
                                  <div className="h-9 flex items-center text-sm text-stone-400 dark:text-stone-500 italic">No end date</div>
                                ) : (
                                  <DatePicker value={seasonEnd} onChange={setSeasonEnd} placeholder="Pick end date" min={seasonStart} />
                                )}
                              </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer w-fit">
                              <Checkbox checked={noEndDate} onCheckedChange={v => setNoEndDate(v === true)} />
                              <span className="text-xs text-stone-500 dark:text-stone-400">No end date</span>
                            </label>
                            <div>
                              <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">Scoring system (optional)</label>
                              <Select value={seasonScoringSystemId} onValueChange={setSeasonScoringSystemId}>
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
                            {seasonError && <p className="text-xs text-red-500">{seasonError}</p>}
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" variant="secondary" disabled={creatingseason}>
                                {creatingseason ? 'Creating…' : 'Create season'}
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateSeason(false)}>Cancel</Button>
                            </div>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                    {league.seasons.length === 0 ? (
                      <div className="text-center py-8 text-stone-400 dark:text-stone-600 text-sm">
                        <CalendarDays className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        No seasons yet{isAdmin ? ' — create one above' : ''}
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {league.seasons.map(season => (
                          <SeasonRow
                            key={season.id}
                            season={season}
                            status={computeSeasonStatus(season.start_date, season.end_date)}
                            isAdmin={isAdmin}
                            leagueId={league.id}
                            onDelete={deleteSeason}
                          />
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {/* ── Standings ── */}
                {tab === 'standings' && (
                  <>
                    {standingsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader className="w-5 h-5 text-stone-400 animate-spin" />
                      </div>
                    ) : leagueStandings.length === 0 ? (
                      <div className="text-center py-8 text-stone-400 dark:text-stone-600 text-sm">
                        <Trophy className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        No completed games yet
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="grid grid-cols-[28px_1fr_56px_72px] items-center gap-x-2 px-3 pb-1">
                          <div />
                          <span className="text-xs text-stone-400 dark:text-stone-500">Player</span>
                          <span className="text-xs text-stone-400 dark:text-stone-500 text-right">Pts</span>
                          <span className="text-xs text-stone-400 dark:text-stone-500 text-right">Podiums</span>
                        </div>
                        {leagueStandings.map((entry, i) => (
                          <motion.div
                            key={entry.displayName}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.1, delay: 0.04 * i }}
                            className="grid grid-cols-[28px_1fr_56px_72px] items-center gap-x-2 rounded-xl bg-stone-50 dark:bg-stone-800 px-3 py-2.5"
                          >
                            <RankBadge rank={entry.rank} />
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 overflow-hidden"
                                style={{ backgroundColor: entry.color }}
                              >
                                <PlayerAvatar
                                  player={{ id: '', name: entry.displayName, color: entry.color, avatar: entry.avatar, totalScore: entry.totalScore, roundScores: [] }}
                                  index={i}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-stone-900 dark:text-white truncate text-sm leading-tight">
                                  {entry.userId ? (
                                    <Link to={`/u/${entry.userId}`} className="hover:underline">{entry.displayName}</Link>
                                  ) : entry.displayName}
                                </p>
                                <p className="text-xs text-stone-400 dark:text-stone-500 leading-tight">
                                  {entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'game' : 'games'}
                                </p>
                              </div>
                            </div>
                            <span className="tabular-nums font-semibold text-stone-900 dark:text-white text-sm text-right">
                              {entry.totalScore.toLocaleString()}
                            </span>
                            <div className="flex items-center justify-end gap-1">
                              <Medal className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="tabular-nums text-sm font-medium text-stone-700 dark:text-stone-300">{entry.podiums}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ── Members ── */}
                {tab === 'members' && (
                  <>
                    {isAdmin && (
                      <div className="mb-4">
                        <Button size="sm" variant="outline" onClick={() => setShowAddMember(v => !v)} className="gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          Add member
                        </Button>
                      </div>
                    )}
                    <AnimatePresence>
                      {showAddMember && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                            <div className="flex items-center gap-0">
                              <div className="inline-flex h-full px-1">
                                <Search className="w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                              </div>
                              <Input
                                placeholder="Search by name or email…"
                                value={memberQuery}
                                onChange={e => setMemberQuery(e.target.value)}
                                autoFocus
                                className="!pl-8 !px-3 !py-1.5 !text-sm"
                                autoComplete="off"
                              />
                            </div>
                            {addMemberError && <p className="text-xs text-red-500 mt-1.5">{addMemberError}</p>}
                            {memberSearching && (
                              <div className="flex justify-center py-3">
                                <Loader className="w-4 h-4 animate-spin text-stone-400" />
                              </div>
                            )}
                            {!memberSearching && memberResults.length > 0 && (
                              <ul className="mt-2 flex flex-col gap-1">
                                {memberResults.map(p => {
                                  const name = p.display_name ?? p.email.split('@')[0];
                                  const already = memberAlreadyInLeague(p.id);
                                  return (
                                    <li key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-white dark:bg-stone-900">
                                      <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex-shrink-0">
                                        {p.avatar_url
                                          ? <img src={p.avatar_url} className="w-full h-full object-cover" />
                                          : <CircleUserRound className="w-full h-full p-0.5 text-stone-400" />}
                                      </div>
                                      <span className="flex-1 text-sm text-stone-800 dark:text-stone-200 truncate">{name}</span>
                                      <Button
                                        size="sm"
                                        variant={already ? 'outline' : 'secondary'}
                                        disabled={already || addingMemberId === p.id}
                                        onClick={() => !already && handleAddMember(p)}
                                        className="text-xs h-6 px-2"
                                      >
                                        {already ? 'Added' : addingMemberId === p.id ? '…' : 'Add'}
                                      </Button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <ul className="flex flex-col gap-2">
                      {league.members.map(member => {
                        const name = member.profile.display_name ?? member.profile.email.split('@')[0];
                        const isMe = member.user_id === currentUserId;
                        return (
                          <li key={member.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex-shrink-0">
                              {member.profile.avatar_url
                                ? <img src={member.profile.avatar_url} className="w-full h-full object-cover" />
                                : <CircleUserRound className="w-full h-full p-1 text-stone-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link to={`/u/${member.user_id}`} className="text-sm font-medium text-stone-900 dark:text-white hover:underline truncate block">
                                {name}{isMe && <span className="text-stone-400 font-normal ml-1">(you)</span>}
                              </Link>
                              {member.role === 'admin' && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                                  <Crown className="w-3 h-3" /> Admin
                                </span>
                              )}
                            </div>
                            {(isAdmin && !isMe) && (
                              <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member)} className="text-stone-400 hover:text-red-500 flex-shrink-0">
                                <UserMinus className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {(!isAdmin && isMe) && (
                              <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member)} className="gap-1 text-xs text-stone-400 flex-shrink-0">
                                <LogOut className="w-3.5 h-3.5" />
                                Leave
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {/* ── Admin ── */}
                {tab === 'admin' && isAdmin && (
                  <>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setSavingLeague(true);
                        setLeagueEditError('');
                        setLeagueEditSaved(false);
                        const err = await updateLeague(leagueId!, {
                          name: editName.trim() || league.name,
                          description: editDescription.trim() || null,
                        });
                        setSavingLeague(false);
                        if (err) { setLeagueEditError(err); }
                        else { setLeagueEditSaved(true); setTimeout(() => setLeagueEditSaved(false), 2500); }
                      }}
                      className="flex flex-col gap-2"
                    >
                      <div>
                        <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">League name</label>
                        <Input
                          placeholder={league.name}
                          value={editName}
                          onChange={e => { setEditName(e.target.value); setLeagueEditSaved(false); }}
                          className="!px-3 !py-2 !text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">Description</label>
                        <Input
                          placeholder={league.description ?? 'Add a description…'}
                          value={editDescription}
                          onChange={e => { setEditDescription(e.target.value); setLeagueEditSaved(false); }}
                          className="!px-3 !py-2 !text-sm"
                        />
                      </div>
                      {leagueEditError && <p className="text-xs text-red-500">{leagueEditError}</p>}
                      <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" variant="secondary" disabled={savingLeague}>
                          {savingLeague ? 'Saving…' : 'Save changes'}
                        </Button>
                        {leagueEditSaved && <span className="text-xs text-green-600 dark:text-green-400">Saved</span>}
                      </div>
                    </form>
                    <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteLeague}
                        className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete league
                      </Button>
                    </div>
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

function SeasonRow({
  season,
  status,
  isAdmin,
  leagueId,
  onDelete,
}: {
  season: LeagueSeason;
  status: 'upcoming' | 'active' | 'completed';
  isAdmin: boolean;
  leagueId: string;
  onDelete: (id: string) => Promise<string | null>;
}) {
  const navigate = useNavigate();
  const statusStyles = {
    upcoming: 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500',
  };
  const statusLabels = { upcoming: 'Upcoming', active: 'Active', completed: 'Ended' };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${season.name}"? This cannot be undone.`)) return;
    await onDelete(season.id);
  };

  return (
    <li
      onClick={() => navigate(`/leagues/${leagueId}/seasons/${season.id}`)}
      className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/70 px-3 py-3 cursor-pointer group transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
        <CalendarDays className="h-4 w-4 text-stone-500 dark:text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{season.name}</p>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {moment(season.start_date).format('MMM D, YYYY')} – {formatSeasonEndDate(season.end_date) === 'No end date' ? 'No end date' : moment(season.end_date).format('MMM D, YYYY')}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className="text-stone-400 hover:text-red-500 h-7 w-7 p-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" />
      </div>
    </li>
  );
}
