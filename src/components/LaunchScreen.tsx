import React from 'react';
import { Play, Plus, Heart, Spade, Diamond, Club } from 'lucide-react';
import { Game } from '../types/game';
import { Button } from './ui/button';

interface LaunchScreenProps {
  recentGames: Game[];
  onNewGame: () => void;
  onContinueGame: (game: Game) => void;
  onViewHistory: () => void;
  onSettings: () => void;
  onClearAllGames: () => void;
  isDark: boolean;
  loadingGames?: boolean;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({
  recentGames,
  onNewGame,
  onContinueGame,
  onClearAllGames,
  loadingGames = false
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="mx-auto grid grid-cols-2 gap-0 w-24 h-24 bg-blue-600 dark:bg-blue-500 rounded-3xl mb-6 shadow-2xl overflow-hidden border border-stone-500 dark:border-stone-800 tranform -rotate-12">
            <div className="w-12 h-12 bg-red-500 flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <Spade className="w-8 h-8 text-white" />
            </div>
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <Club className="w-8 h-8 text-white" />
            </div>
            <div className="w-12 h-12 bg-red-500 flex items-center justify-center">
              <Diamond className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-950 dark:text-white mb-4">
            ScoreKeeper
          </h1>
          <p className="text-xl text-stone-600 dark:text-stone-300">
            Track scores across all your favorite card games
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-stone-950 dark:text-white">
                Recent Games
              </h2>
              {recentGames.length > 0 && (
                <Button
                  onClick={onClearAllGames}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Clear All
                </Button>
              )}
            </div>
            {loadingGames ? (
              <div className="text-center py-8 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-800 mb-4">
                <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Play className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-stone-500 dark:text-stone-400">
                  Loading games...
                </p>
              </div>
            ) : recentGames.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-800 mb-4">
                <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-stone-500 dark:text-stone-400">
                  No recent games
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {recentGames.slice(0, 5).map((game) => (
                  <Button
                    key={game.id}
                    onClick={() => onContinueGame(game)}
                    variant="ghost"
                    className="w-full text-left bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 h-auto p-4"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <h3 className="font-medium text-stone-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {game.name}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          {game.players.length} players • Round {game.currentRound}/{game.maxRounds}
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {game.players.slice(0, 3).map((player) => (
                          <div
                            key={player.id}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-stone-800"
                            style={{ backgroundColor: player.color }}
                          >
                            {player.avatar}
                          </div>
                        ))}
                        {game.players.length > 3 && (
                          <div className="w-8 h-8 bg-stone-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-stone-800">
                            +{game.players.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            <div className="space-y-4">
              <Button
                onClick={onNewGame}
                className="w-full flex items-center justify-center gap-3 text-lg font-medium shadow-lg hover:shadow-xl transform"
                size="lg"
              >
                <Plus className="w-6 h-6" />
                Start New Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};