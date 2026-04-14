import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CircleUserRound, Search, UserCheck, UserPlus, Clock,
  Users, UserMinus, UserX, Loader,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Profile, useFriends } from '../hooks/useFriends';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import BlurBg from '../components/ui/BlurBg';

type Tab = 'friends' | 'find';

// ── Shared avatar cell ─────────────────────────────────────────────────────────
function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" />
        : <CircleUserRound className="w-full h-full p-1 text-muted-foreground" />}
    </div>
  );
}

// ── Tab 1: My Friends ──────────────────────────────────────────────────────────
function MyFriendsTab({ currentUserId }: { currentUserId: string | undefined }) {
  const {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends(currentUserId);

  const [addEmail, setAddEmail] = useState('');
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [addError, setAddError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStatus('loading');
    setAddError('');
    const err = await sendRequest(addEmail);
    if (err) { setAddError(err); setAddStatus('error'); }
    else { setAddEmail(''); setAddStatus('idle'); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Requests
          </p>
          <ul className="flex flex-col gap-2">
            {pendingReceived.map(f => {
              const name = f.profile.display_name ?? f.profile.email.split('@')[0];
              return (
                <li key={f.id} className="flex items-center gap-3">
                  <Avatar url={f.profile.avatar_url} name={name} />
                  <Link to={`/u/${f.profile.id}`} className="flex-1 text-sm font-medium text-foreground hover:underline truncate">
                    {name}
                  </Link>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => acceptRequest(f.id)}>
                      <UserCheck className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => declineRequest(f.id)}>
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Accepted friends */}
      {friends.length > 0 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Friends
          </p>
          <ul className="flex flex-col gap-2">
            {friends.map(f => {
              const name = f.profile.display_name ?? f.profile.email.split('@')[0];
              return (
                <li key={f.id} className="flex items-center gap-3">
                  <Avatar url={f.profile.avatar_url} name={name} />
                  <Link to={`/u/${f.profile.id}`} className="flex-1 text-sm font-medium text-foreground hover:underline truncate">
                    {name}
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => removeFriend(f.id)}>
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Pending
          </p>
          <ul className="flex flex-col gap-2">
            {pendingSent.map(f => {
              const name = f.profile.display_name ?? f.profile.email.split('@')[0];
              return (
                <li key={f.id} className="flex items-center gap-3">
                  <Avatar url={f.profile.avatar_url} name={name} />
                  <Link to={`/u/${f.profile.id}`} className="flex-1 text-sm font-medium text-foreground hover:underline truncate">
                    {name}
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => declineRequest(f.id)}>
                    Cancel
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {friends.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Users className="w-8 h-8" />
          <p className="text-sm">No friends yet — add someone above</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Find People ─────────────────────────────────────────────────────────
function FindPeopleTab({ currentUserId }: { currentUserId: string | undefined }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { friends, pendingSent, sendRequest, reload } = useFriends(currentUserId);

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

  const [addingId, setAddingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleAdd = async (profile: Profile) => {
    setAddingId(profile.id);
    const err = await sendRequest(profile.email);
    if (!err) { setSentIds(prev => new Set(prev).add(profile.id)); reload(); }
    setAddingId(null);
  };

  const getRelationship = (profileId: string): 'friend' | 'pending' | 'none' => {
    if (friends.some(f => f.profile.id === profileId)) return 'friend';
    if (pendingSent.some(f => f.profile.id === profileId) || sentIds.has(profileId)) return 'pending';
    return 'none';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
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
            const displayName = profile.display_name || profile.email.split('@')[0];
            const rel = getRelationship(profile.id);
            return (
              <motion.li
                key={profile.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, delay: 0.04 * i }}
                className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-3"
              >
                <Avatar url={profile.avatar_url} name={displayName} />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/u/${profile.id}`}
                    className="text-sm font-medium text-foreground hover:underline truncate block"
                  >
                    {displayName}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
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
        <p className="text-center py-8 text-muted-foreground text-sm">
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export const FindPeoplePage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>('friends');

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
          <motion.div
            className="w-full max-w-sm flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-border bg-card/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px', rotate: 0 }}
            animate={{ opacity: 1, y: '48px', rotate: 2 }}
            exit={{ opacity: 0, y: '80px', rotate: 0 }}
            transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          >
            <BlurBg/>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-rose-400 to-rose-700 shadow-2xl shadow-rose-500/50 border border-rose-500 dark:border-rose-800">
              <Users className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
                Friends
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Find friends by name or email
              </p>
            </div>
          </motion.div>
          <motion.div
            className="w-full relative z-10 bg-card rounded-2xl shadow-xl px-4 pt-4 pb-4 overflow-hidden border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >

            {/* Tab toggle */}
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
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {tab === 'friends'
                  ? <MyFriendsTab currentUserId={currentUserId} />
                  : <FindPeopleTab currentUserId={currentUserId} />
                }
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
