import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import Topbar from '@/components/ui/Topbar';
import { getSettings, saveSettings } from '../utils/storage';
import { ScorekeeperLogo } from '@/components/ui/ScorekeeperLogo';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Supabase parses the token from the URL fragment and emits PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex flex-col">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="transform">
              <ScorekeeperLogo size="sm" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
              Choose a new password
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
              Enter a new password for your account.
            </p>
          </div>

          {!ready ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
              Verifying your reset link…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="!px-3 !py-3 !text-sm"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="!px-3 !py-3 !text-sm"
              />

              {error && (
                <p className="p-2 rounded-md text-sm text-center text-red-700 bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !supabase}
                variant="secondary"
                className="w-full"
              >
                {loading ? 'Saving…' : 'Set new password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
