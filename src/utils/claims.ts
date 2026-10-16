import { Game } from '../types/game';
import { supabase, rowToGame, GameRow } from '../lib/supabase';
import { isUuid } from './gameId';

// ── Pending claims ───────────────────────────────────────────────────────────
// Someone who taps "That's me" while signed out is sent to sign up first. The
// claim waits on this device until they're signed in, which can happen on
// another page entirely (OAuth and email confirmation both land on /).

export interface PendingClaim {
  gameId: string;
  playerId: string;
}

const PENDING_CLAIM_KEY = 'scorekeeper-pending-claim';
// Long enough to find an email confirmation link, short enough that a stale
// claim doesn't hijack the home page days later.
const PENDING_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;

export const savePendingClaim = (claim: PendingClaim) => {
  try {
    localStorage.setItem(PENDING_CLAIM_KEY, JSON.stringify({ ...claim, savedAt: Date.now() }));
  } catch {
    // Storage unavailable; they'll just need to tap "That's me" again.
  }
};

export const readPendingClaim = (): PendingClaim | null => {
  try {
    const stored = localStorage.getItem(PENDING_CLAIM_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (!parsed || typeof parsed.gameId !== 'string' || typeof parsed.playerId !== 'string') return null;
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > PENDING_CLAIM_TTL_MS) return null;
    return { gameId: parsed.gameId, playerId: parsed.playerId };
  } catch {
    return null;
  }
};

export const clearPendingClaim = () => {
  try {
    localStorage.removeItem(PENDING_CLAIM_KEY);
  } catch {
    // Nothing to clear.
  }
};

// Only same-site paths, so ?next= can't send someone to another domain.
export const safeNextPath = (next: string | null | undefined): string | null =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : null;

// ── Claiming ─────────────────────────────────────────────────────────────────

export const claimGamePlayer = async (gameId: string, playerId: string): Promise<void> => {
  if (!supabase) throw new Error('Claiming needs an online account.');
  const { error } = await supabase.rpc('claim_game_player', { p_game_id: gameId, p_player_id: playerId });
  if (error) throw new Error(error.message);
};

export interface ClaimMatch {
  game: Game;
  playerId: string;
}

const normalizeName = (name: string) => name.trim().toLowerCase();

// Other finished games where someone with the same name played alongside at
// least one of the same people — likely the same person, but the user picks.
export const findMatchingGames = async (
  claimedGame: Game,
  playerName: string,
  userId: string,
): Promise<ClaimMatch[]> => {
  if (!supabase || !playerName.trim()) return [];

  const name = normalizeName(playerName);
  const coPlayerNames = new Set(
    claimedGame.players.map(p => normalizeName(p.name)).filter(n => n && n !== name),
  );
  if (coPlayerNames.size === 0) return [];

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'completed')
    .neq('id', claimedGame.id)
    .filter('players', 'cs', JSON.stringify([{ name: playerName }]))
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error || !data) return [];

  const candidates = (data as GameRow[])
    .map(rowToGame)
    .filter(game => !game.players.some(p => p.id === userId))
    .filter(game => game.players.some(p => normalizeName(p.name) !== name && coPlayerNames.has(normalizeName(p.name))))
    .map(game => ({ game, player: game.players.find(p => normalizeName(p.name) === name) }))
    .filter((c): c is { game: Game; player: Game['players'][number] } => !!c.player);
  if (candidates.length === 0) return [];

  // Skip players who already belong to someone's account.
  const possibleAccountIds = [...new Set(candidates.map(c => c.player.id))].filter(isUuid);
  const linked = new Set<string>();
  if (possibleAccountIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id').in('id', possibleAccountIds);
    (profiles ?? []).forEach((p: { id: string }) => linked.add(p.id));
  }

  return candidates
    .filter(c => !linked.has(c.player.id))
    .map(c => ({ game: c.game, playerId: c.player.id }));
};
