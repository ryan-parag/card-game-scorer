import { Game, Player } from '../types/game';
import type { ScoringSystem } from '../hooks/useScoringSystem';
import type { LeagueMember, LeagueSeason } from '../hooks/useLeagues';
import { computeSeasonStatus } from '../hooks/useLeagues';
import { computeSeasonStandings, rankGamePlayers, standingsKeyForPlayer } from './seasonStandings';

export interface LeagueRecord {
  value: number;
  playerNames: string[];
  // Where the record was set: a game name or a season name.
  context: string;
}

export interface LeagueStats {
  gamesPlayed: number;
  seasonsPlayed: number;
  playerCount: number;
  avgPlayers: number;
  totalRounds: number;
  highestScore: LeagueRecord | null;
  biggestMargin: LeagueRecord | null;
  mostWinsInSeason: LeagueRecord | null;
  topRivalry: LeagueRecord | null;
}

function displayNameFor(player: Player, leagueMembers: LeagueMember[]): string {
  const member = leagueMembers.find(m => m.user_id === player.id);
  return member ? (member.profile.display_name ?? member.profile.email.split('@')[0]) : player.name;
}

// Keys (see standingsKeyForPlayer) of each completed season's champion, as
// shown on the season rows: the top entry of that season's standings.
export function computeSeasonChampions(
  completedGames: Game[],
  seasons: LeagueSeason[],
  leagueMembers: LeagueMember[],
  scoringSystemFor: (season: LeagueSeason) => ScoringSystem | null
): Record<string, number> {
  const titles: Record<string, number> = {};
  for (const season of seasons) {
    if (computeSeasonStatus(season.start_date, season.end_date) !== 'completed') continue;
    const seasonGames = completedGames.filter(g => g.season_id === season.id);
    const champion = computeSeasonStandings(seasonGames, leagueMembers, scoringSystemFor(season))[0];
    if (champion) titles[champion.key] = (titles[champion.key] ?? 0) + 1;
  }
  return titles;
}

export function computeLeagueStats(
  completedGames: Game[],
  seasons: LeagueSeason[],
  leagueMembers: LeagueMember[]
): LeagueStats {
  const keyFor = (p: Player) => standingsKeyForPlayer(p.id, p.name, leagueMembers);
  const playerKeys = new Set<string>();
  let highestScore: LeagueRecord | null = null;
  let biggestMargin: LeagueRecord | null = null;
  const rivalries: Record<string, { names: string[]; count: number }> = {};

  for (const game of completedGames) {
    game.players.forEach(p => playerKeys.add(keyFor(p)));

    // A high score only means something in games where high scores win.
    if (game.ranking !== 'low-wins') {
      for (const p of game.players) {
        if (!highestScore || p.totalScore > highestScore.value) {
          highestScore = { value: p.totalScore, playerNames: [displayNameFor(p, leagueMembers)], context: game.name };
        }
      }
    }

    // Margin and rivalry need an outright winner and an outright runner-up.
    const ranked = rankGamePlayers(game);
    const winners = ranked.filter(r => r.rank === 1);
    const runnersUp = ranked.filter(r => r.rank === 2);
    if (winners.length !== 1 || runnersUp.length !== 1) continue;
    const [winner, runnerUp] = [winners[0].player, runnersUp[0].player];

    const margin = Math.abs(winner.totalScore - runnerUp.totalScore);
    if (!biggestMargin || margin > biggestMargin.value) {
      biggestMargin = { value: margin, playerNames: [displayNameFor(winner, leagueMembers)], context: game.name };
    }

    const pair = [winner, runnerUp].sort((a, b) => keyFor(a).localeCompare(keyFor(b)));
    const pairKey = pair.map(keyFor).join('\u0000');
    rivalries[pairKey] ??= { names: pair.map(p => displayNameFor(p, leagueMembers)), count: 0 };
    rivalries[pairKey].count += 1;
  }

  // A rivalry needs to have happened more than once to be worth calling out.
  const rivalry = Object.values(rivalries).sort((a, b) => b.count - a.count)[0];
  const topRivalry: LeagueRecord | null = rivalry && rivalry.count >= 2
    ? { value: rivalry.count, playerNames: rivalry.names, context: '1st & 2nd finishes' }
    : null;

  let mostWinsInSeason: LeagueRecord | null = null;
  for (const season of seasons) {
    const seasonGames = completedGames.filter(g => g.season_id === season.id);
    for (const entry of computeSeasonStandings(seasonGames, leagueMembers, null)) {
      if (entry.wins > 0 && (!mostWinsInSeason || entry.wins > mostWinsInSeason.value)) {
        mostWinsInSeason = { value: entry.wins, playerNames: [entry.displayName], context: season.name };
      }
    }
  }

  return {
    gamesPlayed: completedGames.length,
    seasonsPlayed: seasons.filter(s => computeSeasonStatus(s.start_date, s.end_date) !== 'upcoming').length,
    playerCount: playerKeys.size,
    avgPlayers: completedGames.length > 0
      ? completedGames.reduce((sum, g) => sum + g.players.length, 0) / completedGames.length
      : 0,
    totalRounds: completedGames.reduce((sum, g) => sum + g.maxRounds, 0),
    highestScore,
    biggestMargin,
    mostWinsInSeason,
    topRivalry,
  };
}
