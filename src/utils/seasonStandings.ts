import { Game, Player } from '../types/game';
import { ScoringSystem, ScoringSystemRule } from '../hooks/useScoringSystem';
import type { LeagueMember } from '../hooks/useLeagues';

export interface SeasonStandingsEntry {
  key: string;
  userId: string;
  displayName: string;
  color: string;
  avatar: string;
  profileAvatarUrl: string | null;
  champPts: number;
  rawPts: number;
  totalScore: number;
  gamesPlayed: number;
  podiums: number;
  wins: number;
  // Sum of per-game placements, for average finish (finishTotal / gamesPlayed).
  finishTotal: number;
  rank: number;
}

export interface SeasonRankChange {
  direction: 'up' | 'down' | 'same' | 'new';
  delta: number;
}

function pointsForRank(rules: ScoringSystemRule[], rank: number): number {
  return rules.find(r => r.rank === rank)?.points ?? 0;
}

export function standingsKeyForPlayer(playerId: string, playerName: string, leagueMembers: LeagueMember[]): string {
  const memberId = leagueMembers.find(m => m.user_id === playerId)?.user_id;
  return memberId ?? playerName;
}

// Orders a game's players best-first, respecting the game's ranking direction.
// Tied scores share a placement (1, 1, 3), so podiums/wins are credited to
// every player tied for that placement.
export function rankGamePlayers(game: Game): { player: Player; rank: number }[] {
  const rankedPlayers = [...game.players].sort((a, b) =>
    game.ranking === 'low-wins'
      ? (a.totalScore ?? 0) - (b.totalScore ?? 0)
      : (b.totalScore ?? 0) - (a.totalScore ?? 0)
  );
  return rankedPlayers.map((player, i) => {
    const rank = i > 0 && player.totalScore === rankedPlayers[i - 1].totalScore
      ? rankedPlayers.findIndex(p => p.totalScore === player.totalScore) + 1
      : i + 1;
    return { player, rank };
  });
}

// Ranks players across a set of completed games the same way the season standings page does:
// champion points (from the scoring system, if any) plus raw total score.
export function computeSeasonStandings(
  completedGames: Game[],
  leagueMembers: LeagueMember[],
  activeSystem: ScoringSystem | null
): SeasonStandingsEntry[] {
  return accumulateStandings(completedGames, leagueMembers, () => activeSystem);
}

// Tallies per-player results across games, sorted by season score. Each game's
// rank points come from the scoring system `systemForGame` returns for it.
function accumulateStandings(
  completedGames: Game[],
  leagueMembers: LeagueMember[],
  systemForGame: (game: Game) => ScoringSystem | null
): SeasonStandingsEntry[] {
  const memberMap = Object.fromEntries(
    leagueMembers.map(m => [m.user_id, m.profile.display_name ?? m.profile.email.split('@')[0]])
  );

  const scoreMap: Record<string, Omit<SeasonStandingsEntry, 'key' | 'userId' | 'totalScore' | 'rank'>> = {};

  for (const game of completedGames) {
    const gameRanks = rankGamePlayers(game);
    const activeSystem = systemForGame(game);

    const podiumKeys = new Set(
      gameRanks.filter(({ rank }) => rank <= 3).map(({ player }) => standingsKeyForPlayer(player.id, player.name, leagueMembers))
    );

    gameRanks.forEach(({ player, rank }) => {
      const key = standingsKeyForPlayer(player.id, player.name, leagueMembers);
      const memberId = leagueMembers.find(m => m.user_id === player.id)?.user_id;
      const member = memberId ? leagueMembers.find(m => m.user_id === memberId) : undefined;

      if (!scoreMap[key]) {
        scoreMap[key] = {
          displayName: memberId ? (memberMap[memberId] ?? player.name) : player.name,
          color: player.color ?? '#888',
          avatar: player.avatar ?? '',
          profileAvatarUrl: member?.profile.avatar_url ?? null,
          champPts: 0,
          rawPts: 0,
          gamesPlayed: 0,
          podiums: 0,
          wins: 0,
          finishTotal: 0,
        };
      }

      scoreMap[key].champPts += activeSystem ? pointsForRank(activeSystem.rules, rank) : 0;
      scoreMap[key].rawPts += player.totalScore ?? 0;
      scoreMap[key].gamesPlayed += 1;
      if (podiumKeys.has(key)) scoreMap[key].podiums += 1;
      if (rank === 1) scoreMap[key].wins += 1;
      scoreMap[key].finishTotal += rank;
    });
  }

  const totalScoreFor = (entry: Omit<SeasonStandingsEntry, 'key' | 'userId' | 'totalScore' | 'rank'>) =>
    entry.champPts + entry.rawPts;

  const sortedEntries = Object.entries(scoreMap).sort(
    ([, a], [, b]) => totalScoreFor(b) - totalScoreFor(a)
  );

  return sortedEntries.map(([key, entry], i) => {
    // Dense rank: entries with an equal season score share a rank.
    const rank = i > 0 && totalScoreFor(entry) === totalScoreFor(sortedEntries[i - 1][1])
      ? sortedEntries.findIndex(([, e]) => totalScoreFor(e) === totalScoreFor(entry)) + 1
      : i + 1;
    return {
      ...entry,
      key,
      totalScore: entry.champPts + entry.rawPts,
      userId: leagueMembers.some(m => m.user_id === key) ? key : '',
      rank,
    };
  });
}

export type StandingsMode = 'total' | 'game-pts' | 'rank-pts';

export function standingsValue(entry: SeasonStandingsEntry, mode: StandingsMode): number {
  return mode === 'rank-pts' ? entry.champPts : mode === 'game-pts' ? entry.rawPts : entry.champPts + entry.rawPts;
}

// All-time league standings, ranked by the chosen score: total score (game
// points plus rank points), game points alone, or rank points alone. Rank
// points come from each game's own season scoring system, so seasons with
// different systems add up correctly. Ties fall back to wins, then podiums,
// then best average finish.
export function computeLeagueStandings(
  completedGames: Game[],
  leagueMembers: LeagueMember[],
  mode: StandingsMode = 'total',
  systemForGame: (game: Game) => ScoringSystem | null = () => null
): SeasonStandingsEntry[] {
  const avgFinish = (e: SeasonStandingsEntry) => e.finishTotal / e.gamesPlayed;
  const compare = (a: SeasonStandingsEntry, b: SeasonStandingsEntry) =>
    standingsValue(b, mode) - standingsValue(a, mode) ||
    b.wins - a.wins || b.podiums - a.podiums || avgFinish(a) - avgFinish(b);

  const sorted = accumulateStandings(completedGames, leagueMembers, systemForGame).sort(compare);
  return sorted.map((entry, i) => ({
    ...entry,
    rank: i > 0 && compare(entry, sorted[i - 1]) === 0
      ? sorted.findIndex(e => compare(e, entry) === 0) + 1
      : i + 1,
  }));
}
