import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { Game } from '../types/game';
import { computeWinProbabilities, getCompletedRoundCount } from '../utils/winProbability';

interface WinProbabilityCardProps {
  game: Game;
}

export const WinProbabilityCard: React.FC<WinProbabilityCardProps> = ({ game }) => {
  const completedRounds = getCompletedRoundCount(game.players);

  const odds = useMemo(() => {
    const results = computeWinProbabilities(game);
    return game.players
      .map((player) => ({
        player,
        probability: results.find((r) => r.playerId === player.id)?.probability ?? 0,
      }))
      .sort((a, b) => b.probability - a.probability);
    // Recompute whenever scores or game settings that affect the simulation change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.players.map((p) => `${p.id}:${p.totalScore}:${p.roundScores.join(',')}`).join('|'), game.maxRounds, game.targetScore, game.ranking]);

  if (game.players.length < 2 || game.status === 'completed') {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl shadow-xl px-4 py-3 lg:px-5 lg:py-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1 mb-2.5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          Win Probability
        </h3>
        {completedRounds === 0 && (
          <span className="text-[11px] text-muted-foreground">Even odds before Round 1</span>
        )}
      </div>
      <div className="space-y-1">
        {odds.map(({ player, probability }) => {
          const pct = Math.round(probability * 100);
          return (
            <div key={player.id} className="flex items-center gap-2">
              <span className="w-16 sm:w-24 shrink-0 truncate text-xs font-medium text-foreground">
                {player.name}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: player.color }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs font-semibold text-foreground">
                <NumberFlow value={pct} />%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
