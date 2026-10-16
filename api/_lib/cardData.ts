// Loads what each share card shows. Uses the app's own stats code so cards
// match the numbers people see in ScoreKeeper.
import type { Game, Player } from '../../src/types/game';
import type { LeagueMember } from '../../src/hooks/useLeagues';
import type { ScoringSystem } from '../../src/hooks/useScoringSystem';
import { computeSeasonStandings } from '../../src/utils/seasonStandings';
import { computeCareerStats } from '../../src/utils/playerCareerStats';
import { computeHeadToHead } from '../../src/utils/headToHead';
import { rest, countRows, ShareTarget, UUID_PATTERN } from './share';

interface GameRow {
  id: string;
  name: string;
  players: Player[];
  ranking: Game['ranking'] | null;
  status: Game['status'];
  league_id: string | null;
  season_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
}

const GAME_COLUMNS = 'id,name,players,ranking,status,league_id,season_id,created_at,updated_at';

const toGame = (row: GameRow): Game => ({
  id: row.id,
  name: row.name,
  players: Array.isArray(row.players) ? row.players : [],
  rounds: [],
  currentRound: 0,
  maxRounds: 0,
  collectProposedScores: false,
  ranking: row.ranking ?? 'high-wins',
  gameType: 'standard',
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  league_id: row.league_id,
  season_id: row.season_id,
});

const profileName = (p: ProfileRow | undefined | null, fallback = 'A player') =>
  p?.display_name || p?.email?.split('@')[0] || fallback;

const seasonStatus = (start: string, end: string): 'upcoming' | 'active' | 'completed' => {
  const now = new Date();
  if (now < new Date(start)) return 'upcoming';
  if (now > new Date(end)) return 'completed';
  return 'active';
};

async function loadMembers(leagueId: string): Promise<LeagueMember[]> {
  const rows = await rest<(Omit<LeagueMember, 'profile'> & { profile: ProfileRow | null })[]>(
    `league_members?league_id=eq.${leagueId}&select=id,league_id,user_id,role,joined_at,profile:profiles(id,email,display_name,avatar_url,created_at)`,
  );
  return (rows ?? []).map(m => ({
    ...m,
    profile: {
      ...m.profile,
      id: m.user_id,
      email: m.profile?.email ?? '',
      display_name: m.profile?.display_name ?? null,
      avatar_url: m.profile?.avatar_url ?? null,
    } as LeagueMember['profile'],
  }));
}

async function loadProfiles(ids: string[]): Promise<Map<string, ProfileRow>> {
  const uuids = [...new Set(ids)].filter(id => UUID_PATTERN.test(id));
  if (uuids.length === 0) return new Map();
  const rows = await rest<ProfileRow[]>(`profiles?id=in.(${uuids.join(',')})&select=id,email,display_name,avatar_url`);
  return new Map((rows ?? []).map(p => [p.id, p]));
}

// ── Season ───────────────────────────────────────────────────────────────────

export interface StandingRow {
  name: string;
  color: string;
  score: number;
  wins: number;
  rank: number;
}

export interface SeasonCard {
  kind: 'season';
  leagueId: string;
  leagueName: string;
  seasonName: string;
  status: 'upcoming' | 'active' | 'completed';
  gamesPlayed: number;
  standings: StandingRow[];
  leaders: string[];
}

export async function loadSeasonCard(seasonId: string): Promise<SeasonCard | null> {
  const seasons = await rest<{
    id: string; name: string; start_date: string; end_date: string;
    scoring_system_id: string | null; league_id: string; league: { name: string } | null;
  }[]>(`league_seasons?id=eq.${seasonId}&select=id,name,start_date,end_date,scoring_system_id,league_id,league:leagues(name)`);
  const season = seasons?.[0];
  if (!season) return null;

  const [members, gameRows, systems] = await Promise.all([
    loadMembers(season.league_id),
    rest<GameRow[]>(`games?season_id=eq.${seasonId}&status=eq.completed&select=${GAME_COLUMNS}&order=updated_at.asc`),
    season.scoring_system_id
      ? rest<ScoringSystem[]>(`scoring_systems?id=eq.${season.scoring_system_id}&select=id,name,description,created_by,created_at,rules:scoring_system_rules(id,scoring_system_id,rank,points)`)
      : Promise.resolve(null),
  ]);

  const games = (gameRows ?? []).map(toGame);
  const standings = computeSeasonStandings(games, members, systems?.[0] ?? null);

  return {
    kind: 'season',
    leagueId: season.league_id,
    leagueName: season.league?.name ?? 'League',
    seasonName: season.name,
    status: seasonStatus(season.start_date, season.end_date),
    gamesPlayed: games.length,
    standings: standings.slice(0, 5).map(s => ({
      name: s.displayName,
      color: s.color,
      score: s.totalScore,
      wins: s.wins,
      rank: s.rank,
    })),
    leaders: standings.filter(s => s.rank === 1).map(s => s.displayName),
  };
}

