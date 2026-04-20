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
  scoring_system_id: string | null;
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

/** A league the current user has not yet joined — used for discovery. */
export interface DiscoverableLeague {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count: number;
  seasons: LeagueSeason[];
}

/** Sentinel value for seasons with no fixed end date. */
export const INDEFINITE_END_DATE = '9999-12-31';

/** Returns a formatted end-date string, or "No end date" for the sentinel. */
export function formatSeasonEndDate(endDate: string): string {
  return endDate === INDEFINITE_END_DATE ? 'No end date' : endDate;
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
  const [discoverableLeagues, setDiscoverableLeagues] = useState<DiscoverableLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !currentUserId) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('league_members')
        .select(`
          league:leagues(
            id, name, description, created_by, created_at,
            members:league_members(
              id, league_id, user_id, role, joined_at,
              profile:profiles(id, email, avatar_url, display_name)
            ),
            seasons:league_seasons(
              id, league_id, name, start_date, end_date, status, scoring_system_id, created_at
            )
          )
        `)
        .eq('user_id', currentUserId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const mapped: League[] = (data ?? [])
        .map((row: any) => row.league)
        .filter(Boolean)
        .map((league: any) => ({
          ...league,
          members: (league.members ?? []).map((m: any) => ({
            ...m,
            profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
          })),
          seasons: (league.seasons ?? []).sort(
            (a: LeagueSeason, b: LeagueSeason) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        }));

      setLeagues(mapped);
      return mapped.map(l => l.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load leagues');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const loadDiscover = useCallback(async (myLeagueIds?: string[]) => {
    if (!supabase || !currentUserId) return;
    setDiscoverLoading(true);
    try {
      // Fetch all leagues, then exclude those the user already belongs to.
      const { data, error } = await supabase
        .from('leagues')
        .select(`
          id, name, description, created_at,
          member_count:league_members(count),
          seasons:league_seasons(
            id, league_id, name, start_date, end_date, status, scoring_system_id, created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: DiscoverableLeague[] = (data ?? [])
        .filter((row: any) => !(myLeagueIds ?? []).includes(row.id))
        .map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        member_count: Array.isArray(row.member_count)
          ? (row.member_count[0]?.count ?? 0)
          : (row.member_count ?? 0),
        seasons: ((row.seasons ?? []) as LeagueSeason[]).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));

      setDiscoverableLeagues(mapped);
    } catch {
      // Silently ignore — discovery is best-effort depending on RLS policies
    } finally {
      setDiscoverLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    load().then(ids => loadDiscover(ids));
  }, [load, loadDiscover]);

  const createLeague = async (name: string, description?: string): Promise<string | null> => {
    if (!supabase || !currentUserId) return 'Not authenticated';
    const { error } = await supabase.from('leagues').insert({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: currentUserId,
    });
    if (error) return error.message;
    const ids = await load();
    await loadDiscover(ids);
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

  const joinLeague = async (leagueId: string): Promise<string | null> => {
    if (!supabase || !currentUserId) return 'Not authenticated';
    const { error } = await supabase
      .from('league_members')
      .insert({ league_id: leagueId, user_id: currentUserId, role: 'member' });
    if (error) {
      if (error.code === '23505') return 'You are already a member of this league.';
      return error.message;
    }
    const ids = await load();
    await loadDiscover(ids);
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
    endDate: string,
    scoringSystemId?: string | null
  ): Promise<string | null> => {
    if (!supabase) return 'Not connected';
    const { error } = await supabase.from('league_seasons').insert({
      league_id: leagueId,
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      status: computeSeasonStatus(startDate, endDate),
      scoring_system_id: scoringSystemId ?? null,
    });
    if (error) return error.message;
    await load();
    return null;
  };

  const updateSeason = async (
    seasonId: string,
    updates: Partial<Pick<LeagueSeason, 'name' | 'start_date' | 'end_date' | 'status' | 'scoring_system_id'>>
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
    discoverableLeagues,
    loading,
    discoverLoading,
    error,
    reload: load,
    createLeague,
    joinLeague,
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
