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
import { motion, AnimatePresence } from 'framer-motion';

type AppState = 'launch' | 'game-setup' | 'player-setup' | 'game' | 'summary';

function App() {
  const [appState, setAppState] = useState<AppState>('launch');
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [gameConfig, setGameConfig] = useState<Partial<Game>>({});
  const [isDark, setIsDark] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);
  
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
    const loadData = async () => {
      const settings = getSettings();
      const isDarkMode = settings.theme === 'dark';
      setIsDark(isDarkMode);
      
      // Apply theme immediately
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

  const handlePlayAgainWithSamePlayers = () => {
    if (!game) return;
    
    // Create new players with reset scores
    const resetPlayers: Player[] = game.players.map(player => ({
      ...player,
      totalScore: 0,
      roundScores: [],
      proposedScore: undefined
    }));
    
    // Create new game with same players and config
    const newGame: Game = {
      id: Date.now().toString(),
      name: `${game.name} (Rematch)`,
      players: resetPlayers,
      rounds: [],
      currentRound: 1,
      maxRounds: game.maxRounds,
      collectProposedScores: game.collectProposedScores,
      gameType: game.gameType,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setGame(newGame, 'start_game');
    setAppState('game');
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

  const handleBackToLaunch = async () => {
    setAppState('launch');
    try {
      const games = await getGames();
      setRecentGames(games.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading games:', error);
    }
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
    <div className="relative min-h-screen">
      {/* Theme Toggle */}
      <motion.button
        className={`rounded-full dark:hover:bg-white/10 hover:bg-stone-900/10 hover:border-stone-600 dark:hover:border-stone-400 w-16 h-8 p-1 border border-stone-500 absolute top-8 right-6 lg:right-8 z-50 transition-all duration-200 overflow-hidden flex items-center ${isDark ? 'justify-start' : 'justify-end'}`}
        onClick={toggleTheme}
      >
        <motion.div
          className="rounded-full h-6 w-6 bg-stone-600 dark:bg-stone-100"
          layout
          transition={{
            duration: 0.1
          }}
        />
        {
          isDark ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, delay: 1, type: "spring", stiffness: 150 }}
              className="absolute top-1/2 -translate-y-1/2 right-1"
            >
              <Sun className="w-5 h-5 text-yellow-500" />
            </motion.div>
          )
          :
          (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, delay: 1, type: "spring", stiffness: 150 }}
              className="absolute top-1/2 -translate-y-1/2 left-1"
            >
              <Moon className="w-5 h-5 text-stone-700 dark:text-stone-200" />
            </motion.div>
          )
        }
      </motion.button>
    

      {appState === 'launch' && (
        <LaunchScreen
          recentGames={recentGames}
          onNewGame={handleNewGame}
          onContinueGame={handleContinueGame}
          onViewHistory={() => {}} // TODO: Implement history view
          onSettings={() => {}} // TODO: Implement settings
          onClearAllGames={handleClearAllGames}
          isDark={isDark}
          loadingGames={loadingGames}
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
          onPlayAgainWithSamePlayers={handlePlayAgainWithSamePlayers}
          isDark={isDark}
        />
      )}
    </div>
  );
}

export default App;