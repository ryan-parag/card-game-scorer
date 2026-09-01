import { useEffect, useState } from 'react';
import { supabase, rowToGame } from '../lib/supabase';
import { Game } from '../types/game';

// All of a player's completed games — any league, season, or casual game —
// for computing career stats and head-to-head records against them.
export function usePlayerGames(userId: string | undefined): { games: Game[]; loading: boolean } {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setGames([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('games')
      .select('*')
      .eq('status', 'completed')
      .filter('players', 'cs', `[{"id":"${userId}"}]`)
      .order('updated_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        if (cancelled) return;
        setGames((data ?? []).map(rowToGame));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { games, loading };
}
