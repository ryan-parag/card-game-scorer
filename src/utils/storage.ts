import { Game, GameHistory } from '../types/game';

const normalizeStoredGame = (raw: Game): Game => ({
  ...raw,
  ranking: raw.ranking ?? 'high-wins',
  avatarStyle: raw.avatarStyle ?? 'abstract',
});
import { supabase, gameToRow, rowToGame, GameHistoryRow } from '../lib/supabase';

export const saveGame = async (game: Game): Promise<void> => {
  if (!supabase) {
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
      console.warn('Warning: Failed to sync game to Supabase, using local storage:', error.message);
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes('connection') && !error.message.includes('ECONNREFUSED')) {
      console.warn('Failed to save game to Supabase, using local storage');
    }
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

export const getGames = async (): Promise<Game[]> => {
  if (!supabase) {
    return getGamesFromLocalStorage();
  }

  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data ? data.map((row) => normalizeStoredGame(rowToGame(row))) : [];
  } catch (error) {
    return getGamesFromLocalStorage();
  }
};

export const getGame = async (id: string): Promise<Game | null> => {
  if (!supabase) {
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
        return null;
      }
      throw error;
    }
    
    return data ? normalizeStoredGame(rowToGame(data)) : null;
  } catch (error) {
    const games = getGamesFromLocalStorage();
    return games.find(g => g.id === id) || null;
  }
};

export const deleteGame = async (id: string): Promise<void> => {
  if (!supabase) {
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
      throw error;
    }
  } catch (error) {
    const games = getGamesFromLocalStorage().filter(g => g.id !== id);
    localStorage.setItem('card-game-scorer-games', JSON.stringify(games));
  }
};

export const clearAllGames = async (): Promise<void> => {
  if (!supabase) {
    localStorage.removeItem('card-game-scorer-games');
    return;
  }

  try {
    const { error } = await supabase
      .from('games')
      .delete()
      .neq('id', '');
    
    if (error) {
      throw error;
    }
  } catch (error) {
    localStorage.removeItem('card-game-scorer-games');
  }
};

export const saveGameHistory = async (history: GameHistory[]): Promise<void> => {
  if (!supabase) {
    localStorage.setItem('card-game-scorer-history', JSON.stringify(history));
    return;
  }

  try {
    if (history.length === 0) return;
    
    const gameId = history[0]?.gameState?.id;
    if (!gameId) return;
    
    await supabase
      .from('game_history')
      .delete()
      .eq('game_id', gameId);
    
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
      throw error;
    }
  } catch (error) {
    localStorage.setItem('card-game-scorer-history', JSON.stringify(history));
  }
};

export const getGameHistory = async (gameId?: string): Promise<GameHistory[]> => {
  if (!supabase) {
    const stored = localStorage.getItem('card-game-scorer-history');
    const history = stored ? JSON.parse(stored) : [];
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
      throw error;
    }
    
    if (!data) return [];
    
    return data.map(row => ({
      action: row.action,
      gameState: row.game_state,
      timestamp: row.timestamp,
    }));
  } catch (error) {
    const stored = localStorage.getItem('card-game-scorer-history');
    const history = stored ? JSON.parse(stored) : [];
    if (gameId) {
      return history.filter((h: GameHistory) => h.gameState.id === gameId);
    }
    return history;
  }
};

export const saveSettings = (updates: Record<string, unknown>): void => {
  const current = getSettings();
  localStorage.setItem('card-game-scorer-settings', JSON.stringify({ ...current, ...updates }));
};

export const getSettings = (): Record<string, unknown> => {
  const stored = localStorage.getItem('card-game-scorer-settings');
  return stored ? JSON.parse(stored) : { theme: 'dark', neutral: 'stone' };
};

const getGamesFromLocalStorage = (): Game[] => {
  const stored = localStorage.getItem('card-game-scorer-games');
  if (!stored) return [];
  const parsed: Game[] = JSON.parse(stored);
  return parsed.map(normalizeStoredGame);
};
