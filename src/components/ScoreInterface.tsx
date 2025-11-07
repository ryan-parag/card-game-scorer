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
  onSetMaxRounds: (newMaxRounds: number) => void;
  onNextRound: () => void;
  onCompleteGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onBack: () => void;
  onGoToRound: (roundNumber: number) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  onUpdatePlayer: (playerId: string, updates: Partial<Game['players'][number]>) => void;
  isDark: boolean;
}

export const ScoreInterface: React.FC<ScoreInterfaceProps> = ({
  game,
  onUpdateScore,
  onUpdateProposedScore,
  onSetMaxRounds,
  onNextRound,
  onCompleteGame,
  onUndo,
  canUndo,
  onBack,
  onGoToRound,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer
}) => {
  const [showingProposed, setShowingProposed] = useState(
    game.collectProposedScores && game.currentRound < game.maxRounds
  );
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [isSettingRounds, setIsSettingRounds] = useState(false);
  const [roundsInput, setRoundsInput] = useState(String(game.maxRounds));

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
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-200 dark:from-stone-950 dark:to-stone-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="icon"
              className="p-3 bg-white dark:bg-stone-900 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-stone-800 dark:text-stone-300" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-950 dark:text-white">
                {game.name}
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="link"
                  onClick={() => { setRoundsInput(String(game.maxRounds)); setIsSettingRounds(true); }}
                  className="p-0 text-base"
                >
                  Round {game.currentRound} of {game.maxRounds}
                </Button>
                <p className="mx-1 text-stone-600">•</p>
                <Button
                  variant="link"
                  onClick={() => setIsEditingPlayers(true)}
                  className="p-0 text-base"
                >
                  {game.players.length} Players
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-800 dark:text-stone-300">
              Game Progress
            </span>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {Math.round((game.currentRound / game.maxRounds) * 100)}%
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(game.currentRound / game.maxRounds) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Score Grid */}
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="flex items-center gap-1">
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              variant="outline"
              size="icon"
              className="p-3 bg-white dark:bg-stone-900 transition-all duration-200 disabled:opacity-50"
            >
              <RotateCcw className="w-6 h-6 text-stone-800 dark:text-stone-300" />
            </Button>
          </div>
          <div className="flex mt-2 sm:mt-0 flex-col md:flex-row items-center gap-1">
            <Button
              onClick={handleNextPhase}
              disabled={!canProceed}
              className="flex w-full sm:w-auto items-center transform disabled:transform-none disabled:hover:shadow-lg"
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
        </div>
        {
          showingProposed && (
            <h4 className="font-bold text-xl mb-4">Collecting Bids - Round {game.currentRound} of {game.maxRounds}</h4>
          )
        }
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-stone-50 dark:bg-stone-800">
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-stone-50 dark:bg-stone-800 min-w-[200px]">
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
                          } ${i <= game.currentRound - 1 ? 'cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700 hover:scale-105 transform' : 'opacity-50 cursor-not-allowed'}`}
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
                      <TableHead className="text-center bg-stone-200 dark:bg-stone-600 text-stone-950 dark:text-stone-200 sticky right-0 z-10 min-w-[100px]">
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
                      playerIndex % 2 === 0 ? 'bg-white dark:bg-stone-900' : 'bg-stone-50 dark:bg-stone-800'
                    }`}
                  >
                    <TableCell className="sticky left-0 z-10 bg-inherit border-r border-stone-200 dark:border-stone-600">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <span className="font-medium text-stone-950 dark:text-white">
                          {player.name}
                          {
                            showingProposed ? (
                              <>
                                <br/>
                                <span className="text-xs font-normal text-stone-600 dark:text-stone-400">Total score: {player.totalScore}</span>
                              </>
                            ) : (
                              <>
                                <br/>
                                <span className="text-xs font-normal text-stone-600 dark:text-stone-400">Last bid: {player.proposedScore}</span>
                              </>
                            )
                          }
                        </span>
                      </div>
                    </TableCell>
                    
                    {showingProposed ? (
                      <TableCell className="p-1 min-w-20 max-w-24">
                        <div className="flex items-center justify-center gap-2 h-16">
                          <Input
                            type="tel"
                            value={player.proposedScore ?? 0}
                            onChange={(e) => onUpdateProposedScore(player.id, parseInt(e.target.value) || 0)}
                            className="w-full h-full rounded-none text-center text-xl font-bold text-stone-950 dark:text-white"
                          />
                        </div>
                      </TableCell>
                    ) : (
                      <>
                        {Array.from({ length: game.maxRounds }, (_, roundIndex) => (
                          <TableCell
                            key={roundIndex}
                            className={`text-center p-1 min-w-20 max-w-24 ${
                              roundIndex === game.currentRound - 1 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {roundIndex <= game.currentRound - 1 ? (
                              <div className="h-full flex items-center justify-center gap-1">
                                <Input
                                  type="tel"
                                  value={player.roundScores[roundIndex] ?? 0}
                                  onChange={(e) => onUpdateScore(player.id, roundIndex, parseInt(e.target.value) || 0)}
                                  className="w-full h-16 rounded-none text-lg font-bold text-stone-950 dark:text-white"
                                />
                              </div>
                            ) : (
                              <span className="text-stone-600 dark:text-stone-400">
                                {player.roundScores[roundIndex] || '-'}
                              </span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center sticky right-0 z-10 bg-inherit border-l border-stone-200 dark:border-stone-600">
                          <span className="text-xl font-bold text-stone-950 dark:text-white">
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
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-stone-950 dark:text-white mb-4 flex items-center gap-2">
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
                      : 'bg-stone-50 dark:bg-stone-800'
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
                    <div className="font-semibold text-stone-950 dark:text-white">
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
      {isEditingPlayers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Players</h2>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-visible">
              {game.players.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={p.name}
                    onChange={(e) => onUpdatePlayer(p.id, { name: e.target.value })}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => onRemovePlayer(p.id)} disabled={game.players.length <= 2}>Remove</Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={onAddPlayer}>Add Player</Button>
              <div className="flex items-center">
                <Button className="mr-2" variant="outline" onClick={() => setIsEditingPlayers(false)}>Close</Button>
                <Button onClick={() => setIsEditingPlayers(false)}>Done</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSettingRounds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Set Total Rounds</h2>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-stone-800 dark:text-stone-300">Number of Rounds</label>
              <Input
                type="number"
                min={1}
                value={roundsInput}
                onChange={(e) => setRoundsInput(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingRounds(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  const parsed = parseInt(roundsInput, 10);
                  if (Number.isFinite(parsed)) {
                    onSetMaxRounds(parsed);
                    setIsSettingRounds(false);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};