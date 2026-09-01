import { describe, expect, it } from 'vitest';
import { parseVoiceScores } from './voiceScoreParser';
import { Player } from '../types/game';

function makePlayer(id: string, name: string): Player {
  return { id, name, color: '#000', avatar: '', totalScore: 0, roundScores: [] };
}

const players = [makePlayer('1', 'Ryan'), makePlayer('2', 'Amanda')];

describe('parseVoiceScores', () => {
  it('parses digit scores separated by commas', () => {
    expect(parseVoiceScores('Ryan 15, Amanda 10', players)).toEqual([
      { playerId: '1', name: 'Ryan', score: 15 },
      { playerId: '2', name: 'Amanda', score: 10 },
    ]);
  });

  it('parses spelled-out number words', () => {
    expect(parseVoiceScores('Ryan fifteen and Amanda ten', players)).toEqual([
      { playerId: '1', name: 'Ryan', score: 15 },
      { playerId: '2', name: 'Amanda', score: 10 },
    ]);
  });

  it('ignores filler words like scored/points/and', () => {
    expect(parseVoiceScores('Ryan scored 15 points and Amanda got 10', players)).toEqual([
      { playerId: '1', name: 'Ryan', score: 15 },
      { playerId: '2', name: 'Amanda', score: 10 },
    ]);
  });

  it('matches partial/fuzzy names', () => {
    expect(parseVoiceScores('ry 15', players)).toEqual([
      { playerId: '1', name: 'Ryan', score: 15 },
    ]);
  });

  it('is case-insensitive', () => {
    expect(parseVoiceScores('RYAN 15', players)).toEqual([
      { playerId: '1', name: 'Ryan', score: 15 },
    ]);
  });

  it('drops numbers with no preceding name', () => {
    expect(parseVoiceScores('15 points', players)).toEqual([]);
  });

  it('drops names that do not match any player', () => {
    expect(parseVoiceScores('Bob 15', players)).toEqual([]);
  });

  it('does not combine compound number words (known limitation)', () => {
    // "twenty five" is parsed as two separate numbers ("twenty" attaches to the
    // name, "five" is dropped since there's no name left to attach to) rather
    // than being combined into 25.
    expect(parseVoiceScores('Ryan twenty five', players)).toEqual([
      { playerId: '1', name: 'Ryan', score: 20 },
    ]);
  });

  it('returns an empty array for an empty transcript', () => {
    expect(parseVoiceScores('', players)).toEqual([]);
  });
});
