import { Game, GameHistory } from '../types/game';
import { supabase, gameToRow, rowToGame, GameHistoryRow } from '../lib/supabase';

// Save a game to Supabase
export const saveGame = async (game: Game): Promise<void> => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    const games = getGamesFromLocalStorage();
    const existingIndex = games.findIndex(g => g.id === game.id);
    
    if (existingIndex >= 0) {
      games[existingIndex] = { ...game, updatedAt: new Date().toISOString() };
    } else {
      games.push(game);
    }
    
    localStorage.setItem('card-game-scorer-games', JSON.stringify(games));
    return;
  }

  try {
    const gameRow = gameToRow(game);
    
    const { error } = await supabase
      .from('games')
      .upsert(gameRow, { onConflict: 'id' });
    
    if (error) {
      console.error('Error saving game:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save game to Supabase:', error);
    // Fallback to localStorage for offline support
    const games = getGamesFromLocalStorage();
    const existingIndex = games.findIndex(g => g.id === game.id);
    
    if (existingIndex >= 0) {
      games[existingIndex] = { ...game, updatedAt: new Date().toISOString() };
    } else {
      games.push(game);
    }
    
    localStorage.setItem('card-game-scorer-games', JSON.stringify(games));
  }
};

// Get all games from Supabase
export const getGames = async (): Promise<Game[]> => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    return getGamesFromLocalStorage();
  }

  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
    
    return data ? data.map(rowToGame) : [];
  } catch (error) {
    console.error('Failed to fetch games from Supabase, falling back to localStorage:', error);
    return getGamesFromLocalStorage();
  }
};

// Get a single game by ID
export const getGame = async (id: string): Promise<Game | null> => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    const games = getGamesFromLocalStorage();
    return games.find(g => g.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching game:', error);
      throw error;
    }
    
    return data ? rowToGame(data) : null;
  } catch (error) {
    console.error('Failed to fetch game from Supabase, falling back to localStorage:', error);
    const games = getGamesFromLocalStorage();
    return games.find(g => g.id === id) || null;
  }
};

// Delete a game from Supabase
export const deleteGame = async (id: string): Promise<void> => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    const games = getGamesFromLocalStorage().filter(g => g.id !== id);
    localStorage.setItem('card-game-scorer-games', JSON.stringify(games));
    return;
  }

  try {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete game from Supabase, falling back to localStorage:', error);
    const games = getGamesFromLocalStorage().filter(g => g.id !== id);
    localStorage.setItem('card-game-scorer-games', JSON.stringify(games));
  }
};

// Clear all games
export const clearAllGames = async (): Promise<void> => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    localStorage.removeItem('card-game-scorer-games');
    return;
  }

  try {
    const { error } = await supabase
      .from('games')
      .delete()
      .neq('id', ''); // Delete all games
    
    if (error) {
      console.error('Error clearing games:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to clear games from Supabase, falling back to localStorage:', error);
    localStorage.removeItem('card-game-scorer-games');
  }
};

// Save game history to Supabase
export const saveGameHistory = async (history: GameHistory[]): Promise<void> => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    localStorage.setItem('card-game-scorer-history', JSON.stringify(history));
    return;
  }

  try {
    if (history.length === 0) return;
    
    // Get the game ID from the first history entry
    const gameId = history[0]?.gameState?.id;
    if (!gameId) return;
    
    // Delete existing history for this game
    await supabase
      .from('game_history')
      .delete()
      .eq('game_id', gameId);
    
    // Insert new history entries
    const historyRows: GameHistoryRow[] = history.map(h => ({
      game_id: h.gameState.id,
      action: h.action,
      game_state: h.gameState,
      timestamp: h.timestamp,
    }));
    
    const { error } = await supabase
      .from('game_history')
      .insert(historyRows);
    
    if (error) {
      console.error('Error saving game history:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save game history to Supabase, falling back to localStorage:', error);
    localStorage.setItem('card-game-scorer-history', JSON.stringify(history));
  }
};

// Get game history from Supabase
export const getGameHistory = async (gameId?: string): Promise<GameHistory[]> => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    const stored = localStorage.getItem('card-game-scorer-history');
    const history = stored ? JSON.parse(stored) : [];
    // Filter by gameId if provided
    if (gameId) {
      return history.filter((h: GameHistory) => h.gameState.id === gameId);
    }
    return history;
  }

  try {
    let query = supabase
      .from('game_history')
      .select('*')
      .order('timestamp', { ascending: true });
    
    if (gameId) {
      query = query.eq('game_id', gameId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching game history:', error);
      throw error;
    }
    
    if (!data) return [];
    
    return data.map(row => ({
      action: row.action,
      gameState: row.game_state,
      timestamp: row.timestamp,
    }));
  } catch (error) {
    console.error('Failed to fetch game history from Supabase, falling back to localStorage:', error);
    const stored = localStorage.getItem('card-game-scorer-history');
    const history = stored ? JSON.parse(stored) : [];
    // Filter by gameId if provided
    if (gameId) {
      return history.filter((h: GameHistory) => h.gameState.id === gameId);
    }
    return history;
  }
};

// Settings remain in localStorage (user-specific, not shared)
export const saveSettings = (settings: any): void => {
  localStorage.setItem('card-game-scorer-settings', JSON.stringify(settings));
};

export const getSettings = (): any => {
  const stored = localStorage.getItem('card-game-scorer-settings');
  return stored ? JSON.parse(stored) : { theme: 'dark' };
};

// Helper function for localStorage fallback
const getGamesFromLocalStorage = (): Game[] => {
  const stored = localStorage.getItem('card-game-scorer-games');
  return stored ? JSON.parse(stored) : [];
};
