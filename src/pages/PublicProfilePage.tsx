import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircleUserRound, UserCheck, UserPlus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Profile } from '../hooks/useFriends';
import { useFriends } from '../hooks/useFriends';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import moment from 'moment';

export const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    supabase?.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id));
  }, []);

  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, avatar_url, display_name, created_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(data);

      // Count accepted friends
      const { count } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      setFriendCount(count ?? 0);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  // Use useFriends to know the relationship with this profile
  const { friends, pendingSent, sendRequest } = useFriends(currentUserId);
  const isOwnProfile = currentUserId === userId;
  const isFriend = friends.some(f => f.profile.id === userId);
  const isPendingSent = pendingSent.some(f => f.profile.id === userId);

  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const handleAddFriend = async () => {
    if (!profile?.email) return;
    setAddStatus('loading');
    const error = await sendRequest(profile.email);
    setAddStatus(error ? 'error' : 'sent');
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(-1)} />
        <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 dark:border-stone-600 dark:border-t-stone-300 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(-1)} />
        <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Profile not found</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">This user doesn't exist or their profile is unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.email.split('@')[0];

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
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center gap-3 mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 flex-shrink-0">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  : <CircleUserRound className="w-full h-full p-3 text-stone-400 dark:text-stone-500" />
                }
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{displayName}</h1>
                <div className="flex items-center justify-center gap-1 mt-1 text-stone-400 dark:text-stone-500 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Joined {moment((profile as any).created_at).format('MMMM YYYY')}</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-900 dark:text-white">{friendCount}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Friends</p>
              </div>
            </div>

            {/* Action button */}
            {!isOwnProfile && currentUserId && (
              <div className="flex justify-center">
                {isFriend ? (
                  <Button variant="secondary" size="sm" disabled className="gap-2">
                    <UserCheck className="w-4 h-4" />
                    Friends
                  </Button>
                ) : isPendingSent || addStatus === 'sent' ? (
                  <Button variant="outline" size="sm" disabled className="gap-2">
                    <Clock className="w-4 h-4" />
                    Request sent
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={addStatus === 'loading'}
                    onClick={handleAddFriend}
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {addStatus === 'loading' ? 'Sending…' : 'Add Friend'}
                  </Button>
                )}
              </div>
            )}

            {isOwnProfile && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  Edit profile
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
