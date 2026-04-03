import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LaunchScreen } from './components/LaunchScreen';
import { GameSetup } from './components/GameSetup';
import { PlayerSetup } from './components/PlayerSetup';
import { ScoreInterface } from './components/ScoreInterface';
import { GameSummary } from './components/GameSummary';
import { Game, Player } from './types/game';
import { useGame } from './hooks/useGame';
import { getGames, getSettings, saveSettings, saveGame, clearAllGames } from './utils/storage';
import { generateAvatarSeed } from './utils/avatar';
import Topbar from './components/ui/Topbar';
import ReactGA from "react-ga4";

type AppState = 'launch' | 'game-setup' | 'player-setup' | 'game' | 'summary';

ReactGA.initialize(import.meta.env.VITE_G_ANALYTICS_ID);

function App() {
  const navigate = useNavigate();
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
    setCollectProposedScores,
    setRanking,
    nextRound,
    completeGame,
    undo,
    canUndo
  } = useGame();

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
    navigate(`/game/${existingGame.id}`);
  };

  const handleGameSetup = (config: Partial<Game>) => {
    setGameConfig(config);
    setAppState('player-setup');
  };

  const handlePlayerSetup = async (players: Player[]) => {
    const newGame: Game = {
      id: Date.now().toString(),
      name: gameConfig.name || 'New Game',
      players,
      rounds: [],
      currentRound: 1,
      maxRounds: gameConfig.maxRounds || 10,
      collectProposedScores: gameConfig.collectProposedScores || false,
      ranking: gameConfig.ranking ?? 'high-wins',
      gameType: gameConfig.gameType || 'standard',
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await saveGame(newGame);
      navigate(`/game/${newGame.id}`, { state: { newGame } });
      setGameConfig({});
    } catch (error) {
      console.error('Error saving game:', error);
    }
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
      ranking: game.ranking ?? 'high-wins',
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
      {appState === 'launch' && (
        <div className="relative min-h-screen w-full h-full">
          <Topbar toggleTheme={toggleTheme} isDark={isDark} />
          <LaunchScreen
            recentGames={recentGames}
            onNewGame={handleNewGame}
            onContinueGame={handleContinueGame}
            onClearAllGames={handleClearAllGames}
            isDark={isDark}
            loadingGames={loadingGames}
          />
        </div>
      )}

      {appState === 'game-setup' && (
        <>
          <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBackToLaunch} />
          <GameSetup
            onBack={handleBackToLaunch}
            onNext={handleGameSetup}
            isDark={isDark}
          />
        </>
      )}

      {appState === 'player-setup' && (
        <>
          <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBackToLaunch} />
          <PlayerSetup
            onBack={() => setAppState('game-setup')}
            onNext={handlePlayerSetup}
            isDark={isDark}
          />
        </>
      )}

      {appState === 'game' && game && (
        <>
          <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={handleBackToLaunch} />
          <ScoreInterface
            game={game}
            onUpdateScore={updateScore}
            onUpdateProposedScore={updateProposedScore}
            onSetMaxRounds={setMaxRounds}
            onSetCollectProposedScores={setCollectProposedScores}
            onSetRanking={setRanking}
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
            onUpdatePlayer={(playerId, updates) => {
              if (typeof updates.name === 'string') {
                updatePlayer(playerId, { ...updates, avatar: generateAvatarSeed(updates.name) });
              } else {
                updatePlayer(playerId, updates);
              }
            }}
            isDark={isDark}
          />
        </>
      )}

      {appState === 'summary' && game && (
        <>
          <Topbar toggleTheme={toggleTheme} isDark={isDark} />
          <GameSummary
            game={game}
            onNewGame={handleNewGame}
            onHome={handleBackToLaunch}
            onPlayAgainWithSamePlayers={handlePlayAgainWithSamePlayers}
            isDark={isDark}
          />
        </>
      )}
    </div>
  );
}

export default App;