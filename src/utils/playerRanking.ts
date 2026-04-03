import type { Game, GameRanking, Player } from '../types/game';

export const DEFAULT_GAME_RANKING: GameRanking = 'high-wins';

export function resolveRanking(game: Pick<Game, 'ranking'>): GameRanking {
  return game.ranking ?? DEFAULT_GAME_RANKING;
}

/** Best / first place in list order for this ranking mode. */
export function sortPlayersByRanking(players: Player[], ranking: GameRanking): Player[] {
  if (ranking === 'low-wins') {
    return [...players].sort((a, b) => a.totalScore - b.totalScore);
  }
  return [...players].sort((a, b) => b.totalScore - a.totalScore);
}

export function leaderboardHighTotal(players: Player[]): number {
  if (players.length === 0) return 0;
  return Math.max(...players.map((p) => p.totalScore));
}

export function leaderboardLowTotal(players: Player[]): number {
  if (players.length === 0) return 0;
  return Math.min(...players.map((p) => p.totalScore));
}
