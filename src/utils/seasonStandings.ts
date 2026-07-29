import { Game } from '../types/game';
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

// Ranks players across a set of completed games the same way the season standings page does:
// champion points (from the scoring system, if any) plus raw total score.
export function computeSeasonStandings(
  completedGames: Game[],
  leagueMembers: LeagueMember[],
  activeSystem: ScoringSystem | null
): SeasonStandingsEntry[] {
  const memberMap = Object.fromEntries(
    leagueMembers.map(m => [m.user_id, m.profile.display_name ?? m.profile.email.split('@')[0]])
  );

  const scoreMap: Record<string, Omit<SeasonStandingsEntry, 'key' | 'userId' | 'totalScore' | 'rank'>> = {};

  for (const game of completedGames) {
    const rankedPlayers = [...game.players].sort((a, b) =>
      game.ranking === 'low-wins'
        ? (a.totalScore ?? 0) - (b.totalScore ?? 0)
        : (b.totalScore ?? 0) - (a.totalScore ?? 0)
    );

    // Dense rank within the game so tied scores share a placement (1, 1, 3),
    // and podiums/wins are credited to every player tied for that placement.
    const gameRanks = rankedPlayers.map((player, i) => {
      const rank = i > 0 && player.totalScore === rankedPlayers[i - 1].totalScore
        ? rankedPlayers.findIndex(p => p.totalScore === player.totalScore) + 1
        : i + 1;
      return { player, rank };
    });

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
        };
      }

      scoreMap[key].champPts += activeSystem ? pointsForRank(activeSystem.rules, rank) : 0;
      scoreMap[key].rawPts += player.totalScore ?? 0;
      scoreMap[key].gamesPlayed += 1;
      if (podiumKeys.has(key)) scoreMap[key].podiums += 1;
      if (rank === 1) scoreMap[key].wins += 1;
    });
  }

  const totalScoreFor = (entry: Omit<SeasonStandingsEntry, 'key' | 'userId' | 'totalScore' | 'rank'>) =>
    activeSystem ? entry.champPts + entry.rawPts : entry.rawPts;

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
