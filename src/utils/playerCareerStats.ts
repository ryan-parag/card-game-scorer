import { Game } from '../types/game';

export interface CareerStats {
  gamesPlayed: number;
  wins: number;
  podiums: number;
  winRate: number;
  currentWinStreak: number;
  longestWinStreak: number;
  favoriteGame: string | null;
}

// Dense rank (ties share first place) so co-winners both count as a win,
// consistent with how win probability and season standings treat ties.
function rankForPlayer(game: Game, playerId: string): number | null {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;
  const score = player.totalScore ?? 0;
  const better = game.players.filter((p) => {
    const s = p.totalScore ?? 0;
    return game.ranking === 'low-wins' ? s < score : s > score;
  }).length;
  return better + 1;
}

// Career stats for a player across all their completed games — any league,
// season, or casual game. Streaks are computed in chronological order.
export function computeCareerStats(games: Game[], playerId: string): CareerStats {
  const chronological = [...games]
    .filter((g) => g.players.some((p) => p.id === playerId))
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  let wins = 0;
  let podiums = 0;
  let longestWinStreak = 0;
  let runningStreak = 0;
  const gameNameCounts: Record<string, number> = {};

  for (const game of chronological) {
    const rank = rankForPlayer(game, playerId);
    if (rank === null) continue;

    gameNameCounts[game.name] = (gameNameCounts[game.name] ?? 0) + 1;

    if (rank === 1) {
      wins++;
      runningStreak++;
      longestWinStreak = Math.max(longestWinStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
    if (rank <= 3) podiums++;
  }

  const gamesPlayed = chronological.length;
  const favoriteGame = Object.entries(gameNameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    gamesPlayed,
    wins,
    podiums,
    winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    currentWinStreak: runningStreak,
    longestWinStreak,
    favoriteGame,
  };
}
