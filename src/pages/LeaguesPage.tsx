import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldHalf, Plus, Users, CalendarDays, ChevronRight, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useLeagues, computeSeasonStatus } from '../hooks/useLeagues';
import type { League } from '../hooks/useLeagues';

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

function LeagueCard({ league, onClick }: { league: League; onClick: () => void }) {
  const activeSeason = league.seasons.find(
    s => computeSeasonStatus(s.start_date, s.end_date) === 'active'
  ) ?? league.seasons[0];

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/70 px-4 py-4 transition-colors group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
        <ShieldHalf className="w-5 h-5 text-stone-500 dark:text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 dark:text-white truncate">{league.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <Users className="w-3 h-3" />
            {league.members.length} {league.members.length === 1 ? 'member' : 'members'}
          </span>
          {activeSeason ? (
            <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
              <CalendarDays className="w-3 h-3" />
              {activeSeason.name}
              <SeasonStatusBadge status={computeSeasonStatus(activeSeason.start_date, activeSeason.end_date)} />
            </span>
          ) : (
            <span className="text-xs text-stone-400 dark:text-stone-500">No seasons yet</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" />
    </motion.button>
  );
}

export const LeaguesPage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

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

  const { leagues, loading, createLeague } = useLeagues(currentUserId);

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

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-lg mx-auto mt-16">
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 lg:p-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
                  <ShieldHalf className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-stone-900 dark:text-white">Leagues</h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Play with friends in seasons</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setShowCreate(v => !v); setCreateError(''); }}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>

            {/* Create form */}
            <AnimatePresence>
              {showCreate && (
                <motion.form
                  onSubmit={handleCreate}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
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

            {/* List */}
            {loading ? (
              <div className="flex items-center gap-2 text-stone-400 py-8 justify-center">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : leagues.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-stone-400 dark:text-stone-600">
                <ShieldHalf className="w-8 h-8" />
                <p className="text-sm">No leagues yet — create one above</p>
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
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
