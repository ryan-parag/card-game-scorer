// Lock Screen content for a game's Live Activity. Must match
// GameActivityAttributes.ContentState in the iOS app
// (ios/Shared/GameActivityAttributes.swift) and the app's own local updates
// (lib/core/live_activity/live_activity_service.dart): scores only, top 5.

export const MAX_PLAYERS = 5;

export interface GamePlayer {
  name?: string;
  color?: string;
  totalScore?: number;
}

export interface GameRecord {
  id: string;
  name?: string;
  league_id?: string | null;
  season_id?: string | null;
  score_recorded_by?: string | null;
  status?: string;
  ranking?: string | null;
  current_round?: number;
  max_rounds?: number;
  players?: GamePlayer[];
  updated_at?: string;
}

const formatScore = (score: number) =>
  Number.isInteger(score) ? String(score) : score.toFixed(1);

const normalizeColor = (color: string | undefined) =>
  color && /^#?[0-9a-f]{6}$/i.test(color) ? `#${color.replace('#', '').toUpperCase()}` : '#8E8E93';

// Dense ranking (1, 1, 3), like the apps' rankPlayers.
export function contentStateFor(game: GameRecord) {
  const lowWins = game.ranking === 'low-wins';
  const players = [...(game.players ?? [])].sort((a, b) =>
    lowWins ? (a.totalScore ?? 0) - (b.totalScore ?? 0) : (b.totalScore ?? 0) - (a.totalScore ?? 0),
  );
  const ranks: number[] = [];
  players.forEach((p, i) => {
    ranks.push(i > 0 && p.totalScore === players[i - 1].totalScore ? ranks[i - 1] : i + 1);
  });

  const isCompleted = game.status === 'completed';
  const winners = players.filter((_, i) => ranks[i] === 1).map(p => p.name ?? 'Player');
  const shown = players.slice(0, MAX_PLAYERS);

  return {
    round: game.current_round ?? 1,
    maxRounds: game.max_rounds ?? 1,
    isCompleted,
    players: shown.map((p, i) => ({
      name: p.name ?? 'Player',
      score: formatScore(p.totalScore ?? 0),
      rank: ranks[i],
      colorHex: normalizeColor(p.color),
    })),
    otherPlayerCount: players.length - shown.length,
    ...(isCompleted && winners.length > 0
      ? { resultText: winners.length > 1 ? `🤝 ${winners.join(' & ')} tied` : `🎉 ${winners[0]} wins` }
      : {}),
  };
}

