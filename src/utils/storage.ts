import { Game, GameHistory } from '../types/game';

const normalizeStoredGame = (raw: Game): Game => ({
  ...raw,
  ranking: raw.ranking ?? 'high-wins',
  avatarStyle: raw.avatarStyle ?? 'abstract',
});
import { supabase, gameToRow, rowToGame, GameHistoryRow } from '../lib/supabase';

// ── Offline sync ─────────────────────────────────────────────────────────────
// When an upload fails (usually a dropped connection), the latest state of the
// game is parked in a pending store on this device and retried in the
// background until it reaches Supabase. Saves for the same game run one at a
// time, in order, so an older save can never land after a newer one.

const PENDING_GAMES_KEY = 'card-game-scorer-pending-games';
const PENDING_HISTORY_KEY = 'card-game-scorer-pending-history';
const LEGACY_RECOVERED_KEY = 'card-game-scorer-legacy-recovered';
const RETRY_INTERVAL_MS = 30_000;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to write to local storage:', error);
  }
};

const readPendingGames = () => readJson<Record<string, Game>>(PENDING_GAMES_KEY, {});
const readPendingHistory = () => readJson<Record<string, GameHistory[]>>(PENDING_HISTORY_KEY, {});

const syncListeners = new Set<() => void>();
const notifySyncListeners = () => syncListeners.forEach(listener => listener());

export const subscribeToSyncStatus = (listener: () => void): (() => void) => {
  syncListeners.add(listener);
  return () => { syncListeners.delete(listener); };
};

export const hasPendingGame = (id: string): boolean => id in readPendingGames();
export const hasAnyPendingGames = (): boolean => Object.keys(readPendingGames()).length > 0;

const setPendingGame = (game: Game) => {
  writeJson(PENDING_GAMES_KEY, { ...readPendingGames(), [game.id]: game });
  notifySyncListeners();
};

const clearPendingGame = (id: string) => {
  const pending = readPendingGames();
  if (!(id in pending)) return;
  delete pending[id];
  writeJson(PENDING_GAMES_KEY, pending);
  notifySyncListeners();
};

const setPendingHistory = (gameId: string, history: GameHistory[]) => {
  writeJson(PENDING_HISTORY_KEY, { ...readPendingHistory(), [gameId]: history });
};

const clearPendingHistory = (gameId: string) => {
  const pending = readPendingHistory();
  if (!(gameId in pending)) return;
  delete pending[gameId];
  writeJson(PENDING_HISTORY_KEY, pending);
};

const saveQueues = new Map<string, Promise<void>>();

const enqueue = (key: string, task: () => Promise<void>): Promise<void> => {
  const previous = saveQueues.get(key) ?? Promise.resolve();
  const next = previous.then(task, task);
  saveQueues.set(key, next);
  const cleanup = () => { if (saveQueues.get(key) === next) saveQueues.delete(key); };
  next.then(cleanup, cleanup);
  return next;
};

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

const uploadGame = async (game: Game) => {
  if (!supabase) return;
  if (isOffline()) throw new Error('offline');
  const { error } = await supabase
    .from('games')
    .upsert(gameToRow(game), { onConflict: 'id' });
  if (error) throw error;
};

const uploadHistory = async (gameId: string, history: GameHistory[]) => {
  if (!supabase) return;
  if (isOffline()) throw new Error('offline');

  const { error: deleteError } = await supabase
    .from('game_history')
    .delete()
    .eq('game_id', gameId);
  if (deleteError) throw deleteError;

  const historyRows: GameHistoryRow[] = history.map(h => ({
    game_id: h.gameState.id,
    action: h.action,
    game_state: h.gameState,
    timestamp: h.timestamp,
  }));

  const { error } = await supabase
    .from('game_history')
    .insert(historyRows);
  if (error) throw error;
};

let activeSync: Promise<void> | null = null;

export const isSyncInProgress = (): boolean => activeSync !== null;