// ── League invite ────────────────────────────────────────────────────────────

export interface LeagueCard {
  kind: 'league';
  leagueName: string;
  description: string | null;
  inviterName: string | null;
  memberNames: string[];
  memberCount: number;
  seasonCount: number;
  gamesPlayed: number;
}

export async function loadLeagueCard(leagueId: string, inviterId: string): Promise<LeagueCard | null> {
  const [leagues, members, seasonCount, gamesPlayed] = await Promise.all([
    rest<{ name: string; description: string | null }[]>(`leagues?id=eq.${leagueId}&select=name,description`),
    loadMembers(leagueId),
    countRows('league_seasons', `league_id=eq.${leagueId}`),
    countRows('games', `league_id=eq.${leagueId}&status=eq.completed`),
  ]);
  const league = leagues?.[0];
  if (!league) return null;

  const inviter = members.find(m => m.user_id === inviterId);
  return {
    kind: 'league',
    leagueName: league.name,
    description: league.description,
    inviterName: inviter ? profileName(inviter.profile) : null,
    memberNames: members.map(m => profileName(m.profile)),
    memberCount: members.length,
    seasonCount,
    gamesPlayed,
  };
}

// ── Player games (wrapped + rivalry) ─────────────────────────────────────────

async function loadPlayerGames(playerIds: string[]): Promise<Game[]> {
  const contains = encodeURIComponent(JSON.stringify(playerIds.map(id => ({ id }))));
  const rows = await rest<GameRow[]>(
    `games?status=eq.completed&players=cs.${contains}&select=${GAME_COLUMNS}&order=updated_at.asc&limit=2000`,
  );
  return (rows ?? []).map(toGame);
}

const better = (game: Game, a: number, b: number) => (game.ranking === 'low-wins' ? a < b : a > b);

// ── Wrapped ──────────────────────────────────────────────────────────────────

export interface WrappedCard {
  kind: 'wrapped';
  playerName: string;
  year: number;
  yearInProgress: boolean;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  podiums: number;
  longestWinStreak: number;
  favoriteGame: string | null;
  favoriteGameCount: number;
  topRival: { name: string; gamesTogether: number; wins: number; losses: number } | null;
}

export async function loadWrappedCard(userId: string, year: number): Promise<WrappedCard | null> {
  const [profiles, allGames] = await Promise.all([loadProfiles([userId]), loadPlayerGames([userId])]);
  const profile = profiles.get(userId);
  if (!profile) return null;

  const games = allGames.filter(g => new Date(g.createdAt).getUTCFullYear() === year);
  const stats = computeCareerStats(games, userId);

  // Opponents are grouped by account, or by name for people typed in by hand
  // (whose ids change from game to game).
  const rivals = new Map<string, { name: string; gamesTogether: number; wins: number; losses: number }>();
  for (const game of games) {
    const me = game.players.find(p => p.id === userId);
    if (!me) continue;
    for (const other of game.players) {
      if (other.id === userId || !other.name?.trim()) continue;
      const key = UUID_PATTERN.test(other.id) ? other.id : `name:${other.name.trim().toLowerCase()}`;
      const entry = rivals.get(key) ?? { name: other.name.trim(), gamesTogether: 0, wins: 0, losses: 0 };
      entry.gamesTogether++;
      if (better(game, me.totalScore ?? 0, other.totalScore ?? 0)) entry.wins++;
      else if (better(game, other.totalScore ?? 0, me.totalScore ?? 0)) entry.losses++;
      rivals.set(key, entry);
    }
  }
  const topRivalEntry = [...rivals.entries()].sort((a, b) => b[1].gamesTogether - a[1].gamesTogether)[0];
  if (topRivalEntry && UUID_PATTERN.test(topRivalEntry[0])) {
    const rivalProfile = (await loadProfiles([topRivalEntry[0]])).get(topRivalEntry[0]);
    if (rivalProfile) topRivalEntry[1].name = profileName(rivalProfile, topRivalEntry[1].name);
  }

  return {
    kind: 'wrapped',
    playerName: profileName(profile),
    year,
    yearInProgress: new Date().getUTCFullYear() === year,
    gamesPlayed: stats.gamesPlayed,
    wins: stats.wins,
    winRate: stats.winRate,
    podiums: stats.podiums,
    longestWinStreak: stats.longestWinStreak,
    favoriteGame: stats.favoriteGame,
    favoriteGameCount: stats.favoriteGame ? games.filter(g => g.name === stats.favoriteGame).length : 0,
    topRival: topRivalEntry?.[1] ?? null,
  };
}

