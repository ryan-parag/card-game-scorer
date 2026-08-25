import { Player } from '../types/game';

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

const IGNORED_WORDS = new Set([
  'and', 'then', 'with', 'got', 'scored', 'score', 'scores', 'points',
  'point', 'has', 'had', 'gets', 'get', 'a', 'an', 'the', 'for',
]);

function wordToNumber(word: string): number | null {
  if (/^-?\d+$/.test(word)) return parseInt(word, 10);
  if (word in NUMBER_WORDS) return NUMBER_WORDS[word];
  return null;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function matchPlayer(nameGuess: string, players: Player[]): Player | null {
  const guess = normalize(nameGuess);
  if (!guess) return null;

  const exact = players.find((p) => normalize(p.name) === guess);
  if (exact) return exact;

  const startsWith = players.find((p) => normalize(p.name).startsWith(guess) || guess.startsWith(normalize(p.name)));
  if (startsWith) return startsWith;

  const contains = players.find((p) => normalize(p.name).includes(guess) || guess.includes(normalize(p.name)));
  if (contains) return contains;

  const guessFirstWord = guess.split(/\s+/)[0];
  const firstWordMatch = players.find((p) => normalize(p.name).split(/\s+/)[0] === guessFirstWord);
  if (firstWordMatch) return firstWordMatch;

  return null;
}

export interface ParsedVoiceScore {
  playerId: string;
  name: string;
  score: number;
}

// Parses a spoken transcript like "Ryan fifteen, Amanda ten" into per-player
// scores by scanning word-by-word: accumulate non-numeric words as a name
// guess, and once a number is hit, match the accumulated name against the
// game's players and record the score.
export function parseVoiceScores(transcript: string, players: Player[]): ParsedVoiceScore[] {
  const words = transcript
    .toLowerCase()
    .replace(/[,.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const results: ParsedVoiceScore[] = [];
  let nameBuffer: string[] = [];

  for (const word of words) {
    const num = wordToNumber(word);
    if (num !== null) {
      if (nameBuffer.length > 0) {
        const player = matchPlayer(nameBuffer.join(' '), players);
        if (player) {
          results.push({ playerId: player.id, name: player.name, score: num });
        }
        nameBuffer = [];
      }
    } else if (!IGNORED_WORDS.has(word)) {
      nameBuffer.push(word);
    }
  }

  return results;
}
