// Builds the Monday digest: for each person, the leagues they're in that
// played games in the last week, who won the most, and where the current
// season stands. People whose leagues were quiet don't get one.
import type { DigestLeague, WeeklyDigestEmailProps } from '../../emails/templates/notifications/weekly-digest.js';
import type { LeagueMember } from '../../src/hooks/useLeagues.js';
import { rankGamePlayers, standingsKeyForPlayer } from '../../src/utils/seasonStandings.js';
import { rest, siteUrl } from './share.js';
import { GAME_COLUMNS, GameRow, loadMembers, loadSeasonStandings, toGame } from './cardData.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const shortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const memberName = (members: LeagueMember[], key: string) => {
  const member = members.find(m => m.user_id === key);
  return member ? member.profile.display_name || member.profile.email.split('@')[0] || 'A player' : key;
};

export interface DigestForUser {
  userId: string;
  weekKey: string;
  digest: Pick<WeeklyDigestEmailProps, 'weekLabel' | 'leagues'>;
}

export async function buildWeeklyDigests(now = new Date()): Promise<DigestForUser[]> {
  const since = new Date(now.getTime() - 7 * DAY_MS);
  const weekLabel = `${shortDate(since)} – ${shortDate(new Date(now.getTime() - DAY_MS))}`;
  const weekKey = now.toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const gameRows = await rest<GameRow[]>(
    `games?status=eq.completed&league_id=not.is.null&updated_at=gte.${encodeURIComponent(since.toISOString())}` +
      `&select=${GAME_COLUMNS}&order=updated_at.asc&limit=5000`,
  );
  const games = (gameRows ?? []).map(toGame);
  const leagueIds = [...new Set(games.map(g => g.league_id).filter((id): id is string => !!id))];
  if (leagueIds.length === 0) return [];

  const [leagues, seasons] = await Promise.all([
    rest<{ id: string; name: string }[]>(`leagues?id=in.(${leagueIds.join(',')})&select=id,name`),
    rest<{ id: string; league_id: string; start_date: string; end_date: string }[]>(
      `league_seasons?league_id=in.(${leagueIds.join(',')})&start_date=lte.${today}&end_date=gte.${today}&select=id,league_id,start_date,end_date`,
    ),
  ]);

  // Per league: this week's activity, plus the active season's standings.
  const perLeague = new Map<string, { members: LeagueMember[]; build: (userId: string) => DigestLeague }>();
  for (const league of leagues ?? []) {
    const members = await loadMembers(league.id);
    const leagueGames = games.filter(g => g.league_id === league.id);

    const wins = new Map<string, number>();
    const played = new Map<string, number>();
    for (const game of leagueGames) {
      for (const { player, rank } of rankGamePlayers(game)) {
        const key = standingsKeyForPlayer(player.id, player.name, members);
        played.set(key, (played.get(key) ?? 0) + 1);
        if (rank === 1) wins.set(key, (wins.get(key) ?? 0) + 1);
      }
    }
    const mostWins = Math.max(0, ...wins.values());
    const topWinners = mostWins > 0
      ? { names: [...wins.entries()].filter(([, w]) => w === mostWins).map(([key]) => memberName(members, key)), wins: mostWins }
      : null;

    // If a league somehow has two active seasons, use the one that started last.
    const activeSeason = (seasons ?? [])
      .filter(s => s.league_id === league.id)
      .sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const seasonStandings = activeSeason ? await loadSeasonStandings(activeSeason.id) : null;

    perLeague.set(league.id, {
      members,
      build: (userId: string) => ({
        name: league.name,
        url: `${siteUrl()}/leagues/${league.id}`,
        gamesThisWeek: leagueGames.length,
        topWinners,
        yourGames: played.get(userId) ?? 0,
        yourWins: wins.get(userId) ?? 0,
        season: seasonStandings && activeSeason
          ? {
              name: seasonStandings.season.name,
              url: `${siteUrl()}/leagues/${league.id}/seasons/${activeSeason.id}`,
              leaders: seasonStandings.standings.filter(s => s.rank === 1).map(s => s.displayName),
              yourRank: seasonStandings.standings.find(s => s.userId === userId)?.rank ?? null,
              playerCount: seasonStandings.standings.length,
              endsInDays: activeSeason.end_date.startsWith('9999')
                ? null
                : Math.max(0, Math.ceil((new Date(`${activeSeason.end_date}T23:59:59Z`).getTime() - now.getTime()) / DAY_MS)),
            }
          : null,
      }),
    });
  }

  // Group by person.
  const byUser = new Map<string, DigestLeague[]>();
  for (const [, league] of perLeague) {
    for (const member of league.members) {
      const list = byUser.get(member.user_id) ?? [];
      list.push(league.build(member.user_id));
      byUser.set(member.user_id, list);
    }
  }

  return [...byUser.entries()].map(([userId, userLeagues]) => ({
    userId,
    weekKey,
    digest: {
      weekLabel,
      // Leagues you played in first, then the busiest.
      leagues: userLeagues.sort((a, b) => b.yourGames - a.yourGames || b.gamesThisWeek - a.gamesThisWeek),
    },
  }));
}
