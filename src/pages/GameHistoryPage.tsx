import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CircleDashed, Check, History, Loader } from 'lucide-react';
import moment from 'moment';
import { Game } from '../types/game';
import { getGames, getSettings, saveSettings } from '../utils/storage';
import { Button } from '../components/ui/button';
import Topbar from '../components/ui/Topbar';
import { FaceAvatar } from '../components/FaceAvatar';

const PAGE_SIZE = 10;

export const GameHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isDark, setIsDark] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getGames();
      setGames(
        list.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );
    } catch (e) {
      console.error(e);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageGames = games.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  const openGame = (game: Game) => {
    navigate('/', { state: { continueGame: game } });
  };

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
              <History className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-950 dark:text-white">
                Game history
              </h1>
              <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base">
                All saved games, newest first
              </p>
            </div>
          </div>

          <motion.div
            className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-4 lg:p-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="text-center flex flex-col items-center py-12">
                <Loader className="w-8 h-8 mb-4 text-stone-400 animate-spin" />
                <p className="text-stone-500 dark:text-stone-400 text-sm">Loading games…</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                No games yet. Start one from the home screen.
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {pageGames.map((game, i) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12, delay: 0.04 * i }}
                    >
                      <Button
                        type="button"
                        onClick={() => openGame(game)}
                        variant="ghost"
                        className="overflow-hidden relative w-full text-left bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 h-auto py-4 px-3 lg:px-4"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={`absolute top-0 left-0 lg:relative lg:top-auto lg:left-auto w-5 h-5 lg:w-8 lg:h-8 inline-flex items-center justify-center lg:rounded-full rounded-none rounded-br-md ${
                              game.status === 'completed'
                                ? 'bg-green-600/10'
                                : 'bg-blue-600/10'
                            }`}
                          >
                            {game.status === 'completed' ? (
                              <Check className="w-4 lg:w-5 h-4 lg:h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <CircleDashed className="w-4 lg:w-5 h-4 lg:h-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 w-full pl-2 lg:pl-3 min-w-0">
                            <h3 className="font-medium text-stone-950 dark:text-white truncate">
                              {game.name}
                            </h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                              {game.players.length} players •{' '}
                              {game.status === 'completed' ? (
                                <span className="text-stone-400 dark:text-stone-600">
                                  {game.maxRounds} rounds
                                </span>
                              ) : (
                                <span>
                                  Round {game.currentRound}/{game.maxRounds}
                                </span>
                              )}
                              &nbsp;• Updated {moment(game.updatedAt).fromNow()}
                            </p>
                          </div>
                          <div className="hidden sm:flex -space-x-2 shrink-0">
                            {game.players.slice(0, 2).map((player, j) => (
                              <div
                                key={player.id}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-stone-800"
                                style={{ backgroundColor: player.color }}
                              >
                                <FaceAvatar
                                  seed={player.avatar || String(j + 1)}
                                  title={player.name || 'Player'}
                                />
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

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-stone-200 dark:border-stone-700">
                  <p className="text-sm text-stone-600 dark:text-stone-400 order-2 sm:order-1">
                    Showing{' '}
                    <span className="font-medium text-stone-950 dark:text-white">
                      {games.length === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, games.length)}
                    </span>{' '}
                    of <span className="font-medium">{games.length}</span>
                  </p>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-stone-600 dark:text-stone-400 tabular-nums px-2">
                      {safePage} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
