import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { ScorekeeperLogo } from '@/components/ui/ScorekeeperLogo';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '@/components/ui/Topbar';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a reset link.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex flex-col">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/signin')} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="transform">
              <ScorekeeperLogo size="sm" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Reset your password</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
              Enter your email and you'll receive a reset link.
            </p>
          </div>

          <div className="space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="!px-3 !py-3 !text-sm"
              />

              {error && (
                <p className="p-2 rounded-md text-sm text-center text-red-700 bg-red-500/10 dark:text-red-400">{error}</p>
              )}
              {message && (
                <p className="p-2 rounded-md text-sm text-center text-green-700 bg-green-500/10 dark:text-green-400">{message}</p>
              )}

              <Button
                type="submit"
                disabled={loading || !supabase}
                variant="secondary"
                className="w-full"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            <p className="text-center pt-1">
              <Link
                to="/signin"
                className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
