import { useLeagues, League, LeagueSeason, computeSeasonStatus } from './useLeagues';

export interface ActiveSeasonEntry {
  season: LeagueSeason;
  league: League;
}

/**
 * Returns seasons where:
 *  - the current user is a member of the league
 *  - the season is currently active (derived from dates)
 */
export function useActiveSeasons(currentUserId?: string) {
  const { leagues, loading } = useLeagues(currentUserId);

  const activeSeasons: ActiveSeasonEntry[] = [];

  if (!loading && currentUserId) {
    for (const league of leagues) {
      if (!league.members.some(m => m.user_id === currentUserId)) continue;
      for (const season of league.seasons) {
        if (computeSeasonStatus(season.start_date, season.end_date) === 'active') {
          activeSeasons.push({ season, league });
        }
      }
    }
  }

  return { activeSeasons, loading };
}
