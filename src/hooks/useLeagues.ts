import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from './useFriends';

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile: Profile;
}

export interface LeagueSeason {
  id: string;
  league_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  members: LeagueMember[];
  seasons: LeagueSeason[];
}

/** Derive status from dates rather than the stored value. */
export function computeSeasonStatus(startDate: string, endDate: string): 'upcoming' | 'active' | 'completed' {
  const now = new Date();
  if (now < new Date(startDate)) return 'upcoming';
  if (now > new Date(endDate)) return 'completed';
  return 'active';
}

export const useLeagues = (currentUserId: string | undefined) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !currentUserId) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select(`
          id, name, description, created_by, created_at,
          members:league_members(
            id, league_id, user_id, role, joined_at,
            profile:profiles(id, email, avatar_url, display_name)
          ),
          seasons:league_seasons(
            id, league_id, name, start_date, end_date, status, created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: League[] = (data ?? []).map((row: any) => ({
        ...row,
        members: (row.members ?? []).map((m: any) => ({
          ...m,
          profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
        })),
        seasons: (row.seasons ?? []).sort(
          (a: LeagueSeason, b: LeagueSeason) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));

      setLeagues(mapped);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const createLeague = async (name: string, description?: string): Promise<string | null> => {
    if (!supabase || !currentUserId) return 'Not authenticated';
    const { error } = await supabase.from('leagues').insert({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: currentUserId,
    });
    if (error) return error.message;
    await load();
    return null;
  };

  const updateLeague = async (
    leagueId: string,
    updates: { name?: string; description?: string | null }
  ): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('leagues').update(updates).eq('id', leagueId);
    if (error) return error.message;
    await load();
    return null;
  };

  const deleteLeague = async (leagueId: string): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('leagues').delete().eq('id', leagueId);
    if (error) return error.message;
    await load();
    return null;
  };

  const addMember = async (leagueId: string, userId: string): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase
      .from('league_members')
      .insert({ league_id: leagueId, user_id: userId });
    if (error) {
      if (error.code === '23505') return 'This person is already a member.';
      return error.message;
    }
    await load();
    return null;
  };

  const removeMember = async (membershipId: string): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('league_members').delete().eq('id', membershipId);
    if (error) return error.message;
    await load();
    return null;
  };

  const updateMemberRole = async (
    membershipId: string,
    role: 'admin' | 'member'
  ): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('league_members').update({ role }).eq('id', membershipId);
    if (error) return error.message;
    await load();
    return null;
  };

  const createSeason = async (
    leagueId: string,
    name: string,
    startDate: string,
    endDate: string
  ): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('league_seasons').insert({
      league_id: leagueId,
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      status: computeSeasonStatus(startDate, endDate),
    });
    if (error) return error.message;
    await load();
    return null;
  };

  const updateSeason = async (
    seasonId: string,
    updates: Partial<Pick<LeagueSeason, 'name' | 'start_date' | 'end_date' | 'status'>>
  ): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('league_seasons').update(updates).eq('id', seasonId);
    if (error) return error.message;
    await load();
    return null;
  };

  const deleteSeason = async (seasonId: string): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('league_seasons').delete().eq('id', seasonId);
    if (error) return error.message;
    await load();
    return null;
  };

  return {
    leagues,
    loading,
    error,
    reload: load,
    createLeague,
    updateLeague,
    deleteLeague,
    addMember,
    removeMember,
    updateMemberRole,
    createSeason,
    updateSeason,
    deleteSeason,
  };
};
