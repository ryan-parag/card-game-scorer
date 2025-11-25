import React, { useState } from 'react';
import { ArrowLeft, Play, Home } from 'lucide-react';
import { Game } from '../types/game';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface GameSetupProps {
  onBack: () => void;
  onNext: (gameConfig: Partial<Game>) => void;
  isDark: boolean;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onBack, onNext }) => {
  const [gameName, setGameName] = useState('');
  const [maxRounds, setMaxRounds] = useState(3);
  const [showMoreRounds, setShowMoreRounds] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="outline"
            size="icon"
            className="p-3 bg-white dark:bg-stone-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-stone-800 dark:text-stone-300" />
          </Button>
          <h1 className="text-xl lg:text-3xl font-bold text-stone-950 dark:text-white">
            Game Setup
          </h1>
        </div>

        {/* Setup Form */}
        <motion.div
          className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8 relative"
          initial={{ opacity: 0, bottom: '-24px' }}
          animate={{ opacity: 1, bottom: 0 }}
          exit={{ opacity: 0, bottom: '-24px' }}
          transition={{ duration: 0.12, delay: 0.1, type: "spring", stiffness: 180 }}
        >
          <div className="space-y-8">
            {/* Game Name */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, bottom: '-8px' }}
              animate={{ opacity: 1, bottom: 0 }}
              exit={{ opacity: 0, bottom: '-8px' }}
              transition={{ duration: 0.24, delay: 0.2, type: "spring", stiffness: 180 }}
            >
              <label className="block text-lg font-medium text-stone-950 dark:text-white mb-3">
                Game Name
              </label>
              <Input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name (e.g., Hearts, Spades, Rummy)"
              />
              <div className="flex-wrap items-center gap-x-1 gap-y-1 pt-1 text-sm flex">
                <span className="text-stone-600 dark:text-stone-400 hidden lg:inline-block">Common games:</span>
                {['Uno Golf', 'Rummy', 'Spades', 'Screw the Dealer'].map((gameName) => (
                  <button
                    key={gameName}
                    onClick={() => setGameName(gameName)}
                    className="transition ml-1 text-sm px-2 py-0.5 rounded-md bg-transparent border border-stone-300 text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-white"
                  >
                    {gameName}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Number of Rounds */}
            <div>
              <label className="block text-lg font-medium text-stone-950 dark:text-white mb-3">
                Number of Rounds
              </label>
              <motion.div
                className="grid grid-cols-5 md:flex flex-wrap gap-2 lg:gap-4 relative"
                initial={{ opacity: 0, bottom: '-16px' }}
                animate={{ opacity: 1, bottom: 0 }}
                exit={{ opacity: 0, bottom: '-16px' }}
                transition={{ duration: 0.12, delay: 0.1, type: "spring", stiffness: 180 }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((rounds) => (
                  <motion.div
                    key={rounds}
                    className={`${rounds > 10 && !showMoreRounds ? 'hidden' : 'inline-flex'} justify-center relative`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12, delay: 0.05+(.05*rounds), type: "spring", stiffness: 180 }}
                  >
                    <Button
                      onClick={() => setMaxRounds(rounds)}
                      variant={maxRounds === rounds ? "default" : "outline"}
                      size="icon"
                      className={`w-full h-14 md:w-16 md:h-16 lg:w-16 rounded-lg md:rounded-xl`}
                    >
                      <div className="font-bold text-base">{rounds}</div>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
              {
                showMoreRounds ? (
                  <div className="mt-4 p-2 rounded-lg bg-stone-100 dark:bg-stone-700 flex justify-center text-center text-sm text-stone-500 dark:text-stone-400">
                    <span>😎 Don't worry, you can increase/decrease the number of rounds (without limit) while playing too</span>
                  </div>
                ) :
                (
                  <div className="mt-2 flex justify-center">
                    <Button
                        variant="text"
                        size={'sm'}
                        className="text-sm px-2 py-px rounded-sm hover:bg-stone-100 dark:hover:bg-stone-700 hover:underline opacity-60 hover:opacity-100 transition font-normal"
                        onClick={() => setShowMoreRounds(true)}
                      >
                      Show more rounds
                    </Button>
                  </div>
                )
              }
            </div>

            {/* Scoring Options */}
            <div>
              <label className="block text-lg font-medium text-stone-950 dark:text-white mb-4">
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
            <div className="hidden">
              <label className="block text-lg font-medium text-stone-950 dark:text-white mb-4">
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
              <AnimatePresence>
                <motion.div
                  className="grid grid-cols-1 gap-0 fixed bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full bg-gradient-to-b from-stone-900/50 to-stone-900/90 dark:from-white/60 dark:to-white border border-stone-700 dark:border-stone-200 text-white dark:text-stone-900 backdrop-blur-md shadow-xl shadow-stone-800/20 dark:shadow-white/20 overflow-hidden w-full max-w-[320px] min-w-[320px] lg:w-auto"
                  initial={{ opacity: 0, bottom: 0 }}
                  animate={{ opacity: 1, bottom: '8px' }}
                  exit={{ opacity: 0, bottom: 0 }}
                  transition={{ duration: 0.12, delay: 0.2, type: "spring", stiffness: 180 }}
                >
                  <button
                    onClick={handleNext}
                    disabled={!gameName.trim()}
                    className="transition p-4 flex items-center justify-center hover:bg-stone-300/10 dark:hover:bg-stone-700/20 active:shadow-inner"
                  >
                    <span className="ml-2 font-medium">Continue to Players</span>
                  </button>
                </motion.div>
              </AnimatePresence>
            )
          }
        </motion.div>
      </div>
    </div>
  );
};