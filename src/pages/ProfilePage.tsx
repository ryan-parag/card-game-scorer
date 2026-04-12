import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { motion } from 'framer-motion';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { CircleUserRound } from 'lucide-react';
import moment from 'moment';
import { Button } from '@/components/ui/button';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    navigate('/signin');
  };

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  console.log(user)

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
            <motion.div
              className="w-full relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-stone-950 dark:text-white mb-4">Profile</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="block items-center w-12 h-12 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700">
                  {
                    user?.user_metadata.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt={'image'} className="w-full h-full rounded-full"/>
                    )
                    :
                    (
                      <div className="w-full h-full rounded-full overflow-hidden p-0 dark:text-stone-400 text-stone-600">
                        <CircleUserRound className="w-full h-full" />
                      </div>
                    )
                  }
                </div>
                <div className="flex-1 w-full flex flex-col items-start gap-1">
                  <span className="text-base text-stone-700 dark:text-stone-300 truncate">{user?.email}</span>
                  <span className="text-stone-500 dark:text-stone-400 text-xs">Joined {moment(user?.created_at).format('ll')}</span>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                size="sm"
                variant="secondary"
                className="mt-2"
              >
                Sign out
              </Button>
            </motion.div>
            <div className="col-span-2 w-full flex flex-col gap-3">
              <motion.div
                className="w-full col-span-2 relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-bold text-stone-950 dark:text-white mb-4">Invites</h2>
                <p className="text-stone-700 dark:text-stone-300 mb-6">Coming Soon</p>
              </motion.div>
              <motion.div
                className="w-full col-span-2 relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-bold text-stone-950 dark:text-white mb-4">Leagues</h2>
                <p className="text-stone-700 dark:text-stone-300 mb-6">Coming Soon</p>
              </motion.div>
              <motion.div
                className="w-full col-span-2 relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-bold text-stone-950 dark:text-white mb-4">Settings</h2>
                <p className="text-stone-700 dark:text-stone-300 mb-6">Coming Soon</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
