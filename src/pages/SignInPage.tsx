import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Spade, Diamond, Club } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import Topbar from '@/components/ui/Topbar';
import { getSettings, saveSettings } from '../utils/storage';
import { ScorekeeperLogo } from '@/components/ui/ScorekeeperLogo';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const AppLogo = () => (
  <div className="mx-auto grid grid-cols-2 gap-0 w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl mb-6 shadow-xl shadow-red-500/20 overflow-hidden border border-border relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 pointer-events-none z-10" />
    <div className="w-6 h-6 bg-red-500 flex items-center justify-center">
      <Heart className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
      <Spade className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
      <Club className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="w-6 h-6 bg-red-500 flex items-center justify-center">
      <Diamond className="w-3.5 h-3.5 text-white" />
    </div>
  </div>
);

export const SignInPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex flex-col">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="transform">
              <ScorekeeperLogo size={'sm'}/>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-4">Sign in to ScoreKeeper</h1>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant={'default'}
              onClick={handleGoogleSignIn}
              disabled={loading || !supabase}
              className="w-full bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-medium shadow-sm"
            >
              <GoogleIcon />
              <span className="ml-2">Continue with Google</span>
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-muted" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-muted" />
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="!px-3 !py-3 !text-sm"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="!px-3 !py-3 !text-sm"
              />

              {error && (
                <p className={`p-2 rounded-md text-sm text-center ${error.includes('Check your email') ? 'text-green-700 bg-green-500/10 dark:text-green-400' : 'text-red-700 bg-red-500/10 dark:text-red-400'}`}>
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !supabase}
                variant={'secondary'}
                className="w-full "
              >
                {loading ? 'Signing in…' : 'Sign in with email'}
              </Button>
            </form>

            <div className="flex items-center justify-between pt-1">
              <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Create account
              </Link>
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
