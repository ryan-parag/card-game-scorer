import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { Game } from '../types/game';
import { computeWinProbabilities, getCompletedRoundCount } from '../utils/winProbability';
import { useLeagueActivity } from '../hooks/useLeagueActivity';

interface WinProbabilityCardProps {
  game: Game;
}

export const WinProbabilityCard: React.FC<WinProbabilityCardProps> = ({ game }) => {
  const completedRounds = getCompletedRoundCount(game.players);
  const leagueHistory = useLeagueActivity(game.league_id, game.name, game.id);

  const odds = useMemo(() => {
    const results = computeWinProbabilities(game, leagueHistory);
    return game.players
      .map((player) => ({
        player,
        probability: results.find((r) => r.playerId === player.id)?.probability ?? 0,
      }))
      .sort((a, b) => b.probability - a.probability);
    // Recompute whenever scores, game settings, or league history that affect the simulation change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    game.players.map((p) => `${p.id}:${p.totalScore}:${p.roundScores.join(',')}`).join('|'),
    game.maxRounds,
    game.targetScore,
    game.ranking,
    leagueHistory,
  ]);

  if (game.players.length < 2 || game.status === 'completed') {
    return null;
  }

  // History-informed priors can differentiate odds even before Round 1, so
  // only claim "even odds" when the odds actually are (roughly) even.
  const preRoundOddsAreEven = completedRounds === 0
    && odds.every((o) => Math.abs(o.probability - 1 / odds.length) < 0.02);

  return (
    <div className="bg-card rounded-2xl shadow-xl px-4 py-3 lg:px-5 lg:py-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1 mb-2.5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          Win Probability
        </h3>
        {preRoundOddsAreEven && (
          <span className="text-[11px] text-muted-foreground">Even odds before Round 1</span>
        )}
        {completedRounds === 0 && !preRoundOddsAreEven && (
          <span className="text-[11px] text-muted-foreground">Based on league history</span>
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
