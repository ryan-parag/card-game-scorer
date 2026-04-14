import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLeagues, League, LeagueSeason, computeSeasonStatus } from './useLeagues';

export interface ActiveSeasonEntry {
  season: LeagueSeason;
  league: League;
  lastGameAt: string;
}

/**
 * Returns seasons where:
 *  - the current user is a member of the league
 *  - the season is currently active (derived from dates, not the stored status field)
 *  - at least one completed game was played in the last 7 days
 */
export function useActiveSeasons(currentUserId?: string) {
  const { leagues, loading: leaguesLoading } = useLeagues(currentUserId);
  const [activeSeasons, setActiveSeasons] = useState<ActiveSeasonEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || !supabase) return;

    if (leaguesLoading) {
      setLoading(true);
      return;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const candidates: { season: LeagueSeason; league: League }[] = [];
    for (const league of leagues) {
      if (!league.members.some(m => m.user_id === currentUserId)) continue;
      for (const season of league.seasons) {
        if (computeSeasonStatus(season.start_date, season.end_date) === 'active') {
          candidates.push({ season, league });
        }
      }
    }

    if (candidates.length === 0) {
      setActiveSeasons([]);
      setLoading(false);
      return;
    }

    supabase
      .from('games')
      .select('season_id, updated_at')
      .in('season_id', candidates.map(c => c.season.id))
      .eq('status', 'completed')
      .gte('updated_at', sevenDaysAgo.toISOString())
      .then(({ data }) => {
        const recentMap = new Map<string, string>();
        for (const row of data ?? []) {
          const existing = recentMap.get(row.season_id);
          if (!existing || row.updated_at > existing) {
            recentMap.set(row.season_id, row.updated_at);
          }
        }

        setActiveSeasons(
          candidates
            .filter(c => recentMap.has(c.season.id))
            .map(c => ({ ...c, lastGameAt: recentMap.get(c.season.id)! })),
        );
        setLoading(false);
      });
  }, [leagues, leaguesLoading, currentUserId]);

  return { activeSeasons, loading };
}
