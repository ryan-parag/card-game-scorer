import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  avatar_url: string | null;
  display_name: string | null;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profile: Profile;
}

// How the current user relates to another profile.
// incoming = they sent us a request, outgoing = we sent them one.
export type Relationship =
  | { kind: 'none' }
  | { kind: 'friend' | 'incoming' | 'outgoing'; friendship: Friendship };

export const profileName = (p: Pick<Profile, 'display_name' | 'email'>) =>
  p.display_name || p.email.split('@')[0];

const byName = (a: Friendship, b: Friendship) =>
  profileName(a.profile).localeCompare(profileName(b.profile), undefined, { sensitivity: 'base' });

const byNewest = (a: Friendship, b: Friendship) => b.created_at.localeCompare(a.created_at);

export const useFriends = (currentUserId: string | undefined) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!supabase || !currentUserId) return;
    if (!opts.silent) setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          requester:profiles!friendships_requester_id_fkey(id, email, avatar_url, display_name),
          addressee:profiles!friendships_addressee_id_fkey(id, email, avatar_url, display_name)
        `)
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

      if (error) throw error;

      const accepted: Friendship[] = [];
      const received: Friendship[] = [];
      const sent: Friendship[] = [];

      for (const row of data ?? []) {
        const isSender = row.requester_id === currentUserId;
        const otherProfile = isSender
          ? (Array.isArray(row.addressee) ? row.addressee[0] : row.addressee)
          : (Array.isArray(row.requester) ? row.requester[0] : row.requester);
        if (!otherProfile) continue;

        const friendship: Friendship = {
          id: row.id,
          requester_id: row.requester_id,
          addressee_id: row.addressee_id,
          status: row.status,
          created_at: row.created_at,
          profile: otherProfile,
        };

        if (row.status === 'accepted') {
          accepted.push(friendship);
        } else if (row.status === 'pending') {
          if (isSender) sent.push(friendship);
          else received.push(friendship);
        }
      }

      setFriends(accepted.sort(byName));
      setPendingReceived(received.sort(byNewest));
      setPendingSent(sent.sort(byNewest));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const relationshipWith = useCallback((profileId: string): Relationship => {
    const friend = friends.find(f => f.profile.id === profileId);
    if (friend) return { kind: 'friend', friendship: friend };
    const incoming = pendingReceived.find(f => f.profile.id === profileId);
    if (incoming) return { kind: 'incoming', friendship: incoming };
    const outgoing = pendingSent.find(f => f.profile.id === profileId);
    if (outgoing) return { kind: 'outgoing', friendship: outgoing };
    return { kind: 'none' };
  }, [friends, pendingReceived, pendingSent]);

  const acceptRequest = async (friendshipId: string): Promise<string | null> => {
    if (!supabase) return 'Not authenticated';
    const request = pendingReceived.find(f => f.id === friendshipId);
    if (request) {
      setPendingReceived(prev => prev.filter(f => f.id !== friendshipId));
      setFriends(prev => [...prev, { ...request, status: 'accepted' as const }].sort(byName));
    }
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    if (error) {
      await load({ silent: true });
      return error.message;
    }
    return null;
  };

  // Deletes the row and drops it from every list optimistically. Used for
  // declining, cancelling a sent request, and removing a friend.
  const deleteFriendship = async (friendshipId: string): Promise<string | null> => {
    if (!supabase) return 'Not authenticated';
    const drop = (prev: Friendship[]) => prev.filter(f => f.id !== friendshipId);
    setFriends(drop);
    setPendingReceived(drop);
    setPendingSent(drop);
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) {
      await load({ silent: true });
      return error.message;
    }
    return null;
  };

  const sendRequest = async (email: string): Promise<string | null> => {
    if (!supabase || !currentUserId) return 'Not authenticated';

    const normalizedEmail = email.trim().toLowerCase();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, avatar_url, display_name')
      .ilike('email', normalizedEmail)
      .single();

    if (profileError || !profile) {
      return 'No user found with that email address.';
    }
    if (profile.id === currentUserId) return 'You can\'t add yourself.';

    const rel = relationshipWith(profile.id);
    if (rel.kind === 'friend') return `You're already friends with ${profileName(profile)}.`;
    if (rel.kind === 'outgoing') return `You've already sent ${profileName(profile)} a request.`;
    // They already asked us — accept instead of creating a second, reverse request.
    if (rel.kind === 'incoming') return acceptRequest(rel.friendship.id);

    const { error } = await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: profile.id,
    });

    if (error) {
      if (error.code === '23505') return 'You\'ve already sent a request to this person.';
      return error.message;
    }

    await load({ silent: true });
    return null;
  };

  return {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    error,
    relationshipWith,
    sendRequest,
    acceptRequest,
    declineRequest: deleteFriendship,
    cancelRequest: deleteFriendship,
    removeFriend: deleteFriendship,
    reload: load,
  };
};

export type FriendsState = ReturnType<typeof useFriends>;

// Lightweight count of incoming requests, for nav badges.
export const usePendingFriendRequestCount = (currentUserId: string | undefined) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!supabase || !currentUserId) return;
    let cancelled = false;
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('addressee_id', currentUserId)
      .eq('status', 'pending')
      .then(({ count }) => { if (!cancelled) setCount(count ?? 0); });
    return () => { cancelled = true; };
  }, [currentUserId]);

  return count;
};
