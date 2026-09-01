import { describe, expect, it } from 'vitest';
import { computeWinProbabilities } from './winProbability';
import { Game, Player } from '../types/game';

function makePlayer(id: string, name: string, roundScores: number[] = []): Player {
  return {
    id,
    name,
    color: '#000',
    avatar: '',
    totalScore: roundScores.reduce((a, b) => a + b, 0),
    roundScores,
  };
}

function makeGame(players: Player[], overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    name: 'Rummy',
    players,
    rounds: [],
    currentRound: 1,
    maxRounds: 10,
    collectProposedScores: false,
    ranking: 'high-wins',
    gameType: 'standard',
    status: 'in-progress',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function probFor(results: ReturnType<typeof computeWinProbabilities>, playerId: string): number {
  return results.find((r) => r.playerId === playerId)?.probability ?? 0;
}

describe('computeWinProbabilities', () => {
  it('gives even odds before Round 1 with no league history', () => {
    const game = makeGame([makePlayer('a', 'A'), makePlayer('b', 'B')]);
    const results = computeWinProbabilities(game);
    expect(probFor(results, 'a')).toBeCloseTo(0.5, 1);
    expect(probFor(results, 'b')).toBeCloseTo(0.5, 1);
  });

  it('favors the player with a stronger league scoring history before Round 1', () => {
    const game = makeGame([makePlayer('a', 'A'), makePlayer('b', 'B')]);
    const leagueHistory = {
      a: [40, 42, 38, 45],
      b: [10, 12, 8, 9],
    };
    const results = computeWinProbabilities(game, leagueHistory);
    expect(probFor(results, 'a')).toBeGreaterThan(probFor(results, 'b'));
    expect(probFor(results, 'a')).toBeGreaterThan(0.7);
  });

  it('lets real in-game performance override a weaker league history as rounds accumulate', () => {
    const game = makeGame([
      makePlayer('a', 'A', [5, 4, 6, 5, 5, 4, 5]),
      makePlayer('b', 'B', [40, 42, 38, 45, 41, 39, 44]),
    ]);
    const leagueHistory = {
      a: [40, 42, 38, 45],
      b: [10, 12, 8, 9],
    };
    const results = computeWinProbabilities(game, leagueHistory);
    // B is dominating in this actual game despite a weaker league history;
    // 7 real rounds should heavily outweigh the 3-round-equivalent prior.
    expect(probFor(results, 'b')).toBeGreaterThan(probFor(results, 'a'));
  });

  it('ignores league history for players with no entry in it', () => {
    const game = makeGame([makePlayer('a', 'A'), makePlayer('b', 'B')]);
    const leagueHistory = { a: [40, 42, 38, 45] };
    const results = computeWinProbabilities(game, leagueHistory);
    expect(probFor(results, 'a')).toBeGreaterThan(probFor(results, 'b'));
  });
});
