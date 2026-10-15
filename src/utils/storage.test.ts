import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Game } from '../types/game';

const remote = new Map<string, Record<string, unknown>>();
let networkUp = true;

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  const from = (table: string) => ({
    upsert: async (row: Record<string, unknown>) => {
      if (!networkUp) return { error: { message: 'Failed to fetch' } };
      if (table === 'games') remote.set(row.id as string, row);
      return { error: null };
    },
    select: () => ({
      eq: (_col: string, id: string) => ({
        single: async () => {
          if (!networkUp) return { data: null, error: { message: 'Failed to fetch' } };
          const row = remote.get(id);
          return row ? { data: row, error: null } : { data: null, error: { code: 'PGRST116' } };
        },
      }),
    }),
  });
  return { ...actual, supabase: { from } };
});

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
});

const { saveGame, getGame, hasPendingGame, syncPendingChanges, deleteGame } = await import('./storage');

const makeGame = (scores: number[]): Game => ({
  id: 'g1',
  name: 'Test',
  players: [{ id: 'p1', name: 'A', color: '', avatar: '', roundScores: scores, totalScore: scores.reduce((a, b) => a + b, 0) }],
  rounds: [],
  currentRound: scores.length + 1,
  maxRounds: 10,
  collectProposedScores: false,
  ranking: 'high-wins',
  gameType: 'standard',
  status: 'in-progress',
  createdAt: '2026-10-15T00:00:00.000Z',
  updatedAt: '2026-10-15T00:00:00.000Z',
});

describe('offline game sync', () => {
  beforeEach(() => {
    remote.clear();
    store.clear();
    networkUp = true;
  });

  it('keeps failed saves on the device and uploads them on retry', async () => {
    await saveGame(makeGame([5]));
    networkUp = false;
    await saveGame(makeGame([5, 7]));

    expect(hasPendingGame('g1')).toBe(true);
    expect((remote.get('g1')?.players as Game['players'])[0].roundScores).toEqual([5]);

    networkUp = true;
    await syncPendingChanges();

    expect(hasPendingGame('g1')).toBe(false);
    expect((remote.get('g1')?.players as Game['players'])[0].roundScores).toEqual([5, 7]);
  });

  it('loads the unsynced copy instead of the older server copy', async () => {
    await saveGame(makeGame([5]));
    networkUp = false;
    await saveGame(makeGame([5, 7, 9]));
    networkUp = true;

    const loaded = await getGame('g1');
    expect(loaded?.players[0].roundScores).toEqual([5, 7, 9]);
  });

  it('a successful save after a failed one clears the pending copy', async () => {
    networkUp = false;
    await saveGame(makeGame([1]));
    networkUp = true;
    await saveGame(makeGame([1, 2]));

    expect(hasPendingGame('g1')).toBe(false);
    expect((remote.get('g1')?.players as Game['players'])[0].roundScores).toEqual([1, 2]);
  });

  it('does not resurrect a deleted game', async () => {
    networkUp = false;
    await saveGame(makeGame([1]));
    await deleteGame('g1');
    expect(hasPendingGame('g1')).toBe(false);
  });
});
