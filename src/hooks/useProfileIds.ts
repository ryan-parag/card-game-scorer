import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProfileIds(ids: string[]): Set<string> {
  const [profileIds, setProfileIds] = useState<Set<string>>(new Set());

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
