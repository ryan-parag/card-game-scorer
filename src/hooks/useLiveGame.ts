import { useCallback, useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Game } from '../types/game';
import { supabase, rowToGame, GameRow } from '../lib/supabase';

// Live games share one Realtime channel per game. It carries the game row's
// changes and a presence list, so the scorekeeper can see how many people are
// watching and viewers can tell when the scorekeeper has dropped off.

type LiveRole = 'scorekeeper' | 'viewer';

const liveChannelName = (gameId: string) => `live-game:${gameId}`;

const presenceKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const countRole = (channel: RealtimeChannel, role: LiveRole) =>
  Object.values(channel.presenceState<{ role: LiveRole }>())
    .filter(presences => presences.some(p => p.role === role))
    .length;

export const liveGameUrl = (gameId: string) => `${window.location.origin}/live/${gameId}`;

export type LiveGameStatus = 'loading' | 'not-found' | 'ready';

export interface LiveGameState {
  game: Game | null;
  status: LiveGameStatus;
  // This device's Realtime connection is up.
  isConnected: boolean;
  // The scorekeeper was connected earlier in this visit but isn't now — their
  // scores will arrive when they reconnect. Stays false for scorekeepers we've
  // never seen (e.g. scoring from an app that doesn't announce itself).
  scorekeeperAway: boolean;
}

// Read-only view of a game that updates as the scorekeeper enters scores.
export function useLiveGame(gameId: string | undefined): LiveGameState {
  const [game, setGame] = useState<Game | null>(null);
  const [status, setStatus] = useState<LiveGameStatus>('loading');
  const [isConnected, setIsConnected] = useState(false);
  const [scorekeeperSeen, setScorekeeperSeen] = useState(false);
  const [scorekeeperPresent, setScorekeeperPresent] = useState(false);

  const fetchGame = useCallback(async () => {
    if (!supabase || !gameId) return;
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();
    if (error) {
      // Keep showing what we have; the next reconnect or update will retry.
      console.warn('Failed to load live game:', error);
      setStatus(current => (current === 'loading' ? 'not-found' : current));
      return;
    }
    if (data) {
      setGame(rowToGame(data as GameRow));
      setStatus('ready');
    } else {
      setGame(null);
      setStatus('not-found');
    }
  }, [gameId]);

  useEffect(() => {
    if (!supabase || !gameId) {
      setStatus('not-found');
      return;
    }
    const client = supabase;

    setStatus('loading');
    setGame(null);
    setScorekeeperSeen(false);
    setScorekeeperPresent(false);
    fetchGame();

    const channel = client
      .channel(liveChannelName(gameId), { config: { presence: { key: presenceKey() } } })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            setGame(null);
            setStatus('not-found');
            return;
          }
          setGame(rowToGame(payload.new as GameRow));
          setStatus('ready');
        },
      )
      .on('presence', { event: 'sync' }, () => {
        const present = countRole(channel, 'scorekeeper') > 0;
        setScorekeeperPresent(present);
        if (present) setScorekeeperSeen(true);
      })
      .subscribe(subscribeStatus => {
        const connected = subscribeStatus === 'SUBSCRIBED';
        setIsConnected(connected);
        if (connected) {
          channel.track({ role: 'viewer' satisfies LiveRole });
          // Catch up on anything that changed while we were disconnected.
          fetchGame();
        }
      });

    // Phones suspend sockets in the background, so refresh when we come back.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchGame();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      client.removeChannel(channel);
    };
  }, [gameId, fetchGame]);

  return {
    game,
    status,
    isConnected,
    scorekeeperAway: scorekeeperSeen && !scorekeeperPresent,
  };
}

// Announces the scorekeeper on a game's live channel and reports how many
// people are watching. Pass undefined to stay off the channel.
export function useGameViewers(gameId: string | undefined): number {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!supabase || !gameId) {
      setViewerCount(0);
      return;
    }
    const client = supabase;

    const channel = client
      .channel(liveChannelName(gameId), { config: { presence: { key: presenceKey() } } })
      .on('presence', { event: 'sync' }, () => {
        setViewerCount(countRole(channel, 'viewer'));
      })
      .subscribe(subscribeStatus => {
        if (subscribeStatus === 'SUBSCRIBED') {
          channel.track({ role: 'scorekeeper' satisfies LiveRole });
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [gameId]);

  return viewerCount;
}
