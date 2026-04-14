import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { motion } from 'framer-motion';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { CircleUserRound, Loader, UserCheck, UserX, UserMinus, Users } from 'lucide-react';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFriends } from '@/hooks/useFriends';

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

  const {
    friends,
    pendingReceived,
    pendingSent,
    loading: friendsLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends(user?.id);

  const [friendEmail, setFriendEmail] = useState('');
  const [friendRequestStatus, setFriendRequestStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [friendRequestError, setFriendRequestError] = useState('');

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendRequestStatus('loading');
    setFriendRequestError('');
    const error = await sendRequest(friendEmail);
    if (error) {
      setFriendRequestError(error);
      setFriendRequestStatus('error');
    } else {
      setFriendEmail('');
      setFriendRequestStatus('idle');
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
          <div className="w-full grid grid-cols-1 gap-y-3 lg:grid-cols-3 gap-x-0 lg:gap-x-3 items-start">
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
                transition={{ duration: 0.2, delay: 0.1 }}
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
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <h2 className="text-lg font-bold text-stone-950 dark:text-white mb-4">Friends</h2>

                {/* Add friend by email */}
                <form onSubmit={handleSendFriendRequest} className="flex gap-2 mb-6 max-w-sm">
                  <Input
                    type="email"
                    placeholder="Add by email"
                    value={friendEmail}
                    onChange={e => setFriendEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="!px-3 !py-2 !text-sm"
                  />
                  <Button type="submit" size="sm" variant="secondary" disabled={friendRequestStatus === 'loading'}>
                    {friendRequestStatus === 'loading' ? 'Sending…' : 'Add'}
                  </Button>
                </form>
                {friendRequestStatus === 'error' && (
                  <p className="text-sm text-red-500 -mt-4 mb-4">{friendRequestError}</p>
                )}

                {friendsLoading ? (
                  <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Pending received */}
                    {pendingReceived.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Requests</p>
                        <ul className="flex flex-col gap-2">
                          {pendingReceived.map(f => (
                            <li key={f.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex-shrink-0">
                                  {f.profile.avatar_url
                                    ? <img src={f.profile.avatar_url} className="w-full h-full" />
                                    : <CircleUserRound className="w-full h-full p-1 text-stone-500" />}
                                </div>
                                <Link to={`/u/${f.profile.id}`} className="text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:underline truncate transition-colors">{f.profile.display_name ?? f.profile.email.split('@')[0]}</Link>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button size="sm" variant="secondary" onClick={() => acceptRequest(f.id)}>
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => declineRequest(f.id)}>
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Accepted friends */}
                    {friends.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Friends</p>
                        <ul className="flex flex-col gap-2">
                          {friends.map(f => (
                            <li key={f.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex-shrink-0">
                                  {f.profile.avatar_url
                                    ? <img src={f.profile.avatar_url} className="w-full h-full" />
                                    : <CircleUserRound className="w-full h-full p-1 text-stone-500" />}
                                </div>
                                <Link to={`/u/${f.profile.id}`} className="text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:underline truncate transition-colors">{f.profile.display_name ?? f.profile.email.split('@')[0]}</Link>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => removeFriend(f.id)}>
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pending sent */}
                    {pendingSent.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Pending</p>
                        <ul className="flex flex-col gap-2">
                          {pendingSent.map(f => (
                            <li key={f.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex-shrink-0">
                                  {f.profile.avatar_url
                                    ? <img src={f.profile.avatar_url} className="w-full h-full" />
                                    : <CircleUserRound className="w-full h-full p-1 text-stone-500" />}
                                </div>
                                <Link to={`/u/${f.profile.id}`} className="text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:underline truncate transition-colors">{f.profile.display_name ?? f.profile.email.split('@')[0]}</Link>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => declineRequest(f.id)}>
                                Cancel
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {friends.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
                      <div className="flex flex-col items-center gap-2 py-4 text-stone-400 dark:text-stone-600">
                        <Users className="w-8 h-8" />
                        <p className="text-sm">No friends yet — add someone above</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
              <motion.div
                className="w-full col-span-2 relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
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
