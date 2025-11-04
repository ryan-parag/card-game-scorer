import { useState, useCallback, useEffect } from 'react';
import { Game, Player, GameHistory } from '../types/game';
import { saveGame, saveGameHistory, getGameHistory } from '../utils/storage';

export const useGame = (initialGame?: Game) => {
  const [game, setGame] = useState<Game | null>(initialGame || null);
  const [history, setHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    if (game?.id) {
      getGameHistory(game.id).then(setHistory).catch(console.error);
    }
  }, [game?.id]);

  const saveToHistory = useCallback((action: string, gameState: Game) => {
    const newHistory = [...history, {
      action,
      gameState: JSON.parse(JSON.stringify(gameState)),
      timestamp: new Date().toISOString()
    }];
    
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    saveGameHistory(newHistory).catch(console.error);
  }, [history]);

  const updateGame = useCallback((updatedGame: Game, action: string = 'update') => {
    if (game) {
      saveToHistory(action, game);
    }
    setGame(updatedGame);
    saveGame(updatedGame).catch(console.error);
  }, [game, saveToHistory]);

  const addPlayer = useCallback((player: Player) => {
    if (!game) return;
    
    const updatedGame = {
      ...game,
      players: [...game.players, player]
    };
    updateGame(updatedGame, 'add_player');
  }, [game, updateGame]);

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    if (!game) return;
    
    const updatedGame = {
      ...game,
      players: game.players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      )
    };
    updateGame(updatedGame, 'update_player');
  }, [game, updateGame]);

  const updateScore = useCallback((playerId: string, roundIndex: number, score: number) => {
    if (!game) return;
    
    const updatedGame = { ...game };
    const player = updatedGame.players.find(p => p.id === playerId);
    
    if (player) {
      while (player.roundScores.length <= roundIndex) {
        player.roundScores.push(0);
      }
      
      player.roundScores[roundIndex] = score;
      player.totalScore = player.roundScores.reduce((sum, s) => sum + s, 0);
    }
    
    updateGame(updatedGame, 'update_score');
  }, [game, updateGame]);

  const updateProposedScore = useCallback((playerId: string, score: number) => {
    if (!game) return;
    
    const updatedGame = {
      ...game,
      players: game.players.map(p =>
        p.id === playerId ? { ...p, proposedScore: score } : p
      )
    };
    updateGame(updatedGame, 'update_proposed_score');
  }, [game, updateGame]);

  const removePlayer = useCallback((playerId: string) => {
    if (!game) return;

    const updatedGame = {
      ...game,
      players: game.players.filter(p => p.id !== playerId)
    };
    updateGame(updatedGame, 'remove_player');
  }, [game, updateGame]);

  const setMaxRounds = useCallback((newMaxRounds: number) => {
    if (!game) return;
    const safeMax = Math.max(1, Math.floor(newMaxRounds));

    const updatedPlayers = game.players.map((p) => {
      const trimmedScores = p.roundScores.slice(0, safeMax);
      return {
        ...p,
        roundScores: trimmedScores,
        totalScore: trimmedScores.reduce((sum, s) => sum + s, 0)
      };
    });

    const updatedGame = {
      ...game,
      players: updatedPlayers,
      maxRounds: safeMax,
      currentRound: Math.min(game.currentRound, safeMax)
    };

    updateGame(updatedGame, 'set_max_rounds');
  }, [game, updateGame]);

  const nextRound = useCallback(() => {
    if (!game || game.currentRound >= game.maxRounds) return;
    
    const updatedGame = {
      ...game,
      currentRound: game.currentRound + 1
    };
    updateGame(updatedGame, 'next_round');
  }, [game, updateGame]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setGame(lastState.gameState);
    saveGame(lastState.gameState).catch(console.error);
    
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    saveGameHistory(newHistory).catch(console.error);
  }, [history]);

  const completeGame = useCallback(() => {
    if (!game) return;
    
    const updatedGame = {
      ...game,
      status: 'completed' as const
    };
    updateGame(updatedGame, 'complete_game');
  }, [game, updateGame]);

  return {
    game,
    setGame: updateGame,
    addPlayer,
    removePlayer,
    updatePlayer,
    updateScore,
    updateProposedScore,
    setMaxRounds,
    nextRound,
    completeGame,
    undo,
    canUndo: history.length > 0
  };
};