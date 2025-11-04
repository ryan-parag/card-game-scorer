import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Game, GameHistory } from '../types/game';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client if credentials are available, otherwise null
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Database table types
export interface GameRow {
  id: string;
  name: string;
  players: Game['players'];
  rounds: Game['rounds'];
  current_round: number;
  max_rounds: number;
  collect_proposed_scores: boolean;
  game_type: 'standard' | 'custom';
  status: 'setup' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface GameHistoryRow {
  id?: string;
  game_id: string;
  action: string;
  game_state: Game;
  timestamp: string;
}

// Convert Game to database format
export const gameToRow = (game: Game): GameRow => ({
  id: game.id,
  name: game.name,
  players: game.players,
  rounds: game.rounds,
  current_round: game.currentRound,
  max_rounds: game.maxRounds,
  collect_proposed_scores: game.collectProposedScores,
  game_type: game.gameType,
  status: game.status,
  created_at: game.createdAt,
  updated_at: game.updatedAt,
});

// Convert database row to Game
export const rowToGame = (row: GameRow): Game => ({
  id: row.id,
  name: row.name,
  players: row.players,
  rounds: row.rounds,
  currentRound: row.current_round,
  maxRounds: row.max_rounds,
  collectProposedScores: row.collect_proposed_scores,
  gameType: row.game_type,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

