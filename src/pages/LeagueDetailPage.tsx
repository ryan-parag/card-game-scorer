import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldHalf, Users, CalendarDays, Plus, CircleUserRound,
  Search, Loader, ChevronRight, Crown, UserMinus, Trash2, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useLeagues, computeSeasonStatus } from '../hooks/useLeagues';
import type { LeagueMember, LeagueSeason } from '../hooks/useLeagues';
import { Profile } from '../hooks/useFriends';
import moment from 'moment';

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

export const LeagueDetailPage = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

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

  const { leagues, loading, addMember, removeMember, deleteSeason, createSeason, deleteLeague } =
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

  // ── Create season ──────────────────────────────────────────────────────────
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');
  const [creatingseason, setCreatingSeason] = useState(false);
  const [seasonError, setSeasonError] = useState('');

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId || !seasonName || !seasonStart || !seasonEnd) return;
    setCreatingSeason(true);
    setSeasonError('');
    const err = await createSeason(leagueId, seasonName, seasonStart, seasonEnd);
    setCreatingSeason(false);
    if (err) { setSeasonError(err); return; }
    setSeasonName(''); setSeasonStart(''); setSeasonEnd('');
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
        <div className="w-full max-w-lg mx-auto mt-16 flex flex-col gap-4">

          {/* League header card */}
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <ShieldHalf className="w-5 h-5 text-stone-500 dark:text-stone-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-stone-900 dark:text-white">{league.name}</h1>
                {league.description && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{league.description}</p>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
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
            )}
          </motion.div>

          {/* Members card */}
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-400" />
                Members
                <span className="text-sm font-normal text-stone-400">({league.members.length})</span>
              </h2>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setShowAddMember(v => !v)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              )}
            </div>

            {/* Add member search */}
            <AnimatePresence>
              {showAddMember && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
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

            {/* Members list */}
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
                      <Link
                        to={`/u/${member.user_id}`}
                        className="text-sm font-medium text-stone-900 dark:text-white hover:underline truncate block"
                      >
                        {name}{isMe && <span className="text-stone-400 font-normal ml-1">(you)</span>}
                      </Link>
                      {member.role === 'admin' && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                          <Crown className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                    {(isAdmin && !isMe) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveMember(member)}
                        className="text-stone-400 hover:text-red-500 flex-shrink-0"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {(!isAdmin && isMe) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveMember(member)}
                        className="gap-1 text-xs text-stone-400 flex-shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Seasons card */}
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-stone-400" />
                Seasons
                <span className="text-sm font-normal text-stone-400">({league.seasons.length})</span>
              </h2>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setShowCreateSeason(v => !v)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  New season
                </Button>
              )}
            </div>

            {/* Create season form */}
            <AnimatePresence>
              {showCreateSeason && (
                <motion.form
                  onSubmit={handleCreateSeason}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
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
                        <Input
                          type="date"
                          value={seasonStart}
                          onChange={e => setSeasonStart(e.target.value)}
                          required
                          className="!px-3 !py-2 !text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">End date</label>
                        <Input
                          type="date"
                          value={seasonEnd}
                          onChange={e => setSeasonEnd(e.target.value)}
                          required
                          min={seasonStart}
                          className="!px-3 !py-2 !text-sm"
                        />
                      </div>
                    </div>
                    {seasonError && <p className="text-xs text-red-500">{seasonError}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" variant="secondary" disabled={creatingseason}>
                        {creatingseason ? 'Creating…' : 'Create season'}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateSeason(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Seasons list */}
            {league.seasons.length === 0 ? (
              <div className="text-center py-6 text-stone-400 dark:text-stone-600 text-sm">
                No seasons yet{isAdmin ? ' — create one above' : ''}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {league.seasons.map(season => {
                  const status = computeSeasonStatus(season.start_date, season.end_date);
                  return (
                    <SeasonRow
                      key={season.id}
                      season={season}
                      status={status}
                      isAdmin={isAdmin}
                      leagueId={league.id}
                      onDelete={deleteSeason}
                    />
                  );
                })}
              </ul>
            )}
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{season.name}</p>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {moment(season.start_date).format('MMM D, YYYY')} – {moment(season.end_date).format('MMM D, YYYY')}
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
