import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isUuid } from '../utils/gameId';

// Which of these player ids belong to an account, and whether that lookup has
// finished (so callers can tell "not linked" apart from "not loaded yet").
export function useProfileLookup(ids: string[]): { profileIds: Set<string>; loaded: boolean } {
  const [profileIds, setProfileIds] = useState<Set<string>>(new Set());
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Only account-shaped ids can match; a typed-in player's id would make
  // Postgres reject the whole lookup.
  const key = [...new Set(ids.filter(isUuid))].sort().join(',');

  useEffect(() => {
    if (!supabase || !key) {
      setProfileIds(new Set());
      setLoadedKey(key);
      return;
    }
    const uniqueIds = key.split(',').filter(Boolean);

    let cancelled = false;
    supabase
      .from('profiles')
      .select('id')
      .in('id', uniqueIds)
      .then(({ data }) => {
        if (cancelled) return;
        setProfileIds(new Set((data ?? []).map((p: { id: string }) => p.id)));
        setLoadedKey(key);
      });
    return () => { cancelled = true; };
  }, [key]);

  return { profileIds, loaded: loadedKey === key };
}

export function useProfileIds(ids: string[]): Set<string> {
  return useProfileLookup(ids).profileIds;
}
