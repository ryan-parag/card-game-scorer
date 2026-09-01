import { describe, expect, it } from 'vitest';
import { computeCareerStats } from './playerCareerStats';
import { Game, Player } from '../types/game';

function makePlayer(id: string, totalScore: number): Player {
  return { id, name: id, color: '#000', avatar: '', totalScore, roundScores: [] };
}

function makeGame(id: string, updatedAt: string, players: Player[], overrides: Partial<Game> = {}): Game {
  return {
    id,
    name: 'Rummy',
    players,
    rounds: [],
    currentRound: 1,
    maxRounds: 5,
    collectProposedScores: false,
    ranking: 'high-wins',
    gameType: 'standard',
    status: 'completed',
    createdAt: updatedAt,
    updatedAt,
    ...overrides,
  };
}

describe('computeCareerStats', () => {
  it('counts wins, podiums, and games played', () => {
    const games = [
      makeGame('1', '2026-01-01', [makePlayer('me', 30), makePlayer('them', 10)]),
      makeGame('2', '2026-01-02', [makePlayer('me', 5), makePlayer('them', 30)]),
      makeGame('3', '2026-01-03', [makePlayer('me', 20), makePlayer('them', 10), makePlayer('other', 5)]),
    ];
    const stats = computeCareerStats(games, 'me');
    expect(stats.gamesPlayed).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.podiums).toBe(3);
    expect(stats.winRate).toBeCloseTo(2 / 3);
  });

  it('credits a tie for first place as a win', () => {
    const games = [makeGame('1', '2026-01-01', [makePlayer('me', 20), makePlayer('them', 20)])];
    expect(computeCareerStats(games, 'me').wins).toBe(1);
  });

  it('tracks current and longest win streaks in chronological order', () => {
    const games = [
      makeGame('1', '2026-01-01', [makePlayer('me', 30), makePlayer('them', 10)]), // win
      makeGame('2', '2026-01-02', [makePlayer('me', 30), makePlayer('them', 10)]), // win
      makeGame('3', '2026-01-03', [makePlayer('me', 5), makePlayer('them', 30)]),  // loss
      makeGame('4', '2026-01-04', [makePlayer('me', 30), makePlayer('them', 10)]), // win
    ];
    // Shuffle input order to prove it's re-sorted internally by updatedAt.
    const stats = computeCareerStats([games[2], games[0], games[3], games[1]], 'me');
    expect(stats.longestWinStreak).toBe(2);
    expect(stats.currentWinStreak).toBe(1);
  });

  it('respects low-wins ranking', () => {
    const games = [makeGame('1', '2026-01-01', [makePlayer('me', 5), makePlayer('them', 30)], { ranking: 'low-wins' })];
    expect(computeCareerStats(games, 'me').wins).toBe(1);
  });

  it('picks the most frequently played game as favorite', () => {
    const games = [
      makeGame('1', '2026-01-01', [makePlayer('me', 1)], { name: 'Rummy' }),
      makeGame('2', '2026-01-02', [makePlayer('me', 1)], { name: 'Spades' }),
      makeGame('3', '2026-01-03', [makePlayer('me', 1)], { name: 'Rummy' }),
    ];
    expect(computeCareerStats(games, 'me').favoriteGame).toBe('Rummy');
  });

  it('ignores games the player is not part of', () => {
    const games = [makeGame('1', '2026-01-01', [makePlayer('them', 30), makePlayer('other', 10)])];
    const stats = computeCareerStats(games, 'me');
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.winRate).toBe(0);
  });
});
