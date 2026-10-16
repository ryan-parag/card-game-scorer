import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Game, Player } from '../types/game';

let remoteGames: Record<string, unknown>[] = [];
let linkedProfileIds: string[] = [];

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  const gamesQuery = {
    select: () => gamesQuery,
    eq: () => gamesQuery,
    neq: () => gamesQuery,
    filter: () => gamesQuery,
    order: () => gamesQuery,
    limit: async () => ({ data: remoteGames, error: null }),
  };
  const profilesQuery = {
    select: () => profilesQuery,
    in: async (_col: string, ids: string[]) => ({
      data: ids.filter(id => linkedProfileIds.includes(id)).map(id => ({ id })),
      error: null,
    }),
  };
  return {
    ...actual,
    supabase: { from: (table: string) => (table === 'profiles' ? profilesQuery : gamesQuery) },
  };
});

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
});

const { safeNextPath, savePendingClaim, readPendingClaim, clearPendingClaim, findMatchingGames } = await import('./claims');
const { gameToRow } = await import('../lib/supabase');

const USER = '11111111-1111-1111-1111-111111111111';
const OTHER_ACCOUNT = '22222222-2222-2222-2222-222222222222';

const player = (id: string, name: string, totalScore = 0): Player => ({
  id, name, color: '#000', avatar: '', totalScore, roundScores: [totalScore],
});

const game = (id: string, players: Player[]): Game => ({
  id, name: 'Rummy', players, rounds: [], currentRound: 1, maxRounds: 1,
  collectProposedScores: false, ranking: 'high-wins', gameType: 'standard',
  status: 'completed', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
});

describe('safeNextPath', () => {
  it('allows same-site paths', () => {
    expect(safeNextPath('/game/abc')).toBe('/game/abc');
  });

  it('rejects other sites and missing values', () => {
    expect(safeNextPath('https://evil.example')).toBeNull();
    expect(safeNextPath('//evil.example')).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });
});

describe('pending claims', () => {
  beforeEach(() => store.clear());

  it('round-trips and clears', () => {
    savePendingClaim({ gameId: 'g1', playerId: 'p1' });
    expect(readPendingClaim()).toEqual({ gameId: 'g1', playerId: 'p1' });
    clearPendingClaim();
    expect(readPendingClaim()).toBeNull();
  });

  it('expires after a day', () => {
    vi.useFakeTimers();
    savePendingClaim({ gameId: 'g1', playerId: 'p1' });
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);
    expect(readPendingClaim()).toBeNull();
    vi.useRealTimers();
  });
});

describe('findMatchingGames', () => {
  const claimed = game('claimed', [player('p1', 'Amanda'), player('p2', 'Ryan'), player('p3', 'Sam')]);

  beforeEach(() => {
    linkedProfileIds = [OTHER_ACCOUNT];
  });

  it('suggests games where the same name played with some of the same people', async () => {
    remoteGames = [
      gameToRow(game('match', [player('x1', 'amanda ', 12), player('x2', 'Ryan')])),
      gameToRow(game('strangers', [player('y1', 'Amanda'), player('y2', 'Jordan')])),
      gameToRow(game('already-in', [player('z1', 'Amanda'), player(USER, 'Me'), player('z2', 'Sam')])),
      gameToRow(game('linked', [player(OTHER_ACCOUNT, 'Amanda'), player('w2', 'Ryan')])),
    ] as unknown as Record<string, unknown>[];

    const matches = await findMatchingGames(claimed, 'Amanda', USER);

    expect(matches.map(m => [m.game.id, m.playerId])).toEqual([['match', 'x1']]);
  });

  it('finds nothing when the claimed game had no one else', async () => {
    remoteGames = [gameToRow(game('match', [player('x1', 'Amanda'), player('x2', 'Ryan')]))] as unknown as Record<string, unknown>[];
    const solo = game('solo', [player('p1', 'Amanda')]);
    expect(await findMatchingGames(solo, 'Amanda', USER)).toEqual([]);
  });
});
