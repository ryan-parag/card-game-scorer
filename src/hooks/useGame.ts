import { useState, useCallback, useEffect, useRef } from 'react';
import { Game, Player, GameHistory } from '../types/game';
import { saveGame, saveGameHistory, getGameHistory } from '../utils/storage';

export const useGame = (initialGame?: Game) => {
  const [game, setGame] = useState<Game | null>(initialGame || null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const gameRef = useRef<Game | null>(game);

  // Keep ref in sync for stable callbacks
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Persist game changes to storage
  useEffect(() => {
    if (game) {
      saveGame(game).catch(console.error);
    }
  }, [game]);

  // Persist history changes to storage
  useEffect(() => {
    if (history.length > 0) {
      saveGameHistory(history).catch(console.error);
    }
  }, [history]);

  useEffect(() => {
    if (game?.id) {
      getGameHistory(game.id).then(setHistory).catch(console.error);
    }
  }, [game?.id]);

  const updateGame = useCallback((updatedGame: Game, action: string = 'update') => {
    const currentState = gameRef.current;
    if (currentState) {
      setHistory(prev => {
        const newEntry = {
          action,
          gameState: JSON.parse(JSON.stringify(currentState)),
          timestamp: new Date().toISOString()
        };
        return [...prev, newEntry].slice(-50);
      });
    }
    setGame(updatedGame);
  }, []);

  const addPlayer = useCallback((player: Player) => {
    const game = gameRef.current;
    if (!game) return;

    const updatedGame = {
      ...game,
      players: [...game.players, player]
    };
    updateGame(updatedGame, 'add_player');
  }, [updateGame]);

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    const game = gameRef.current;
    if (!game) return;

    const updatedGame = {
      ...game,
      players: game.players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      )
    };
    updateGame(updatedGame, 'update_player');
  }, [updateGame]);

  const updateScore = useCallback((playerId: string, roundIndex: number, score: number) => {
    const game = gameRef.current;
    if (!game) return;

    const updatedPlayers = game.players.map((player) => {
      if (player.id !== playerId) return player;

      const roundScores = [...player.roundScores];
      while (roundScores.length <= roundIndex) {
        roundScores.push(0);
      }
      roundScores[roundIndex] = score;

      return {
        ...player,
        roundScores,
        totalScore: roundScores.reduce((sum, s) => sum + s, 0),
      };
    });

    const updatedGame = {
      ...game,
      players: updatedPlayers,
    };

    updateGame(updatedGame, 'update_score');
  }, [updateGame]);

  const updateProposedScore = useCallback((playerId: string, score: number | undefined) => {
    const game = gameRef.current;
    if (!game) return;

    const updatedGame = {
      ...game,
      players: game.players.map(p =>
        p.id === playerId ? { ...p, proposedScore: score } : p
      )
    };
    updateGame(updatedGame, 'update_proposed_score');
  }, [updateGame]);

  const removePlayer = useCallback((playerId: string) => {
    const game = gameRef.current;
    if (!game) return;

    const updatedGame = {
      ...game,
      players: game.players.filter(p => p.id !== playerId)
    };
    updateGame(updatedGame, 'remove_player');
  }, [updateGame]);

  const reorderPlayers = useCallback((players: Player[]) => {
    const game = gameRef.current;
    if (!game) return;
    updateGame({ ...game, players }, 'reorder_players');
  }, [updateGame]);

  const setMaxRounds = useCallback((newMaxRounds: number) => {
    const game = gameRef.current;
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
  }, [updateGame]);

  const setCollectProposedScores = useCallback((collectProposedScores: boolean) => {
    const game = gameRef.current;
    if (!game || game.collectProposedScores === collectProposedScores) return;

    const updatedPlayers = game.players.map((p) => ({
      ...p,
      ...(!collectProposedScores ? { proposedScore: undefined } : {})
    }));

    const updatedGame = {
      ...game,
      collectProposedScores,
      players: updatedPlayers
    };

    updateGame(updatedGame, 'set_scoring_method');
  }, [updateGame]);

  const setRanking = useCallback((ranking: Game['ranking']) => {
    const game = gameRef.current;
    if (!game) return;
    const current = game.ranking ?? 'high-wins';
    if (current === ranking) return;
    updateGame({ ...game, ranking }, 'set_ranking');
  }, [updateGame]);

  const nextRound = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.currentRound >= game.maxRounds) return;

    // Reset proposed scores (bids) to undefined (null) when moving to next round in Bid & Score games
    const updatedPlayers = game.collectProposedScores
      ? game.players.map(p => ({ ...p, proposedScore: undefined }))
      : game.players;

    const updatedGame = {
      ...game,
      players: updatedPlayers,
      currentRound: game.currentRound + 1
    };
    updateGame(updatedGame, 'next_round');
  }, [updateGame]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      setGame(lastState.gameState);
      return prev.slice(0, -1);
    });
  }, []);

  const completeGame = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    const updatedGame = {
      ...game,
      status: 'completed' as const
    };
    updateGame(updatedGame, 'complete_game');
  }, [updateGame]);

  return {
    game,
    setGame: updateGame,
    addPlayer,
    removePlayer,
    reorderPlayers,
    updatePlayer,
    updateScore,
    updateProposedScore,
    setMaxRounds,
    setCollectProposedScores,
    setRanking,
    nextRound,
    completeGame,
    undo,
    canUndo: history.length > 0
  };
};