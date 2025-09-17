import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { Game } from '../types/game';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface GameSetupProps {
  onBack: () => void;
  onNext: (gameConfig: Partial<Game>) => void;
  isDark: boolean;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onBack, onNext }) => {
  const [gameName, setGameName] = useState('');
  const [maxRounds, setMaxRounds] = useState(3);
  const [collectProposedScores, setCollectProposedScores] = useState(false);
  const [gameType, setGameType] = useState<'standard' | 'custom'>('standard');

  const handleNext = () => {
    if (!gameName.trim()) return;
    
    onNext({
      name: gameName,
      maxRounds,
      collectProposedScores,
      gameType,
      status: 'setup'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-900 dark:to-stone-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="outline"
            size="icon"
            className="p-3 bg-white dark:bg-stone-800 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-stone-700 dark:text-stone-300" />
          </Button>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
            Game Setup
          </h1>
        </div>

        {/* Setup Form */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-8">
          <div className="space-y-8">
            {/* Game Name */}
            <div>
              <label className="block text-lg font-medium text-stone-900 dark:text-white mb-3">
                Game Name
              </label>
              <Input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name (e.g., Hearts, Spades, Rummy)"
                className="text-lg"
              />
              <div className="flex-wrap items-center mt-2 text-sm hidden md:flex">
                <span className="text-stone-600 dark:text-stone-400">Common games:</span>
                {['Uno Golf', 'Rummy', 'Spades', 'Screw the Dealer'].map((gameName) => (
                  <button
                    key={gameName}
                    onClick={() => setGameName(gameName)}
                    className="transition ml-1 text-sm px-2 py-0.5 rounded-md bg-transparent border border-stone-300 text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:border-stone-500 dark:text-stone-200 dark:hover:bg-stone-700 dark:hover:text-white"
                  >
                    {gameName}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Rounds */}
            <div>
              <label className="block text-lg font-medium text-stone-900 dark:text-white mb-3">
                Number of Rounds
              </label>
              <div className="flex flex-wrap items-center justify-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((rounds) => (
                  <div
                    key={rounds}
                    className="inline-flex p-2"
                  >
                    <Button
                      onClick={() => setMaxRounds(rounds)}
                      variant={maxRounds === rounds ? "default" : "outline"}
                      size="icon"
                      className={`h-16 w-16 rounded-xl border border-stone-300 dark:border-stone-700 ${maxRounds === rounds && '!dark:bg-transparent dark:border-stone-700'}`}
                    >
                      <div className="font-bold text-base">{rounds}</div>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring Options */}
            <div>
              <label className="block text-lg font-medium text-stone-900 dark:text-white mb-4">
                Scoring Method
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Button
                  onClick={() => setCollectProposedScores(false)}
                  variant={!collectProposedScores ? "default" : "outline"}
                  className="p-4 h-auto flex-col"
                >
                  <div className="font-bold">Simple Scoring</div>
                  <div className="text-xs opacity-75 text-wrap">Enter final scores at the end of each round</div>
                </Button>
                <Button
                  onClick={() => setCollectProposedScores(true)}
                  variant={collectProposedScores ? "default" : "outline"}
                  className="p-4 h-auto flex-col"
                >
                  <div className="font-bold">Bid & Score</div>
                  <div className="text-xs opacity-75 text-wrap">Collect proposed scores before rounds, then actual scores after</div>
                </Button>
              </div>
            </div>

            {/* Game Type */}
            <div>
              <label className="block text-lg font-medium text-stone-900 dark:text-white mb-4">
                Game Type
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Button
                  onClick={() => setGameType('standard')}
                  variant={gameType === 'standard' ? "default" : "outline"}
                  className="p-4 h-auto flex-col"
                >
                  <div className="font-bold">Standard</div>
                  <div className="text-xs opacity-75">Common card games</div>
                </Button>
                <Button
                  onClick={() => setGameType('custom')}
                  variant={gameType === 'custom' ? "default" : "outline"}
                  className="p-4 h-auto flex-col"
                >
                  <div className="font-bold">Custom</div>
                  <div className="text-xs opacity-75">Custom rules</div>
                </Button>
              </div>
            </div>
          </div>

          {/* Continue Button */}

          {
            gameName.trim() && (
              <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-700">
                <Button
                  onClick={handleNext}
                  disabled={!gameName.trim()}
                  className="w-full flex items-center justify-center gap-3 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:hover:shadow-lg"
                  size="lg"
                >
                  <Play className="w-6 h-6" />
                  Continue to Players
                </Button>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};