// ── Rivalry ──────────────────────────────────────────────────────────────────

export interface RivalryCard {
  kind: 'rivalry';
  playerName: string;
  opponentName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  favoriteGame: string | null;
  lastResult: { gameName: string; winnerName: string | null; date: string } | null;
}

export async function loadRivalryCard(userId: string, opponentId: string): Promise<RivalryCard | null> {
  const [profiles, games] = await Promise.all([loadProfiles([userId, opponentId]), loadPlayerGames([userId, opponentId])]);
  const player = profiles.get(userId);
  const opponent = profiles.get(opponentId);
  if (!player || !opponent) return null;

  const record = computeHeadToHead(games, userId, opponentId);
  const nameCounts = new Map<string, number>();
  games.forEach(g => nameCounts.set(g.name, (nameCounts.get(g.name) ?? 0) + 1));
  const favoriteGame = [...nameCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const last = games[games.length - 1];
  let lastResult: RivalryCard['lastResult'] = null;
  if (last) {
    const mine = last.players.find(p => p.id === userId)?.totalScore ?? 0;
    const theirs = last.players.find(p => p.id === opponentId)?.totalScore ?? 0;
    lastResult = {
      gameName: last.name,
      winnerName: mine === theirs ? null : better(last, mine, theirs) ? profileName(player) : profileName(opponent),
      date: last.updatedAt,
    };
  }

  return {
    kind: 'rivalry',
    playerName: profileName(player),
    opponentName: profileName(opponent),
    ...record,
    favoriteGame,
    lastResult,
  };
}

export type CardData = SeasonCard | LeagueCard | WrappedCard | RivalryCard;

export function loadCard(target: ShareTarget): Promise<CardData | null> {
  switch (target.kind) {
    case 'season': return loadSeasonCard(target.id);
    case 'league': return loadLeagueCard(target.id, target.extra);
    case 'wrapped': return loadWrappedCard(target.id, Number(target.extra));
    case 'rivalry': return loadRivalryCard(target.id, target.extra);
  }
}

// ── Link preview text ────────────────────────────────────────────────────────

const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;

export function cardText(card: CardData): { title: string; description: string } {
  switch (card.kind) {
    case 'season': {
      const where = `${card.seasonName} of ${card.leagueName}`;
      const standings = card.standings.map(s => `${s.name} (${s.score})`).join(', ');
      if (card.gamesPlayed === 0 || card.leaders.length === 0) {
        return { title: `${where} is about to start`, description: 'Follow the standings on ScoreKeeper.' };
      }
      if (card.status === 'completed') {
        return {
          title: card.leaders.length > 1 ? `${joinNames(card.leaders)} shared the title in ${where}` : `${card.leaders[0]} won ${where}`,
          description: `Final standings after ${card.gamesPlayed} games: ${standings}`,
        };
      }
      return {
        title: card.leaders.length > 1 ? `${joinNames(card.leaders)} are tied for the lead in ${where}` : `${card.leaders[0]} leads ${where}`,
        description: `Standings after ${card.gamesPlayed} ${card.gamesPlayed === 1 ? 'game' : 'games'}: ${standings}`,
      };
    }
    case 'league':
      return {
        title: card.inviterName ? `${card.inviterName} invited you to join ${card.leagueName}` : `Join ${card.leagueName} on ScoreKeeper`,
        description: `${card.memberCount} ${card.memberCount === 1 ? 'member' : 'members'} · ${card.seasonCount} ${card.seasonCount === 1 ? 'season' : 'seasons'} · ${card.gamesPlayed} games played`,
      };
    case 'wrapped':
      return {
        title: `${card.playerName}'s ${card.year}${card.yearInProgress ? ' so far' : ''} on ScoreKeeper`,
        description: `${card.gamesPlayed} games · ${card.wins} wins · ${Math.round(card.winRate * 100)}% win rate${card.favoriteGame ? ` · Favorite game: ${card.favoriteGame}` : ''}`,
      };
    case 'rivalry': {
      const score = `${card.wins}–${card.losses}${card.ties ? `–${card.ties}` : ''}`;
      const leader = card.wins === card.losses ? null : card.wins > card.losses ? card.playerName : card.opponentName;
      return {
        title: `${card.playerName} vs ${card.opponentName}: ${score}`,
        description: leader
          ? `${leader} leads the head-to-head after ${card.gamesPlayed} games.`
          : `All square after ${card.gamesPlayed} games.`,
      };
    }
  }
}
