import { describe, expect, it } from 'vitest';
import { computeHeadToHead } from './headToHead';
import { Game, Player } from '../types/game';

function makePlayer(id: string, totalScore: number): Player {
  return { id, name: id, color: '#000', avatar: '', totalScore, roundScores: [] };
}

function makeGame(players: Player[], overrides: Partial<Game> = {}): Game {
  return {
    id: 'g',
    name: 'Rummy',
    players,
    rounds: [],
    currentRound: 1,
    maxRounds: 5,
    collectProposedScores: false,
    ranking: 'high-wins',
    gameType: 'standard',
    status: 'completed',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('computeHeadToHead', () => {
  it('tallies wins, losses, and ties between two specific players', () => {
    const games = [
      makeGame([makePlayer('a', 30), makePlayer('b', 10)]),
      makeGame([makePlayer('a', 5), makePlayer('b', 30)]),
      makeGame([makePlayer('a', 20), makePlayer('b', 20)]),
    ];
    const record = computeHeadToHead(games, 'a', 'b');
    expect(record).toEqual({ gamesPlayed: 3, wins: 1, losses: 1, ties: 1 });
  });

  it('ignores a third player in the same game', () => {
    const games = [makeGame([makePlayer('a', 30), makePlayer('b', 10), makePlayer('c', 50)])];
    // c scored highest, but head-to-head only compares a and b directly.
    expect(computeHeadToHead(games, 'a', 'b').wins).toBe(1);
  });

  it('skips games where one of the two players did not take part', () => {
    const games = [makeGame([makePlayer('a', 30), makePlayer('c', 10)])];
    expect(computeHeadToHead(games, 'a', 'b').gamesPlayed).toBe(0);
  });

  it('respects low-wins ranking', () => {
    const games = [makeGame([makePlayer('a', 5), makePlayer('b', 30)], { ranking: 'low-wins' })];
    expect(computeHeadToHead(games, 'a', 'b').wins).toBe(1);
  });
});
