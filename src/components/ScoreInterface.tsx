import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, ChevronRight } from 'lucide-react';
import { Game } from '../types/game';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ScoreInterfaceProps {
  game: Game;
  onUpdateScore: (playerId: string, roundIndex: number, score: number) => void;
  onUpdateProposedScore: (playerId: string, score: number) => void;
  onNextRound: () => void;
  onCompleteGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onBack: () => void;
  onGoToRound: (roundNumber: number) => void;
  isDark: boolean;
}

export const ScoreInterface: React.FC<ScoreInterfaceProps> = ({
  game,
  onUpdateScore,
  onUpdateProposedScore,
  onNextRound,
  onCompleteGame,
  onUndo,
  canUndo,
  onBack,
  onGoToRound
}) => {
  const [showingProposed, setShowingProposed] = useState(
    game.collectProposedScores && game.currentRound < game.maxRounds
  );

  const handleNextPhase = () => {
    if (showingProposed) {
      setShowingProposed(false);
    } else if (game.currentRound < game.maxRounds) {
      onNextRound();
      if (game.collectProposedScores) {
        setShowingProposed(true);
      }
    } else {
      onCompleteGame();
    }
  };

  const handleRoundClick = (roundNumber: number) => {
    // Only allow clicking on completed rounds (rounds that have been played)
    if (roundNumber <= game.currentRound - 1) {
      onGoToRound(roundNumber);
    }
  };

  const canProceed = showingProposed 
    ? game.players.every(p => (p.proposedScore || 0) >= 0)
    : game.players.every(p => p.roundScores[game.currentRound - 1] !== undefined);

  const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-200 dark:from-stone-900 dark:to-stone-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="icon"
              className="p-3 bg-white dark:bg-stone-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-stone-700 dark:text-stone-300" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                {game.name}
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                Round {game.currentRound} of {game.maxRounds}
                {showingProposed && ' • Collecting Bids'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Game Progress
            </span>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {Math.round((game.currentRound / game.maxRounds) * 100)}%
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(game.currentRound / game.maxRounds) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Score Grid */}
        <div className="flex justify-between mb-6">
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="outline"
            size="icon"
            className="p-3 bg-white dark:bg-stone-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-lg"
          >
            <RotateCcw className="w-6 h-6 text-stone-700 dark:text-stone-300" />
          </Button>
          <Button
            onClick={handleNextPhase}
            disabled={!canProceed}
            className="flex items-center gap-3 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:hover:shadow-lg"
          >
            {showingProposed ? (
              <>
                Continue to Scoring
                <ChevronRight className="w-6 h-6" />
              </>
            ) : game.currentRound < game.maxRounds ? (
              <>
                Next Round
                <ChevronRight className="w-6 h-6" />
              </>
            ) : (
              <>
                Complete Game
                <Trophy className="w-6 h-6" />
              </>
            )}
          </Button>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-stone-50 dark:bg-stone-700">
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-stone-50 dark:bg-stone-700 min-w-[200px]">
                    Player
                  </TableHead>
                  {showingProposed ? (
                    <TableHead className="text-center">
                      Bid
                    </TableHead>
                  ) : (
                    <>
                      {Array.from({ length: game.maxRounds }, (_, i) => (
                        <TableHead
                          key={i}
                          className={`text-center min-w-[80px] transition-colors ${
                            i === game.currentRound - 1 ? 'bg-blue-100 dark:bg-blue-900' : ''
                          } ${i <= game.currentRound - 1 ? 'cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-600 hover:scale-105 transform' : 'opacity-50 cursor-not-allowed'}`}
                          onClick={() => handleRoundClick(i + 1)}
                          title={i <= game.currentRound - 1 ? `Click to edit Round ${i + 1} scores` : `Round ${i + 1} not yet played`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>R{i + 1}</span>
                            {i <= game.currentRound - 1 && i < game.currentRound - 1 && (
                              <div className="w-1 h-1 bg-stone-400 dark:bg-stone-500 rounded-full"></div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center bg-yellow-100 dark:bg-yellow-900 sticky right-0 z-10 min-w-[100px]">
                        Total
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {game.players.map((player, playerIndex) => (
                  <TableRow
                    key={player.id}
                    className={`${
                      playerIndex % 2 === 0 ? 'bg-white dark:bg-stone-800' : 'bg-stone-50 dark:bg-stone-700'
                    }`}
                  >
                    <TableCell className="sticky left-0 z-10 bg-inherit">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <span className="font-medium text-stone-900 dark:text-white">
                          {player.name}
                        </span>
                      </div>
                    </TableCell>
                    
                    {showingProposed ? (
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            value={player.proposedScore ?? 0}
                            onChange={(e) => onUpdateProposedScore(player.id, parseInt(e.target.value) || 0)}
                            className="w-12 text-center text-xl font-bold text-stone-900 dark:text-white"
                          />
                        </div>
                      </TableCell>
                    ) : (
                      <>
                        {Array.from({ length: game.maxRounds }, (_, roundIndex) => (
                          <TableCell
                            key={roundIndex}
                            className={`text-center ${
                              roundIndex === game.currentRound - 1 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {roundIndex <= game.currentRound - 1 ? (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  value={player.roundScores[roundIndex] ?? 0}
                                  onChange={(e) => onUpdateScore(player.id, roundIndex, parseInt(e.target.value) || 0)}
                                  className="w-20 text-lg font-bold text-stone-900 dark:text-white"
                                />
                              </div>
                            ) : (
                              <span className="text-stone-600 dark:text-stone-400">
                                {player.roundScores[roundIndex] || '-'}
                              </span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center bg-yellow-50 dark:bg-yellow-900/20 sticky right-0 z-10 bg-inherit">
                          <span className="text-xl font-bold text-stone-900 dark:text-white">
                            {player.totalScore}
                          </span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Leaderboard */}
        {!showingProposed && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Current Standings
            </h3>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 px-4 py-2 rounded-xl ${
                    index === 0
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600'
                      : 'bg-stone-50 dark:bg-stone-700'
                  }`}
                >
                  <div className={`text-xl font-bold ${
                    index === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-stone-500 dark:text-stone-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div className="font-semibold text-stone-900 dark:text-white">
                      {player.name}
                    </div>
                    <div className="text-sm text-stone-600 dark:text-stone-400">
                      {player.totalScore} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};