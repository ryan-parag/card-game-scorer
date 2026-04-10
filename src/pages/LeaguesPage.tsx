import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldHalf } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';

export const LeaguesPage = () => {
  const navigate = useNavigate();
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

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2">
            <ShieldHalf className="w-6 h-6 text-stone-400 dark:text-stone-500" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-white">Leagues</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Coming soon</p>
        </div>
      </div>
    </div>
  );
};
