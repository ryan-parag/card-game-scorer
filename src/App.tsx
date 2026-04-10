import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LaunchScreen } from './components/LaunchScreen';
import { Game } from './types/game';
import { getGames, getSettings, saveSettings, clearAllGames } from './utils/storage';
import Topbar from './components/ui/Topbar';
import ReactGA from "react-ga4";

ReactGA.initialize(import.meta.env.VITE_G_ANALYTICS_ID);

function App() {
  const navigate = useNavigate();
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const settings = getSettings();
      const isDarkMode = settings.theme === 'dark';
      setIsDark(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      try {
        const games = await getGames();
        setRecentGames(games.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ));
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setLoadingGames(false);
      }
    };

    loadData();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveSettings({ theme: newTheme ? 'dark' : 'light' });
  };

  const handleClearAllGames = async () => {
    try {
      await clearAllGames();
      setRecentGames([]);
    } catch (error) {
      console.error('Error clearing games:', error);
    }
  };

  return (
    <div className="relative min-h-screen w-full h-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} />
      <LaunchScreen
        recentGames={recentGames}
        onNewGame={() => navigate('/new-game')}
        onContinueGame={(game) => navigate(`/game/${game.id}`)}
        onClearAllGames={handleClearAllGames}
        isDark={isDark}
        loadingGames={loadingGames}
      />
    </div>
  );
}

export default App;
