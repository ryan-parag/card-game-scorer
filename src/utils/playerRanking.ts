import type { Game, GameRanking, Player } from '../types/game';

export const DEFAULT_GAME_RANKING: GameRanking = 'high-wins';

export function resolveRanking(game: Pick<Game, 'ranking'>): GameRanking {
  return game.ranking ?? DEFAULT_GAME_RANKING;
}

export function sortPlayersByRanking(players: Player[], ranking: GameRanking): Player[] {
  if (ranking === 'low-wins') {
    return [...players].sort((a, b) => a.totalScore - b.totalScore);
  }
  return [...players].sort((a, b) => b.totalScore - a.totalScore);
}

export interface RankedPlayer {
  player: Player;
  rank: number;
  tied: boolean;
}

// Dense/competition ranking: players with equal scores share a rank, and the
// next distinct score picks up at 1 + the number of players ahead of it
// (e.g. 1, 1, 3 rather than 1, 2, 3).
export function rankPlayers(players: Player[], ranking: GameRanking): RankedPlayer[] {
  const sorted = sortPlayersByRanking(players, ranking);
  const rankCounts: Record<number, number> = {};
  const ranked = sorted.map((player, index) => {
    const rank = index > 0 && player.totalScore === sorted[index - 1].totalScore
      ? sorted.findIndex((p) => p.totalScore === player.totalScore) + 1
      : index + 1;
    rankCounts[rank] = (rankCounts[rank] ?? 0) + 1;
    return { player, rank, tied: false };
  });
  return ranked.map((r) => ({ ...r, tied: rankCounts[r.rank] > 1 }));
}

// All players sharing the top score (length > 1 means the game ended in a tie).
export function getWinners(players: Player[], ranking: GameRanking): Player[] {
  if (players.length === 0) return [];
  const sorted = sortPlayersByRanking(players, ranking);
  const topScore = sorted[0].totalScore;
  return sorted.filter((p) => p.totalScore === topScore);
}

export function leaderboardHighTotal(players: Player[]): number {
  if (players.length === 0) return 0;
  return Math.max(...players.map((p) => p.totalScore));
}

export function leaderboardLowTotal(players: Player[]): number {
  if (players.length === 0) return 0;
  return Math.min(...players.map((p) => p.totalScore));
}
