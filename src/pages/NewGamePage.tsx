import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarStyle, Game, Player } from '../types/game';
import { GameSetup } from '../components/GameSetup';
import { PlayerSetup } from '../components/PlayerSetup';
import { getSettings, saveSettings, saveGame } from '../utils/storage';
import Topbar from '../components/ui/Topbar';

type Step = 'game-setup' | 'player-setup';

export const NewGamePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('game-setup');
  const [gameConfig, setGameConfig] = useState<Partial<Game>>({});
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

  const handleGameSetup = (config: Partial<Game>) => {
    setGameConfig(config);
    setStep('player-setup');
  };

  const handlePlayerSetup = async (players: Player[], avatarStyle: AvatarStyle) => {
    const newGame: Game = {
      id: Date.now().toString(),
      name: gameConfig.name || 'New Game',
      players,
      rounds: [],
      currentRound: 1,
      maxRounds: gameConfig.maxRounds || 10,
      collectProposedScores: gameConfig.collectProposedScores || false,
      ranking: gameConfig.ranking ?? 'high-wins',
      avatarStyle,
      gameType: gameConfig.gameType || 'standard',
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveGame(newGame);
      navigate(`/game/${newGame.id}`, { state: { newGame } });
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Topbar
        toggleTheme={toggleTheme}
        isDark={isDark}
        onBack={step === 'player-setup' ? () => setStep('game-setup') : () => navigate('/')}
      />

      {step === 'game-setup' && (
        <GameSetup
          onBack={() => navigate('/')}
          onNext={handleGameSetup}
          isDark={isDark}
        />
      )}

      {step === 'player-setup' && (
        <PlayerSetup
          onBack={() => setStep('game-setup')}
          onNext={handlePlayerSetup}
          isDark={isDark}
        />
      )}
    </div>
  );
};
