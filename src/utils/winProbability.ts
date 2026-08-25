import { Game, GameRanking, Player } from '../types/game';
import { resolveRanking } from './playerRanking';

const TRIALS = 800;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], fallbackMean: number): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance) || Math.abs(fallbackMean) * 0.2 + 1;
}

// Box-Muller transform for a normally-distributed sample.
function sampleNormal(mu: number, sigma: number): number {
  if (sigma <= 0) return mu;
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mu + z * sigma;
}

function pickWinners(totals: number[], ranking: GameRanking): number[] {
  const best = ranking === 'low-wins' ? Math.min(...totals) : Math.max(...totals);
  const winners: number[] = [];
  totals.forEach((t, i) => {
    if (t === best) winners.push(i);
  });
  return winners;
}

export interface WinProbabilityResult {
  playerId: string;
  probability: number;
}

// Monte Carlo estimate of each player's odds of winning from the current
// position: each player's future round scores are drawn from a normal
// distribution fit to their own scoring history (falling back to the pooled
// average when a player doesn't have enough rounds yet), then rounds are
// simulated forward to maxRounds (or until someone reaches the target score).
export function computeWinProbabilities(game: Game): WinProbabilityResult[] {
  const { players } = game;
  if (players.length === 0) return [];

  const ranking = resolveRanking(game);
  const completedRounds = Math.max(0, ...players.map((p) => p.roundScores.length));
  const remainingRounds = Math.max(0, game.maxRounds - completedRounds);

  const allScores = players.flatMap((p) => p.roundScores);
  const poolMean = mean(allScores);
  const poolStdDev = stdDev(allScores, poolMean);

  if (remainingRounds === 0 || allScores.length === 0) {
    const totals = players.map((p) => p.totalScore);
    const winnerIndices = new Set(pickWinners(totals, ranking));
    return players.map((p, i) => ({
      playerId: p.id,
      probability: winnerIndices.size > 0
        ? (winnerIndices.has(i) ? 1 / winnerIndices.size : 0)
        : 1 / players.length,
    }));
  }

  const playerStats = players.map((p) => {
    const scores = p.roundScores;
    const playerMean = scores.length > 0 ? mean(scores) : poolMean;
    const playerStdDev = scores.length >= 2 ? stdDev(scores, playerMean) : poolStdDev;
    return { mean: playerMean, stdDev: playerStdDev };
  });

  const wins = new Array(players.length).fill(0);

  for (let trial = 0; trial < TRIALS; trial++) {
    const totals = players.map((p) => p.totalScore);
    let reachedTarget = false;

    for (let round = 0; round < remainingRounds && !reachedTarget; round++) {
      for (let i = 0; i < players.length; i++) {
        const stats = playerStats[i];
        const drawn = sampleNormal(stats.mean, stats.stdDev);
        totals[i] += Math.max(0, Math.round(drawn));
      }
      if (game.targetScore && ranking === 'high-wins') {
        reachedTarget = totals.some((t) => t >= game.targetScore!);
      }
    }

    const winnerIndices = pickWinners(totals, ranking);
    const credit = 1 / winnerIndices.length;
    winnerIndices.forEach((i) => {
      wins[i] += credit;
    });
  }

  return players.map((p, i) => ({
    playerId: p.id,
    probability: wins[i] / TRIALS,
  }));
}

export function getCompletedRoundCount(players: Player[]): number {
  return Math.max(0, ...players.map((p) => p.roundScores.length));
}
