import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldHalf, Plus, CalendarDays, ChevronRight, Loader, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useLeagues, computeSeasonStatus } from '../hooks/useLeagues';
import type { League, DiscoverableLeague } from '../hooks/useLeagues';
import { MemberAvatarGroup } from '../components/ui/MemberAvatarGroup';
import BlurBg from '../components/ui/BlurBg';
import HoverShim from '../components/ui/HoverShim';

function SeasonStatusBadge({ status }: { status: 'upcoming' | 'active' | 'completed' }) {
  const styles = {
    upcoming: 'bg-muted text-muted-foreground',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-muted text-muted-foreground',
  };
  const labels = { upcoming: 'Upcoming', active: 'Active', completed: 'Ended' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function LeagueCard({ league, onClick }: { league: League; onClick: () => void }) {
  const activeSeason = league.seasons.find(
    s => computeSeasonStatus(s.start_date, s.end_date) === 'active'
  ) ?? league.seasons[0];

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 rounded-xl bg-secondary hover:bg-muted px-4 py-4 transition-colors group relative"
    >
      <HoverShim/>
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
        <ShieldHalf className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{league.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {activeSeason ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="w-3 h-3" />
              {activeSeason.name}
              <SeasonStatusBadge status={computeSeasonStatus(activeSeason.start_date, activeSeason.end_date)} />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No seasons yet</span>
          )}
        </div>
      </div>
      <div className="hidden lg:inline-flex">
        <MemberAvatarGroup members={league.members} max={4} size="sm" />
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
    </motion.button>
  );
}

function DiscoverLeagueCard({
  league,
  joining,
  onJoin,
}: {
  league: DiscoverableLeague;
  joining: boolean;
  onJoin: () => void;
}) {
  const activeSeason = league.seasons.find(
    s => computeSeasonStatus(s.start_date, s.end_date) === 'active'
  ) ?? league.seasons[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center gap-4 rounded-xl bg-secondary px-4 py-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
        <ShieldHalf className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{league.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {activeSeason ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="w-3 h-3" />
              {activeSeason.name}
              <SeasonStatusBadge status={computeSeasonStatus(activeSeason.start_date, activeSeason.end_date)} />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No seasons yet</span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {league.member_count}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={onJoin}
        disabled={joining}
        className="flex-shrink-0"
      >
        {joining ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Join'}
      </Button>
    </motion.div>
  );
}

export const LeaguesPage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [tab, setTab] = useState<'my' | 'discover'>('my');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState('');

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

  const { leagues, discoverableLeagues, loading, discoverLoading, createLeague, joinLeague } = useLeagues(currentUserId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    const err = await createLeague(newName, newDescription);
    setCreating(false);
    if (err) {
      setCreateError(err);
    } else {
      setNewName('');
      setNewDescription('');
      setShowCreate(false);
    }
  };

  const handleJoin = async (leagueId: string) => {
    setJoiningId(leagueId);
    setJoinError('');
    const err = await joinLeague(leagueId);
    setJoiningId(null);
    if (err) {
      setJoinError(err);
    } else {
      setTab('my');
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center">
          <motion.div
            className="w-full max-w-sm flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-border bg-card/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px', rotate: 0 }}
            animate={{ opacity: 1, y: '48px', rotate: 2 }}
            exit={{ opacity: 0, y: '80px', rotate: 0 }}
            transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          >
            <BlurBg/>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-700 shadow-2xl shadow-indigo-500/50 border border-indigo-500 dark:border-indigo-800 text-white">
              <ShieldHalf className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
                Leagues
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Play with friends in seasons
              </p>
            </div>
          </motion.div>
          <motion.div
            className="w-full relative z-10 bg-card rounded-2xl shadow-xl px-4 pt-4 pb-4 overflow-hidden border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tabs + header action */}
            <div className="flex items-center justify-between mb-4">
              <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
                {(['my', 'discover'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      tab === t
                        ? 'bg-background shadow-sm text-foreground font-bold'
                        : 'bg-transparent text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {t === 'my' ? 'My Leagues' : 'Discover'}
                  </button>
                ))}
              </div>
              {tab === 'my' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setShowCreate(v => !v); setCreateError(''); }}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  New
                </Button>
              )}
            </div>

            {/* Create form */}
            <AnimatePresence>
              {tab === 'my' && showCreate && (
                <motion.form
                  onSubmit={handleCreate}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-secondary/50">
                    <Input
                      placeholder="League name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                      autoFocus
                      className="!px-3 !py-2 !text-sm"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      className="!px-3 !py-2 !text-sm"
                    />
                    {createError && <p className="text-xs text-red-500">{createError}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" variant="secondary" disabled={creating || !newName.trim()}>
                        {creating ? 'Creating…' : 'Create league'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowCreate(false); setNewName(''); setNewDescription(''); setCreateError(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* My Leagues list */}
            {tab === 'my' && (
              loading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : leagues.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <ShieldHalf className="w-8 h-8" />
                  <p className="text-sm">No leagues yet — create one or discover below</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {leagues.map(league => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      onClick={() => navigate(`/leagues/${league.id}`)}
                    />
                  ))}
                </div>
              )
            )}

            {/* Discover list */}
            {tab === 'discover' && (
              discoverLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : discoverableLeagues.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <ShieldHalf className="w-8 h-8" />
                  <p className="text-sm">No other leagues found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {joinError && <p className="text-xs text-red-500 mb-1">{joinError}</p>}
                  {discoverableLeagues.map(league => (
                    <DiscoverLeagueCard
                      key={league.id}
                      league={league}
                      joining={joiningId === league.id}
                      onJoin={() => handleJoin(league.id)}
                    />
                  ))}
                </div>
              )
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
