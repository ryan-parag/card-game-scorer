import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import Topbar from '@/components/ui/Topbar';
import { getSettings, saveSettings } from '../utils/storage';
import { ScorekeeperLogo } from '@/components/ui/ScorekeeperLogo';

export const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  // Supabase fires SIGNED_IN with type=invite when the user arrives via the invite link
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex flex-col">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="transform">
              <ScorekeeperLogo size="sm" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Welcome to ScoreKeeper
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Set a password to finish creating your account.
            </p>
          </div>

          {!ready ? (
            <p className="text-sm text-muted-foreground text-center">
              Verifying your invite link…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="!px-3 !py-3 !text-sm"
              />
              <Input
                type="password"
                placeholder="Confirm password"
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
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
