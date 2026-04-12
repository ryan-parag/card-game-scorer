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
import { Input } from '@/components/ui/input';

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

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus('loading');
    setInviteError('');
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error ?? 'Something went wrong.');
        setInviteStatus('error');
      } else {
        setInviteStatus('sent');
      }
    } catch {
      setInviteError('Something went wrong.');
      setInviteStatus('error');
    }
  };

  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

  const handleResetPassword = async () => {
    if (!supabase || !user?.email) return;
    setResetStatus('loading');
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetStatus('sent');
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newEmail) return;
    setEmailStatus('loading');
    setEmailError('');
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailError(error.message);
      setEmailStatus('error');
    } else {
      setEmailStatus('sent');
    }
  };

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
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                  Invite someone to join ScoreKeeper. They'll receive an email to set up their account.
                </p>
                {inviteStatus === 'sent' ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-green-600 dark:text-green-400">Invite sent to {inviteEmail}.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setInviteStatus('idle'); setInviteEmail(''); }}
                    >
                      Invite another
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleInvite} className="flex gap-2 max-w-sm">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="!px-3 !py-2 !text-sm"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      disabled={inviteStatus === 'loading'}
                    >
                      {inviteStatus === 'loading' ? 'Sending…' : 'Send invite'}
                    </Button>
                  </form>
                )}
                {inviteStatus === 'error' && (
                  <p className="text-sm text-red-500 mt-2">{inviteError}</p>
                )}
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
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Password</span>
                    {resetStatus === 'sent' ? (
                      <p className="text-sm text-green-600 dark:text-green-400">Check your email for a reset link.</p>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-fit"
                        disabled={resetStatus === 'loading'}
                        onClick={handleResetPassword}
                      >
                        {resetStatus === 'loading' ? 'Sending…' : 'Reset Password'}
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Email address</span>
                    {!showChangeEmail && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-fit"
                        onClick={() => setShowChangeEmail(true)}
                      >
                        Change Email
                      </Button>
                    )}
                    {showChangeEmail && (
                      <form onSubmit={handleChangeEmail} className="flex flex-col gap-2 max-w-sm">
                        {emailStatus === 'sent' ? (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Confirmation sent to {newEmail}. Check your inbox to complete the change.
                          </p>
                        ) : (
                          <>
                            <Input
                              type="email"
                              placeholder="New email address"
                              value={newEmail}
                              onChange={e => setNewEmail(e.target.value)}
                              required
                              autoComplete="email"
                              className="!px-3 !py-2 !text-sm"
                            />
                            {emailStatus === 'error' && (
                              <p className="text-sm text-red-500">{emailError}</p>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" type="submit" variant="secondary" disabled={emailStatus === 'loading'}>
                                {emailStatus === 'loading' ? 'Saving…' : 'Save'}
                              </Button>
                              <Button size="sm" type="button" variant="outline" onClick={() => { setShowChangeEmail(false); setNewEmail(''); setEmailStatus('idle'); }}>
                                Cancel
                              </Button>
                            </div>
                          </>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
