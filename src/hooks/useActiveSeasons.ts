import { useLeagues, League, LeagueSeason, computeSeasonStatus } from './useLeagues';

export interface ActiveSeasonEntry {
  season: LeagueSeason;
  league: League;
}

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
