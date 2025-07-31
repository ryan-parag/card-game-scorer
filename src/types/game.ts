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
  gameType: 'standard' | 'custom';
  status: 'setup' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface GameHistory {
  action: string;
  gameState: Game;
  timestamp: string;
}