// Retries every parked upload. Each retry runs in that game's save queue and
// re-reads the pending store when its turn comes, so it always sends the
// newest unsynced state rather than a stale snapshot.
export const syncPendingChanges = (): Promise<void> => {
  if (!supabase) return Promise.resolve();
  if (activeSync) return activeSync;

  activeSync = (async () => {
    notifySyncListeners();

    for (const id of Object.keys(readPendingGames())) {
      await enqueue(id, async () => {
        const game = readPendingGames()[id];
        if (!game) return;
        try {
          await uploadGame(game);
          clearPendingGame(id);
        } catch (error) {
          console.warn('Still unable to sync game, will retry:', error);
        }
      });
    }

    for (const gameId of Object.keys(readPendingHistory())) {
      await enqueue(`history:${gameId}`, async () => {
        const history = readPendingHistory()[gameId];
        if (!history) return;
        try {
          await uploadHistory(gameId, history);
          clearPendingHistory(gameId);
        } catch (error) {
          console.warn('Still unable to sync game history, will retry:', error);
        }
      });
    }
  })().finally(() => {
    activeSync = null;
    notifySyncListeners();
  });

  return activeSync;
};

const countScoredRounds = (game: Game) =>
  game.players.reduce((count, player) => count + player.roundScores.length, 0);

// Before the pending store existed, failed uploads were written to the
// local games list and never retried. Find any of those that are further
// along than the copy in Supabase and queue them for upload.
const recoverLegacyLocalGames = async () => {
  if (!supabase || isOffline()) return;
  if (readJson<boolean>(LEGACY_RECOVERED_KEY, false)) return;

  const localGames = getGamesFromLocalStorage();
  if (localGames.length > 0) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .in('id', localGames.map(g => g.id));
    if (error) return;

    const remoteById = new Map((data ?? []).map(row => [row.id, rowToGame(row)]));
    for (const local of localGames) {
      const remote = remoteById.get(local.id);
      // A game missing from Supabase may have been deleted on purpose.
      if (!remote || remote.status === 'completed' || hasPendingGame(local.id)) continue;
      const isAhead = local.status === 'completed' || countScoredRounds(local) > countScoredRounds(remote);
      if (isAhead) setPendingGame(local);
    }
  }

  writeJson(LEGACY_RECOVERED_KEY, true);
};

let backgroundSyncStarted = false;

export const startBackgroundSync = () => {
  if (!supabase || backgroundSyncStarted || typeof window === 'undefined') return;
  backgroundSyncStarted = true;

  const run = () => {
    recoverLegacyLocalGames()
      .catch(console.error)
      .then(() => syncPendingChanges());
  };

  run();
  window.addEventListener('online', run);
  window.addEventListener('offline', notifySyncListeners);
  window.addEventListener('storage', notifySyncListeners);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run();
  });
  window.setInterval(() => {
    if (!isOffline() && hasAnyPendingGames()) syncPendingChanges();
  }, RETRY_INTERVAL_MS);
};

const withPendingGames = (games: Game[]): Game[] => {
  const pending = readPendingGames();
  const merged = games.map(g => pending[g.id] ?? g);
  const knownIds = new Set(games.map(g => g.id));
  Object.values(pending).forEach(g => {
    if (!knownIds.has(g.id)) merged.push(g);
  });
  return merged.map(normalizeStoredGame);
};

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

  return enqueue(game.id, async () => {
    try {
      await uploadGame(game);
      clearPendingGame(game.id);
    } catch (error) {
      console.warn('Failed to sync game to Supabase, saved on this device for retry:', error);
      setPendingGame(game);
    }
  });
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
    
    return withPendingGames(data ? data.map(rowToGame) : []);
  } catch (error) {
    return withPendingGames(getGamesFromLocalStorage());
  }
};

export const getGame = async (id: string): Promise<Game | null> => {
  if (!supabase) {
    const games = getGamesFromLocalStorage();
    return games.find(g => g.id === id) || null;
  }

  // Unsynced changes on this device are newer than what Supabase has.
  const pending = readPendingGames()[id];
  if (pending) {
    syncPendingChanges();
    return normalizeStoredGame(pending);
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
  clearPendingGame(id);
  clearPendingHistory(id);

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
  writeJson(PENDING_GAMES_KEY, {});
  writeJson(PENDING_HISTORY_KEY, {});
  notifySyncListeners();

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

  const gameId = history[0]?.gameState?.id;
  if (!gameId) return;

  return enqueue(`history:${gameId}`, async () => {
    try {
      await uploadHistory(gameId, history);
      clearPendingHistory(gameId);
    } catch (error) {
      setPendingHistory(gameId, history);
    }
  });
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

  if (gameId) {
    const pending = readPendingHistory()[gameId];
    if (pending) return pending;
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
