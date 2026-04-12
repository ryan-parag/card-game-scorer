import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CircleUserRound, Search, UserCheck, UserPlus, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Profile } from '../hooks/useFriends';
import { useFriends } from '../hooks/useFriends';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export const FindPeoplePage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const { friends, pendingSent, sendRequest, reload } = useFriends(currentUserId);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!supabase || !currentUserId) return;
      setSearching(true);
      setSearched(false);

      const { data } = await supabase
        .from('profiles')
        .select('id, email, avatar_url, display_name')
        .or(`display_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .neq('id', currentUserId)
        .limit(20);

      setResults(data ?? []);
      setSearched(true);
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, currentUserId]);

  // Per-result add state
  const [addingId, setAddingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleAdd = async (profile: Profile) => {
    setAddingId(profile.id);
    const error = await sendRequest(profile.email);
    if (!error) {
      setSentIds(prev => new Set(prev).add(profile.id));
      reload();
    }
    setAddingId(null);
  };

  const getRelationship = (profileId: string): 'friend' | 'pending' | 'none' => {
    if (friends.some(f => f.profile.id === profileId)) return 'friend';
    if (pendingSent.some(f => f.profile.id === profileId) || sentIds.has(profileId)) return 'pending';
    return 'none';
  };

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(-1)} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-lg mx-auto mt-16">
          <motion.div
            className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 lg:p-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
                <Users className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-white">Find People</h1>
                <p className="text-sm text-stone-500 dark:text-stone-400">Search for signed-up users by name or email</p>
              </div>
            </div>

            {/* Search input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name or email…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="!pl-9 !px-3 !py-2 !text-sm"
                autoFocus
                autoComplete="off"
              />
            </div>

            {/* Results */}
            {searching && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-700 dark:border-stone-600 dark:border-t-stone-300 rounded-full animate-spin" />
              </div>
            )}

            {!searching && searched && results.length === 0 && (
              <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-sm">
                No users found for "{query.trim()}"
              </div>
            )}

            {!searching && results.length > 0 && (
              <ul className="flex flex-col gap-2">
                {results.map((profile, i) => {
                  const displayName = profile.display_name || profile.email.split('@')[0];
                  const rel = getRelationship(profile.id);
                  return (
                    <motion.li
                      key={profile.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1, delay: 0.04 * i }}
                      className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800 px-3 py-3"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 flex-shrink-0">
                        {profile.avatar_url
                          ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                          : <CircleUserRound className="w-full h-full p-1.5 text-stone-400 dark:text-stone-500" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/u/${profile.id}`}
                          className="text-sm font-medium text-stone-900 dark:text-white hover:underline truncate block"
                        >
                          {displayName}
                        </Link>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{profile.email}</p>
                      </div>

                      <div className="flex-shrink-0">
                        {rel === 'friend' ? (
                          <Button variant="secondary" size="sm" disabled className="gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            Friends
                          </Button>
                        ) : rel === 'pending' ? (
                          <Button variant="outline" size="sm" disabled className="gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={addingId === profile.id}
                            onClick={() => handleAdd(profile)}
                            className="gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            {addingId === profile.id ? 'Adding…' : 'Add'}
                          </Button>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}

            {!searching && !searched && query.trim().length < 2 && (
              <div className="text-center py-8 text-stone-400 dark:text-stone-600 text-sm">
                Type at least 2 characters to search
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
