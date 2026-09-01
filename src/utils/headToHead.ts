import { Game } from '../types/game';

export interface HeadToHeadRecord {
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
}

// Head-to-head record between two players: only counts games both of them
// took part in, and compares just their two final scores — anyone else in
// the game (or their placement) doesn't factor in.
export function computeHeadToHead(games: Game[], playerId: string, opponentId: string): HeadToHeadRecord {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let gamesPlayed = 0;

  for (const game of games) {
    const player = game.players.find((p) => p.id === playerId);
    const opponent = game.players.find((p) => p.id === opponentId);
    if (!player || !opponent) continue;

    gamesPlayed++;
    const playerScore = player.totalScore ?? 0;
    const opponentScore = opponent.totalScore ?? 0;

    if (playerScore === opponentScore) {
      ties++;
      continue;
    }
    const playerBetter = game.ranking === 'low-wins'
      ? playerScore < opponentScore
      : playerScore > opponentScore;
    if (playerBetter) wins++;
    else losses++;
  }

  return { gamesPlayed, wins, losses, ties };
}
