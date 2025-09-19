import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { LaunchScreen } from './components/LaunchScreen';
import { GameSetup } from './components/GameSetup';
import { PlayerSetup } from './components/PlayerSetup';
import { ScoreInterface } from './components/ScoreInterface';
import { GameSummary } from './components/GameSummary';
import { Game, Player } from './types/game';
import { useGame } from './hooks/useGame';
import { getGames, getSettings, saveSettings, clearAllGames } from './utils/storage';
import { Button } from './components/ui/button';

type AppState = 'launch' | 'game-setup' | 'player-setup' | 'game' | 'summary';

function App() {
  const [appState, setAppState] = useState<AppState>('launch');
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [gameConfig, setGameConfig] = useState<Partial<Game>>({});
  const [isDark, setIsDark] = useState(false);
  
  const {
    game,
    setGame,
    updateScore,
    updateProposedScore,
    addPlayer,
    removePlayer,
    updatePlayer,
    setMaxRounds,
    nextRound,
    completeGame,
    undo,
    canUndo
  } = useGame();

  // Load settings and recent games
  useEffect(() => {
    const settings = getSettings();
    const isDarkMode = settings.theme === 'dark';
    setIsDark(isDarkMode);
    
    // Apply theme immediately
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setRecentGames(getGames().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Apply theme immediately
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    saveSettings({ theme: newTheme ? 'dark' : 'light' });
  };

  const handleNewGame = () => {
    setAppState('game-setup');
  };

  const handleContinueGame = (existingGame: Game) => {
    setGame(existingGame, 'continue_game');
    if (existingGame.status === 'completed') {
      setAppState('summary');
    } else {
      setAppState('game');
    }
  };

  const handleGameSetup = (config: Partial<Game>) => {
    setGameConfig(config);
    setAppState('player-setup');
  };

  const handlePlayerSetup = (players: Player[]) => {
    const newGame: Game = {
      id: Date.now().toString(),
      name: gameConfig.name || 'New Game',
      players,
      rounds: [],
      currentRound: 1,
      maxRounds: gameConfig.maxRounds || 10,
      collectProposedScores: gameConfig.collectProposedScores || false,
      gameType: gameConfig.gameType || 'standard',
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setGame(newGame, 'start_game');
    setAppState('game');
  };

  const handleCompleteGame = () => {
    completeGame();
    setAppState('summary');
  };

  const handleGoToRound = (roundNumber: number) => {
    if (game) {
      // Update the game to set the current round to the selected round
      const updatedGame = {
        ...game,
        currentRound: roundNumber
      };
      setGame(updatedGame, 'go_to_round');
    }
  };

  const handleBackToLaunch = () => {
    setAppState('launch');
    setRecentGames(getGames().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  };

  const handleClearAllGames = () => {
    clearAllGames();
    setRecentGames([]);
  };

  return (
    <div className="relative min-h-screen">
      {/* Theme Toggle */}
      <Button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 transition-all duration-200 h-14 w-14 rounded-xl"
        variant="outline"
      >
        {isDark ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-stone-600" />
        )}
      </Button>

      {appState === 'launch' && (
        <LaunchScreen
          recentGames={recentGames}
          onNewGame={handleNewGame}
          onContinueGame={handleContinueGame}
          onViewHistory={() => {}} // TODO: Implement history view
          onSettings={() => {}} // TODO: Implement settings
          onClearAllGames={handleClearAllGames}
          isDark={isDark}
        />
      )}

      {appState === 'game-setup' && (
        <GameSetup
          onBack={handleBackToLaunch}
          onNext={handleGameSetup}
          isDark={isDark}
        />
      )}

      {appState === 'player-setup' && (
        <PlayerSetup
          onBack={() => setAppState('game-setup')}
          onNext={handlePlayerSetup}
          isDark={isDark}
        />
      )}

      {appState === 'game' && game && (
        <ScoreInterface
          game={game}
          onUpdateScore={updateScore}
          onUpdateProposedScore={updateProposedScore}
          onSetMaxRounds={setMaxRounds}
          onNextRound={nextRound}
          onCompleteGame={handleCompleteGame}
          onUndo={undo}
          canUndo={canUndo}
          onBack={handleBackToLaunch}
          onGoToRound={handleGoToRound}
          onAddPlayer={() => {
            const newPlayer: Player = {
              id: Date.now().toString(),
              name: '',
              color: '#3B82F6',
              avatar: '',
              totalScore: 0,
              roundScores: []
            };
            addPlayer(newPlayer);
          }}
          onRemovePlayer={removePlayer}
          onUpdatePlayer={updatePlayer}
          isDark={isDark}
        />
      )}

      {appState === 'summary' && game && (
        <GameSummary
          game={game}
          onNewGame={handleNewGame}
          onHome={handleBackToLaunch}
          isDark={isDark}
        />
      )}
    </div>
  );
}

export default App;