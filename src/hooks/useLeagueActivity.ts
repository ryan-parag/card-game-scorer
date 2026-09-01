import { useEffect, useState } from 'react';
import { supabase, rowToGame } from '../lib/supabase';

// Round-by-round score history for each league member, pooled across that
// league's other completed games of the same game type (so scoring scales
// line up — Rummy totals aren't comparable to Hearts totals).
export function useLeagueActivity(
  leagueId: string | null | undefined,
  gameName: string,
  excludeGameId: string
): Record<string, number[]> {
  const [history, setHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (!supabase || !leagueId) {
      setHistory({});
      return;
    }

    let cancelled = false;

    (async () => {
      const { data } = await supabase!
        .from('games')
        .select('*')
        .eq('league_id', leagueId)
        .eq('status', 'completed')
        .eq('name', gameName)
        .neq('id', excludeGameId)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      const byPlayer: Record<string, number[]> = {};
      (data ?? []).map(rowToGame).forEach((g) => {
        g.players.forEach((p) => {
          if (p.roundScores.length === 0) return;
          (byPlayer[p.id] ??= []).push(...p.roundScores);
        });
      });
      setHistory(byPlayer);
    })();

    return () => {
      cancelled = true;
    };
  }, [leagueId, gameName, excludeGameId]);

  return history;
}
