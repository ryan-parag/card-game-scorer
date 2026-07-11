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

    const podiumKeys = new Set(
      rankedPlayers.slice(0, 3).map(p => standingsKeyForPlayer(p.id, p.name, leagueMembers))
    );

    rankedPlayers.forEach((player, posIndex) => {
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

      scoreMap[key].champPts += activeSystem ? pointsForRank(activeSystem.rules, posIndex + 1) : 0;
      scoreMap[key].rawPts += player.totalScore ?? 0;
      scoreMap[key].gamesPlayed += 1;
      if (podiumKeys.has(key)) scoreMap[key].podiums += 1;
      if (posIndex === 0) scoreMap[key].wins += 1;
    });
  }

  return Object.entries(scoreMap)
    .sort(([, a], [, b]) => {
      const aScore = activeSystem ? a.champPts + a.rawPts : a.rawPts;
      const bScore = activeSystem ? b.champPts + b.rawPts : b.rawPts;
      return bScore - aScore;
    })
    .map(([key, entry], i) => ({
      ...entry,
      key,
      totalScore: entry.champPts + entry.rawPts,
      userId: leagueMembers.some(m => m.user_id === key) ? key : '',
      rank: i + 1,
    }));
}
