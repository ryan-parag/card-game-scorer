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
  profile: Profile; // the other person
}

export const useFriends = (currentUserId: string | undefined) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !currentUserId) return;
    setLoading(true);
    setError('');

    try {
      // Fetch all friendships the current user is part of
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

      setFriends(accepted);
      setPendingReceived(received);
      setPendingSent(sent);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const sendRequest = async (email: string): Promise<string | null> => {
    if (!supabase || !currentUserId) return 'Not authenticated';

    const normalizedEmail = email.trim().toLowerCase();

    // Look up profile by email (case-insensitive)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, avatar_url, display_name, created_at')
      .ilike('email', normalizedEmail)
      .single();

    if (profileError || !profiles) {
      return 'No user found with that email address.';
    }
    if (profiles.id === currentUserId) return 'You can\'t add yourself.';

    const { error } = await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: profiles.id,
    });

    if (error) {
      if (error.code === '23505') return 'You\'ve already sent a request to this person.';
      return error.message;
    }

    await load();
    return null;
  };

  const acceptRequest = async (friendshipId: string) => {
    if (!supabase) return;
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    await load();
  };

  const declineRequest = async (friendshipId: string) => {
    if (!supabase) return;
    await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    await load();
  };

  const removeFriend = async (friendshipId: string) => {
    if (!supabase) return;
    await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    await load();
  };

  return {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    error,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    reload: load,
  };
};
