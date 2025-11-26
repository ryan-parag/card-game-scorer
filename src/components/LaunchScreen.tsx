import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BadgePlus, Heart, Spade, Diamond, Club, Loader, CircleDashed, Check, Github, Heading3 } from 'lucide-react';
import { Game } from '../types/game';
import { Button } from './ui/button';
import moment from 'moment';
import Logo from './ui/ryanLogo';
import { TagLink, Tag } from './ui/tag';

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
    <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex pt-12 lg:pt-16 items-start justify-center px-4 pb-32">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 32, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: -12 }}
              exit={{ opacity: 0, y: 32, rotate: 0 }}
              transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
              className="mx-auto grid grid-cols-2 gap-0 w-16 lg:w-24 h-16 lg:h-24 bg-blue-600 dark:bg-blue-500 rounded-2xl lg:rounded-3xl mb-6 shadow-2xl shadow-red-500/30 overflow-hidden border border-stone-500 dark:border-stone-800 transform relative"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: .5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.6, type: "spring", stiffness: 145 }}
                className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-white"
              />
              <div className="w-8 lg:w-12 h-8 lg:h-12 bg-red-500 flex items-center justify-center">
                <Heart className="w-5 lg:w-8 h-5 lg:h-8 text-white" />
              </div>
              <div className="w-8 lg:w-12 h-8 lg:h-12 bg-black flex items-center justify-center">
                <Spade className="w-5 lg:w-8 h-5 lg:h-8 text-white" />
              </div>
              <div className="w-8 lg:w-12 h-8 lg:h-12 bg-black flex items-center justify-center">
                <Club className="w-5 lg:w-8 h-5 lg:h-8 text-white" />
              </div>
              <div className="w-8 lg:w-12 h-8 lg:h-12 bg-red-500 flex items-center justify-center">
                <Diamond className="w-5 lg:w-8 h-5 lg:h-8 text-white" />
              </div>
            </motion.div>
          </AnimatePresence>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.1, delay: 0.1, type: "spring", stiffness: 140 }}
            className="text-4xl md:text-5xl text-stone-950 dark:text-white mb-4"
          >
            ScoreKeeper
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, delay: 0.15, type: "spring", stiffness: 140 }}
            className="text-xl text-stone-600 dark:text-stone-300"
          >
            Track scores across all your favorite card games
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-10">
          <motion.div
            className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.2, type: "spring", stiffness: 120 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-stone-950 dark:text-white">
                Recent Games
              </h2>
              {recentGames.length > 0 && (
                <Button
                  onClick={onClearAllGames}
                  variant="ghost"
                  size="sm"
                  className="hidden text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Clear All
                </Button>
              )}
            </div>
            {loadingGames ? (
              <div className="text-center flex flex-col items-center py-8 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-800 mb-4">
                <Loader className="w-8 h-8 mb-4 text-stone-400 animate-spin" />
                <p className="text-stone-500 dark:text-stone-400 text-sm">
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
              <div className="space-y-2 mb-4">
                {recentGames.slice(0, 8).map((game, i) => (
                  <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.1, delay: 0.1+(0.1*i), type: "spring", stiffness: 140 }}
                  >
                    <Button
                      onClick={() => onContinueGame(game)}
                      variant="ghost"
                      className="overflow-hidden relative w-full text-left bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 h-auto py-4 px-3 lg:px-4"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={`absolute top-0 left-0 lg:relative lg:top-auto lg:left-auto w-5 h-5 lg:w-8 lg:h-8 inline-flex items-center justify-center lg:rounded-full rounded-none rounded-br-md ${game.status === 'completed' ? 'bg-green-600/10' : 'bg-blue-600/10'}`}>
                          {game.status === 'completed' ? <Check className="w-4 lg:w-5 h-4 lg:h-5 text-green-600 dark:text-green-400" /> : <CircleDashed className="w-4 lg:w-5 h-4 lg:h-5 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div className="flex-1 w-full pl-2 lg:pl-3">
                          <h3 className="font-medium text-stone-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate w-full">
                            {game.name}
                          </h3>
                          <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                            {game.players.length} players • {
                              game.status === 'completed' ? (
                                <span className="text-stone-400 dark:text-stone-600">{game.maxRounds} rounds</span>
                              )
                              :
                              (
                                <span>Round {game.currentRound}/{game.maxRounds}</span>
                              )
                            }
                          &nbsp;• {`Played ${moment(game.updatedAt).fromNow()}`}
                          </p>
                        </div>
                        <div className="hidden sm:flex -space-x-2">
                          {game.players.slice(0, 2).map((player, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-stone-800"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.avatar}
                            </div>
                          ))}
                          {game.players.length > 2 && (
                            <div className="w-8 h-8 bg-stone-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-stone-800">
                              +{game.players.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          <AnimatePresence>
            <motion.div
              className="text-stone-600 dark:text-stone-400 rounded-2xl relative bg-black/5 dark:bg-white/5 shadow-inner overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 1, type: "spring", stiffness: 120 }}
            >
              <motion.div
                className="h-72 w-72 rounded-full absolute left-1/2 -translate-x-1/2 z-0 blur-3xl bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500"
                initial={{ opacity: 0, bottom: '-300px' }}
                animate={{ opacity: .2, bottom: '-200px'  }}
                exit={{ opacity: 0, bottom: '-300px' }}
                transition={{ duration: 0.36, delay: 2, type: "spring", stiffness: 140 }}
              />
              <div className="p-4 lg:p-8 flex flex-col relative z-10">
                <h3 className="text-lg font-semibold">
                  About
                </h3>
                <p className="text-base mb-4 leading-6">
                  Hey, I’m <TagLink withIcon href="https://ryanparag.com"><div className="w-4 h-4 mr-1"><Logo/></div>Ryan Parag</TagLink>, a product designer in Tampa, FL. I wanted to make a stupidly-simple way to track card game scores when playing ad-hoc card games at lunch with my coworkers.
                </p>
                <p className="text-base leading-6">I'm always making small updates to this app, but feel free to poke around the <TagLink withIcon href="https://ryanparag.com"><div className="w-4 h-4 mr-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg></div>GitHub Repository</TagLink> if you have feedback or would like to help. Typography set in Zalando Sans.</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <motion.div
        className="grid grid-cols-5 gap-0 fixed z-20 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full bg-gradient-to-b from-stone-900/50 to-stone-900/90 dark:from-white/60 dark:to-white border border-stone-700 dark:border-stone-200 text-white dark:text-stone-900 backdrop-blur-md shadow-xl shadow-stone-800/20 dark:shadow-white/20 overflow-hidden w-full min-w-[320px] max-w-[320px] lg:w-auto"
        initial={{ opacity: 0, bottom: 0 }}
        animate={{ opacity: 1, bottom: '8px' }}
        exit={{ opacity: 0, bottom: 0 }}
        transition={{ duration: 0.12, delay: 0.6, type: "spring", stiffness: 180 }}
      >
          <button
            onClick={onNewGame}
            className="transition p-4 flex items-center justify-center hover:bg-stone-300/10 dark:hover:bg-white/30 col-span-5 active:shadow-inner"
          >
            <BadgePlus className="w-6 h-6" />
            <span className="ml-2 font-semibold">New Game</span>
          </button>
        </motion.div>
    </div>
  );
};