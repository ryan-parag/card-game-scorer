import { describe, expect, it } from 'vitest';
import { contentStateFor } from './liveActivityState';

const player = (name: string, totalScore: number, color = '#3B82F6') => ({ name, totalScore, color });

describe('contentStateFor', () => {
  it('ranks high-wins games densely and formats scores', () => {
    const state = contentStateFor({
      id: 'g',
      status: 'in-progress',
      current_round: 3,
      max_rounds: 10,
      players: [player('A', 10), player('B', 30), player('C', 30), player('D', 12.5)],
    });
    expect(state.players.map(p => [p.name, p.rank, p.score])).toEqual([
      ['B', 1, '30'], ['C', 1, '30'], ['D', 3, '12.5'], ['A', 4, '10'],
    ]);
    expect(state.round).toBe(3);
    expect(state.isCompleted).toBe(false);
    expect('resultText' in state).toBe(false);
  });

  it('ranks low-wins games lowest first and announces the winner', () => {
    const state = contentStateFor({
      id: 'g',
      status: 'completed',
      ranking: 'low-wins',
      players: [player('A', 50), player('B', 5)],
    });
    expect(state.players[0].name).toBe('B');
    expect(state.resultText).toBe('🎉 B wins');
  });

  it('caps players at 5, counts the rest, and normalizes colors', () => {
    const players = Array.from({ length: 8 }, (_, i) => player(`P${i}`, i, i === 0 ? 'hsl(1,2%,3%)' : 'ef4444'));
    const state = contentStateFor({ id: 'g', players });
    expect(state.players).toHaveLength(5);
    expect(state.otherPlayerCount).toBe(3);
    expect(state.players[0].colorHex).toBe('#EF4444');
    expect(state.players.find(p => p.name === 'P0')).toBeUndefined();
  });

  it('reports ties on completion', () => {
    const state = contentStateFor({ id: 'g', status: 'completed', players: [player('A', 9), player('B', 9)] });
    expect(state.resultText).toBe('🤝 A & B tied');
  });
});
