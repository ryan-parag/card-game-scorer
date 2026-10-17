import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Search, UserCheck, UserPlus, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { FriendsState, Profile, profileName, useFriends } from '../hooks/useFriends';
import { FriendAvatar, FriendsList } from '../components/FriendsList';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { PageHero } from '../components/ui/PageHero';
import { Panel } from '../components/ui/Panel';

type Tab = 'friends' | 'find';

function MyFriendsTab({ state, onFindPeople }: { state: FriendsState; onFindPeople: () => void }) {
  return (
    <FriendsList
      state={state}
      emptyAction={
        <Button size="sm" variant="secondary" onClick={onFindPeople} className="gap-1.5">
          <Search className="w-3.5 h-3.5" />
          Find people
        </Button>
      }
    />
  );
}

function FindPeopleTab({ currentUserId, state }: { currentUserId: string | undefined; state: FriendsState }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { relationshipWith, sendRequest, acceptRequest } = state;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) { setResults([]); setSearched(false); return; }

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

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, currentUserId]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const handleAction = async (profileId: string, action: () => Promise<string | null>) => {
    setBusyId(profileId);
    setRowError(null);
    const err = await action();
    if (err) setRowError({ id: profileId, message: err });
    setBusyId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="!pl-9 !px-3 !py-2 !text-sm"
          autoComplete="off"
        />
      </div>

      {searching && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <p className="text-center py-8 text-muted-foreground text-sm">
          No users found for "{query.trim()}"
        </p>
      )}

      {!searching && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((profile, i) => {
            const displayName = profileName(profile);
            const rel = relationshipWith(profile.id);
            const busy = busyId === profile.id;
            return (
              <motion.li
                key={profile.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, delay: 0.04 * i }}
                className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-3"
              >
                <FriendAvatar profile={profile} />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/u/${profile.id}`}
                    className="text-sm font-medium text-foreground hover:underline truncate block"
                  >
                    {displayName}
                  </Link>
                  <p className={`text-xs truncate ${rowError?.id === profile.id ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {rowError?.id === profile.id
                      ? rowError.message
                      : rel.kind === 'incoming' ? 'Sent you a friend request' : profile.email}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {rel.kind === 'friend' ? (
                    <Button variant="secondary" size="sm" disabled className="gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Friends
                    </Button>
                  ) : rel.kind === 'incoming' ? (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleAction(profile.id, () => acceptRequest(rel.friendship.id))}
                      className="gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </Button>
                  ) : rel.kind === 'outgoing' ? (
                    <Button variant="outline" size="sm" disabled className="gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Requested
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleAction(profile.id, () => sendRequest(profile.email))}
                      className="gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {busy ? 'Adding…' : 'Add'}
                    </Button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      {!searching && !searched && query.trim().length < 2 && (
        <p className="text-center py-8 text-muted-foreground text-sm">
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}

export const FindPeoplePage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>('friends');
  const friendsState = useFriends(currentUserId);
  const requestCount = friendsState.pendingReceived.length;

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

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(-1)} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center">
          <PageHero
            icon={<Users className="h-10 w-10" aria-hidden />}
            color="rose"
            title="Friends"
            subtitle="Find friends by name or email"
          />
          <Panel
            border="subtle"
            padding="none"
            className="w-full relative z-10 px-4 pt-4 pb-4 overflow-hidden"
          >

            <div className="w-full grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5 mb-6">
              {([
                { value: 'friends' as Tab, label: 'My Friends' },
                { value: 'find' as Tab, label: 'Find People' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-all duration-200 ${
                    tab === value
                      ? 'bg-background shadow-sm font-medium text-foreground'
                      : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                  }`}
                >
                  {label}
                  {value === 'friends' && requestCount > 0 && (
                    <span
                      className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-semibold leading-5 tabular-nums"
                      aria-label={`${requestCount} friend request${requestCount === 1 ? '' : 's'}`}
                    >
                      {requestCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {tab === 'friends'
                  ? <MyFriendsTab state={friendsState} onFindPeople={() => setTab('find')} />
                  : <FindPeopleTab currentUserId={currentUserId} state={friendsState} />
                }
              </motion.div>
            </AnimatePresence>
          </Panel>
        </div>
      </div>
    </div>
  );
};
