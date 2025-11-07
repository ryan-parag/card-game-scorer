import React, { useState } from 'react';
import { Trophy, Star, RotateCcw, Home, Download, Repeat, BadgePlus } from 'lucide-react';
import { Game } from '../types/game';
import { useWindowSize } from 'react-use'
import Confetti from 'react-confetti'
import { motion, AnimatePresence } from 'framer-motion';

interface GameSummaryProps {
  game: Game;
  onNewGame: () => void;
  onHome: () => void;
  onPlayAgainWithSamePlayers?: () => void;
  isDark: boolean;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  game,
  onNewGame,
  onHome,
  onPlayAgainWithSamePlayers,
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

  const [isVisible, setIsVisible] = useState(true);
  const { width, height } = useWindowSize()

  setTimeout(() => {
    setIsVisible(false);
  }, 3000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-200 dark:from-stone-950 dark:to-stone-900 py-12 px-4">
      <Confetti width={width} height={height} initialVelocityY={100} gravity={.2} recycle={isVisible} />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 32, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: -12 }}
              exit={{ opacity: 0, y: 32, rotate: 0 }}
              transition={{ duration: 0.24, delay: 0.1, type: "spring", stiffness: 150 }}
              className="mx-auto flex items-center justify-center w-16 lg:w-24 h-16 lg:h-24 bg-gradient-to-b from-yellow-400 to-yellow-700 rounded-2xl lg:rounded-3xl mb-6 shadow-2xl shadow-yellow-500/50 overflow-hidden border border-yellow-500 dark:border-yellow-800 transform relative"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: .3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.6, type: "spring", stiffness: 145 }}
                className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-white"
              />
              <Trophy className="w-8 lg:w-12 h-8 lg:h-12 text-white" />
            </motion.div>
          </AnimatePresence>
          <h1 className="text-4xl text-stone-950 dark:text-white mb-2">
            Game Complete!
          </h1>
          <p className="text-xl text-stone-600 dark:text-stone-400">
            {game.name} • {totalRounds} Rounds
          </p>
        </div>

        {/* Winner Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          className="bg-gradient-to-b dark:from-stone-800 dark:to-yellow-900/50 from-white to-yellow-500/30 rounded-2xl px-8 py-12 mb-8 text-center shadow-xl border border-stone-200 dark:border-stone-700"
        >
          <h2 className="text-3xl font-bold mb-2">
            🎉 {winner.name} Wins! 🎉
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 border-white"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatar}
            </div>
            <div className="text-left">
              <div className="text-xl font-bold ">
                {winner.totalScore} Points
              </div>
              <div className="text-yellow-700 dark:text-yellow-300">
                Final Score
              </div>
            </div>
          </div>
        </motion.div>

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
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 mb-28">
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
        <motion.div
          className="grid grid-cols-3 gap-0 fixed bottom-6 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full bg-white/50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 backdrop-blur-md shadow-xl shadow-stone-800/20 dark:shadow-stone-500/20 overflow-hidden w-full max-w-sm lg:w-auto"
          initial={{ opacity: 0, bottom: 0 }}
          animate={{ opacity: 1, bottom: '32px' }}
          exit={{ opacity: 0, bottom: 0 }}
          transition={{ duration: 0.12, delay: 0.6, type: "spring", stiffness: 180 }}
        >
          <button
            onClick={onHome}
            className="transition p-4 flex items-center justify-center hover:bg-stone-300/10 dark:hover:bg-stone-700/20"
          >
            <Home className="w-6 h-6" />
            <span className="ml-2 font-medium">Home</span>
          </button>
          <button
            onClick={onNewGame}
            className="transition p-4 flex items-center justify-center hover:bg-stone-300/10 dark:hover:bg-stone-700/20 border-x border-x-stone-200 dark:border-x-stone-700"
          >
            <BadgePlus className="w-6 h-6" />
            <span className="ml-2 font-medium">New</span>
          </button>
          {onPlayAgainWithSamePlayers && (
            <button
              onClick={onPlayAgainWithSamePlayers}
              className="transition p-4 flex items-center justify-center hover:bg-stone-300/10 dark:hover:bg-stone-700/20r"
            >
              <Repeat className="w-6 h-6" />
              <span className="ml-2 font-medium">Restart</span>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};