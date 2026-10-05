import { describe, expect, it } from 'vitest';
import { computeLeagueStats, computeSeasonChampions } from './leagueStats';
import { computeLeagueStandings } from './seasonStandings';
import { Game, Player } from '../types/game';
import type { LeagueSeason } from '../hooks/useLeagues';
import type { ScoringSystem } from '../hooks/useScoringSystem';

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

function makeSeason(id: string, endDate: string, overrides: Partial<LeagueSeason> = {}): LeagueSeason {
  return {
    id,
    league_id: 'l',
    name: id,
    start_date: '2020-01-01',
    end_date: endDate,
    status: 'completed',
    scoring_system_id: null,
    created_at: '',
    ...overrides,
  };
}

describe('computeLeagueStandings', () => {
  const system: ScoringSystem = {
    id: 'sys', name: 'F1', description: null, created_by: null, created_at: '',
    rules: [
      { id: 'r1', scoring_system_id: 'sys', rank: 1, points: 25 },
      { id: 'r2', scoring_system_id: 'sys', rank: 2, points: 18 },
    ],
  };
  const games = [
    makeGame([makePlayer('a', 10), makePlayer('b', 500)], { season_id: 's1' }),
    makeGame([makePlayer('a', 10), makePlayer('b', 5)], { season_id: 's1' }),
    makeGame([makePlayer('a', 10), makePlayer('b', 5)]),
  ];
  const systemForGame = (g: Game) => (g.season_id === 's1' ? system : null);

  it('ranks on total score (game points plus rank points) by default', () => {
    const standings = computeLeagueStandings(games, [], undefined, systemForGame);
    expect(standings.map(s => s.key)).toEqual(['b', 'a']);
    // b: 510 game pts + 25 + 18 rank pts; a: 30 game pts + 18 + 25 (unseasoned game earns none).
    expect(standings[0].champPts + standings[0].rawPts).toBe(553);
    expect(standings[1].champPts + standings[1].rawPts).toBe(73);
  });

  it('ranks on game points or rank points alone', () => {
    expect(computeLeagueStandings(games, [], 'game-pts', systemForGame).map(s => s.key)).toEqual(['b', 'a']);
    // Rank points tie at 43 apiece, so wins break it: a has 2 wins to b's 1.
    const byRankPts = computeLeagueStandings(games, [], 'rank-pts', systemForGame);
    expect(byRankPts.map(s => s.key)).toEqual(['a', 'b']);
    expect(byRankPts.map(s => s.rank)).toEqual([1, 2]);
  });

  it('respects low-wins games when counting wins', () => {
    const standings = computeLeagueStandings(
      [makeGame([makePlayer('a', 10), makePlayer('b', 50)], { ranking: 'low-wins' })],
      [],
      'rank-pts'
    );
    expect(standings[0].key).toBe('a');
  });

  it('credits podiums to every tied player and breaks ties on average finish', () => {
    const games = [
      makeGame([makePlayer('a', 9), makePlayer('b', 8), makePlayer('c', 7), makePlayer('d', 7)]),
      makeGame([makePlayer('b', 9), makePlayer('a', 1)]),
    ];
    const standings = computeLeagueStandings(games, [], 'rank-pts');
    const byKey = Object.fromEntries(standings.map(s => [s.key, s]));
    expect(byKey.c.podiums).toBe(1);
    expect(byKey.d.podiums).toBe(1);
    // a and b both have 1 win, 2 podiums; a averages 1.5, b averages 1.5 too — shared rank.
    expect(byKey.a.rank).toBe(1);
    expect(byKey.b.rank).toBe(1);
    expect(byKey.c.rank).toBe(3);
  });
});

describe('computeSeasonChampions', () => {
  it('counts titles for completed seasons only', () => {
    const games = [
      makeGame([makePlayer('a', 10), makePlayer('b', 5)], { season_id: 's1' }),
      makeGame([makePlayer('a', 10), makePlayer('b', 5)], { season_id: 's2' }),
      makeGame([makePlayer('b', 10), makePlayer('a', 5)], { season_id: 'future' }),
    ];
    const seasons = [makeSeason('s1', '2021-01-01'), makeSeason('s2', '2021-01-01'), makeSeason('future', '2999-01-01')];
    expect(computeSeasonChampions(games, seasons, [], () => null)).toEqual({ a: 2 });
  });
});

describe('computeLeagueStats', () => {
  it('computes aggregate counts', () => {
    const games = [
      makeGame([makePlayer('a', 10), makePlayer('b', 5)], { maxRounds: 3 }),
      makeGame([makePlayer('a', 10), makePlayer('b', 5), makePlayer('c', 1)], { maxRounds: 4 }),
    ];
    const seasons = [makeSeason('s1', '2021-01-01'), makeSeason('s2', '2999-01-01', { start_date: '2998-01-01' })];
    const stats = computeLeagueStats(games, seasons, []);
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.seasonsPlayed).toBe(1);
    expect(stats.playerCount).toBe(3);
    expect(stats.avgPlayers).toBe(2.5);
    expect(stats.totalRounds).toBe(7);
  });

  it('finds records, ignoring low-wins games for highest score', () => {
    const games = [
      makeGame([makePlayer('a', 40), makePlayer('b', 30)], { name: 'G1', season_id: 's1' }),
      makeGame([makePlayer('a', 90), makePlayer('b', 20)], { name: 'G2', season_id: 's1' }),
      makeGame([makePlayer('c', 1), makePlayer('b', 500)], { name: 'G3', ranking: 'low-wins' }),
    ];
    const stats = computeLeagueStats(games, [makeSeason('s1', '2021-01-01', { name: 'Spring' })], []);
    expect(stats.highestScore).toEqual({ value: 90, playerNames: ['a'], context: 'G2' });
    expect(stats.biggestMargin).toEqual({ value: 499, playerNames: ['c'], context: 'G3' });
    expect(stats.mostWinsInSeason).toEqual({ value: 2, playerNames: ['a'], context: 'Spring' });
    expect(stats.topRivalry).toEqual({ value: 2, playerNames: ['a', 'b'], context: '1st & 2nd finishes' });
  });

  it('skips margin and rivalry for games without an outright winner', () => {
    const stats = computeLeagueStats([makeGame([makePlayer('a', 10), makePlayer('b', 10)])], [], []);
    expect(stats.biggestMargin).toBeNull();
    expect(stats.topRivalry).toBeNull();
  });
});
