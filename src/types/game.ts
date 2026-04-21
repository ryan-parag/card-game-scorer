export type GameRanking = 'high-wins' | 'low-wins';

export type AvatarStyle = 'abstract' | 'text' | 'f1' | 'corp';

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  totalScore: number;
  roundScores: number[];
  proposedScore?: number;
}

export interface GameRound {
  roundNumber: number;
  scores: { [playerId: string]: number };
  proposedScores?: { [playerId: string]: number };
  completed: boolean;
}

export interface Game {
  id: string;
  name: string;
  players: Player[];
  rounds: GameRound[];
  currentRound: number;
  maxRounds: number;
  collectProposedScores: boolean;
  /** How to order standings: highest total wins vs lowest total wins (e.g. golf). */
  ranking: GameRanking;
  avatarStyle?: AvatarStyle;
  gameType: 'standard' | 'custom';
  status: 'setup' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  league_id?: string | null;
  season_id?: string | null;
  created_by?: string | null;
}

export interface GameHistory {
  action: string;
  gameState: Game;
  timestamp: string;
}