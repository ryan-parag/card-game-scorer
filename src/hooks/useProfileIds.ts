import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Given a list of IDs, returns the subset that correspond to real auth profiles.
 * Use this to conditionally link player names to public profile pages.
 */
export function useProfileIds(ids: string[]): Set<string> {
  const [profileIds, setProfileIds] = useState<Set<string>>(new Set());

  // Stable key so the effect only re-runs when the actual IDs change
  const key = [...new Set(ids)].sort().join(',');

  useEffect(() => {
    if (!supabase || !key) return;
    const uniqueIds = key.split(',').filter(Boolean);
    if (uniqueIds.length === 0) return;

    supabase
      .from('profiles')
      .select('id')
      .in('id', uniqueIds)
      .then(({ data }) => {
        setProfileIds(new Set((data ?? []).map((p: { id: string }) => p.id)));
      });
  }, [key]);

  return profileIds;
}
