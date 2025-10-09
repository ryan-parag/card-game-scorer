import React from 'react';
import { Trophy, Star, RotateCcw, Home, Download } from 'lucide-react';
import { Game } from '../types/game';
import { Button } from './ui/button';

interface GameSummaryProps {
  game: Game;
  onNewGame: () => void;
  onHome: () => void;
  isDark: boolean;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  game,
  onNewGame,
  onHome,
  isDark
}) => {
  const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];
  const totalRounds = game.rounds.length;
  const averageScore = Math.round(game.players.reduce((sum, p) => sum + p.totalScore, 0) / game.players.length);

  const downloadResults = () => {
    const results = {
      gameName: game.name,
      completedAt: new Date().toLocaleDateString(),
      totalRounds: totalRounds,
      players: sortedPlayers.map((player, index) => ({
        rank: index + 1,
        name: player.name,
        totalScore: player.totalScore,
        roundScores: player.roundScores
      }))
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.name}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-200 dark:from-stone-950 dark:to-stone-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-500 rounded-full mb-6 shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-stone-950 dark:text-white mb-2">
            Game Complete!
          </h1>
          <p className="text-xl text-stone-600 dark:text-stone-400">
            {game.name} • {totalRounds} Rounds
          </p>
        </div>

        {/* Winner Spotlight */}
        <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-2xl p-8 mb-8 text-center shadow-xl">
          <div className="text-yellow-100 mb-4">
            <Star className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            🎉 {winner.name} Wins! 🎉
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatar}
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white">
                {winner.totalScore} Points
              </div>
              <div className="text-yellow-100">
                Final Score
              </div>
            </div>
          </div>
        </div>

        {/* Final Rankings */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-stone-950 dark:text-white mb-6">
            Final Rankings
          </h3>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 rounded-xl transition-all duration-200 ${
                  index === 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600'
                    : index === 1
                    ? 'bg-stone-100 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600'
                    : index === 2
                    ? 'bg-orange-100 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-600'
                    : 'bg-stone-50 dark:bg-stone-800'
                }`}
              >
                <div className="flex-1 flex items-center gap-4">
                  <div className={`text-3xl font-bold hidden md:inline-block ${
                    index === 0 ? 'text-yellow-600' :
                    index === 1 ? 'text-stone-600' :
                    index === 2 ? 'text-orange-600' :
                    'text-stone-500'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div
                    className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-stone-950 dark:text-white">
                      {player.name}
                    </div>
                    <div className="text-stone-600 dark:text-stone-400 text-xs md:text-sm">
                      {player.totalScore} points • Avg: {Math.round(player.totalScore / totalRounds)} per round
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right flex flex-row md:flex-col items-center md:justify-end gap-2 pl-14 md:pl-0">
                  <div className="text-sm text-stone-500 dark:text-stone-400">
                    Final Score
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-stone-950 dark:text-white">
                    {player.totalScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Statistics */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-stone-950 dark:text-white mb-6">
            Game Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-row md:flex-col items-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-left w-12 md:w-auto md:text-center">
                {totalRounds}
              </div>
              <div className="text-stone-600 dark:text-stone-400">
                Rounds Played
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 text-left w-12 md:w-auto md:text-center">
                {game.players.length}
              </div>
              <div className="text-stone-600 dark:text-stone-400">
                Players
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 text-left w-12 md:w-auto md:text-center">
                {averageScore}
              </div>
              <div className="text-stone-600 dark:text-stone-400">
                Average Score
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 text-left w-12 md:w-auto md:text-center">
                {Math.max(...game.players.map(p => p.totalScore))}
              </div>
              <div className="text-stone-600 dark:text-stone-400">
                Highest Score
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onNewGame}
            className="w-full flex items-center justify-center gap-3 text-lg font-medium shadow-lg hover:shadow-xl transform"
            size="lg"
          >
            <RotateCcw className="w-6 h-6" />
            Start New Game
          </Button>
          <Button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-3 text-lg font-medium shadow-lg hover:shadow-xl transform"
            size="lg"
            variant="outline"
          >
            <Home className="w-6 h-6" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};