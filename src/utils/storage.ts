import { Game, GameHistory } from '../types/game';

const GAMES_KEY = 'card-game-scorer-games';
const HISTORY_KEY = 'card-game-scorer-history';
const SETTINGS_KEY = 'card-game-scorer-settings';

export const saveGame = (game: Game): void => {
  const games = getGames();
  const existingIndex = games.findIndex(g => g.id === game.id);
  
  if (existingIndex >= 0) {
    games[existingIndex] = { ...game, updatedAt: new Date().toISOString() };
  } else {
    games.push(game);
  }
  
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
};

export const getGames = (): Game[] => {
  const stored = localStorage.getItem(GAMES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getGame = (id: string): Game | null => {
  const games = getGames();
  return games.find(g => g.id === id) || null;
};

export const deleteGame = (id: string): void => {
  const games = getGames().filter(g => g.id !== id);
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
};

export const clearAllGames = (): void => {
  localStorage.removeItem(GAMES_KEY);
};

export const saveGameHistory = (history: GameHistory[]): void => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const getGameHistory = (): GameHistory[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveSettings = (settings: any): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): any => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { theme: 'dark' };
};