import { Game, AvatarStyle } from '../types/game';

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  playerColor: string;
  playerAvatar: string;
  avatarStyle?: AvatarStyle;
  score: number;
  gameName: string;
  gameId: string;
  playedAt: string;
}

export interface GameGroup {
  key: string;
  label: string;
  count: number;
}

/** Normalize a game name to a grouping key. */
function normalizeGameName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ')    // strip parenthetical suffixes e.g. "(Rematch)"
    .replace(/[^a-z\s]/g, '')          // strip non-alpha
    .replace(/\s+(v\d+|\d+)\s*$/g, '') // strip trailing version/number
    .replace(/\s+/g, ' ')
    .trim();
}

/** Derive a display label from the most common raw name in a group. */
function toLabel(names: string[]): string {
  const freq: Record<string, number> = {};
  for (const n of names) freq[n] = (freq[n] ?? 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

/** Build a grouping key from a game's normalized name and round count. */
function groupKey(game: Game): string {
  return `${normalizeGameName(game.name)}|${game.maxRounds}`;
}

/** Build a sorted list of game groups from a set of games. */
export function buildGameGroups(games: Game[]): GameGroup[] {
  const buckets: Record<string, { names: string[]; maxRounds: number }> = {};
  for (const g of games) {
    const key = groupKey(g);
    if (!buckets[key]) buckets[key] = { names: [], maxRounds: g.maxRounds };
    buckets[key].names.push(g.name);
  }
  return Object.entries(buckets)
    .map(([key, { names, maxRounds }]) => ({
      key,
      label: `${toLabel(names)} (${maxRounds} ${maxRounds === 1 ? 'round' : 'rounds'})`,
      count: names.length,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Compute the cutoff date for the selected time period. */
export function periodCutoff(period: 'week' | 'month'): Date {
  const d = new Date();
  if (period === 'week') d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d;
}

/** Extract and rank the top-N leaderboard entries given filter state. */
export function buildLeaderboard(
  games: Game[],
  period: 'week' | 'month',
  gameGroupKey: string | null, // null = all games
  limit = 10
): LeaderboardEntry[] {
  const cutoff = periodCutoff(period);

  const filtered = games.filter((g) => {
    if (g.status !== 'completed') return false;
    if (g.ranking !== 'high-wins') return false;
    if (new Date(g.updatedAt) < cutoff) return false;
    if (gameGroupKey !== null && groupKey(g) !== gameGroupKey) return false;
    return true;
  });

  const entries: Omit<LeaderboardEntry, 'rank'>[] = [];

  for (const game of filtered) {
    for (const player of game.players) {
      entries.push({
        playerName: player.name,
        playerColor: player.color,
        playerAvatar: player.avatar,
        avatarStyle: game.avatarStyle,
        score: player.totalScore,
        gameName: game.name,
        gameId: game.id,
        playedAt: game.updatedAt,
      });
    }
  }

  entries.sort((a, b) => b.score - a.score);

  return entries.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}
