import { Game, AvatarStyle } from '../types/game';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
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

function normalizeGameName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+(v\d+|\d+)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toLabel(names: string[]): string {
  const freq: Record<string, number> = {};
  for (const n of names) freq[n] = (freq[n] ?? 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

export function nameKey(game: Game): string {
  return normalizeGameName(game.name) || game.name.toLowerCase();
}

export function fullGroupKey(game: Game): string {
  return `${normalizeGameName(game.name)}|${game.maxRounds}`;
}

export function buildNameGroups(games: Game[]): GameGroup[] {
  const buckets: Record<string, string[]> = {};
  for (const g of games) {
    const key = nameKey(g);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(g.name);
  }
  return Object.entries(buckets)
    .map(([key, names]) => ({
      key,
      label: toLabel(names),
      count: names.length,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function buildRoundGroups(games: Game[], selectedNameKey: string): GameGroup[] {
  const buckets: Record<string, { names: string[]; maxRounds: number }> = {};
  for (const g of games) {
    if (nameKey(g) !== selectedNameKey) continue;
    const key = fullGroupKey(g);
    if (!buckets[key]) buckets[key] = { names: [], maxRounds: g.maxRounds };
    buckets[key].names.push(g.name);
  }
  return Object.entries(buckets)
    .map(([key, { names, maxRounds }]) => ({
      key,
      label: `${maxRounds} ${maxRounds === 1 ? 'round' : 'rounds'}`,
      count: names.length,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildGameGroups(games: Game[]): GameGroup[] {
  const buckets: Record<string, { names: string[]; maxRounds: number }> = {};
  for (const g of games) {
    const key = fullGroupKey(g);
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

export function periodCutoff(period: 'week' | 'month'): Date {
  const d = new Date();
  if (period === 'week') d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d;
}

export function buildLeaderboard(
  games: Game[],
  period: 'week' | 'month',
  selectedNameKey: string | null,
  selectedRoundKey: string | null,
  limit = 10
): LeaderboardEntry[] {
  const cutoff = periodCutoff(period);

  const filtered = games.filter((g) => {
    if (g.status !== 'completed') return false;
    if (g.ranking !== 'high-wins') return false;
    if (new Date(g.updatedAt) < cutoff) return false;
    if (selectedNameKey !== null && nameKey(g) !== selectedNameKey) return false;
    if (selectedRoundKey !== null && fullGroupKey(g) !== selectedRoundKey) return false;
    return true;
  });

  const entries: Omit<LeaderboardEntry, 'rank'>[] = [];

  for (const game of filtered) {
    for (const player of game.players) {
      entries.push({
        playerId: player.id,
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
