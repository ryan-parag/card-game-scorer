import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ScoringSystemRule {
  id: string;
  scoring_system_id: string;
  rank: number;
  points: number;
}

export interface ScoringSystem {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  rules: ScoringSystemRule[];
}

export const useScoringSystem = (currentUserId?: string) => {
  const [systems, setSystems] = useState<ScoringSystem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('scoring_systems')
      .select(`
        id, name, description, created_by, created_at,
        rules:scoring_system_rules(id, scoring_system_id, rank, points)
      `)
      .order('created_at', { ascending: false });

    setSystems(
      (data ?? []).map((s: any) => ({
        ...s,
        rules: (s.rules ?? []).sort((a: ScoringSystemRule, b: ScoringSystemRule) => a.rank - b.rank),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Create a new scoring system with its rules in one shot. */
  const createSystem = async (
    name: string,
    description: string | null,
    rules: { rank: number; points: number }[]
  ): Promise<string | null> => {
    if (!supabase || !currentUserId) return 'Not authenticated';

    const { data: system, error } = await supabase
      .from('scoring_systems')
      .insert({ name: name.trim(), description: description?.trim() || null, created_by: currentUserId })
      .select()
      .single();

    if (error || !system) return error?.message ?? 'Failed to create system';

    if (rules.length > 0) {
      const { error: rErr } = await supabase
        .from('scoring_system_rules')
        .insert(rules.map(r => ({ scoring_system_id: system.id, rank: r.rank, points: r.points })));
      if (rErr) return rErr.message;
    }

    await load();
    return null;
  };

  /** Update metadata and/or replace all rules for a system. */
  const updateSystem = async (
    id: string,
    updates: {
      name?: string;
      description?: string | null;
      rules?: { rank: number; points: number }[];
    }
  ): Promise<string | null> => {
    if (!supabase) return 'Not connected';

    if (updates.name !== undefined || updates.description !== undefined) {
      const patch: Record<string, unknown> = {};
      if (updates.name !== undefined) patch.name = updates.name.trim();
      if (updates.description !== undefined) patch.description = updates.description?.trim() || null;
      const { error } = await supabase.from('scoring_systems').update(patch).eq('id', id);
      if (error) return error.message;
    }

    if (updates.rules !== undefined) {
      // Replace: delete all existing then insert new ones
      const { error: delErr } = await supabase
        .from('scoring_system_rules')
        .delete()
        .eq('scoring_system_id', id);
      if (delErr) return delErr.message;

      if (updates.rules.length > 0) {
        const { error: insErr } = await supabase
          .from('scoring_system_rules')
          .insert(updates.rules.map(r => ({ scoring_system_id: id, rank: r.rank, points: r.points })));
        if (insErr) return insErr.message;
      }
    }

    await load();
    return null;
  };

  const deleteSystem = async (id: string): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('scoring_systems').delete().eq('id', id);
    if (error) return error.message;
    await load();
    return null;
  };

  return {
    systems,
    loading,
    reload: load,
    createSystem,
    updateSystem,
    deleteSystem,
    isOwner: (system: ScoringSystem) => !!currentUserId && system.created_by === currentUserId,
  };
};
