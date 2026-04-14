import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CircleDashed, Check, History, Loader } from 'lucide-react';
import moment from 'moment';
import { Game } from '../types/game';
import { getGames, getSettings, saveSettings } from '../utils/storage';
import { Button } from '../components/ui/button';
import Topbar from '../components/ui/Topbar';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import BlurBg from '../components/ui/BlurBg';
import HoverShim from '@/components/ui/HoverShim';

const PAGE_SIZE = 10;

export const GameHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Initialize page from URL query params, default to 1
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const [page, setPageState] = useState(Math.max(1, pageFromUrl));

  // Sync page changes to URL
  const setPage = (newPage: number | ((p: number) => number)) => {
    const resolvedPage = typeof newPage === 'function' ? newPage(page) : newPage;
    setPageState(resolvedPage);
    setSearchParams({ page: Math.max(1, resolvedPage).toString() }, { replace: true });
  };

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
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [games.length]); // Only depend on games.length, not page or totalPages

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
    navigate(`/game/${game.id}`);
  };

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center">
          <motion.div
            className="w-full max-w-sm flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-border bg-card/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px', rotate: 0 }}
            animate={{ opacity: 1, y: '48px', rotate: 2 }}
            exit={{ opacity: 0, y: '80px', rotate: 0 }}
            transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
          >
            <BlurBg/>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-secondary to-muted text-muted-foreground shadow-2xl shadow-border/50 border border-black/5 dark:border-white/5">
              <History className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
                Game history
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                All saved games, newest first
              </p>
            </div>
          </motion.div>

          <motion.div
            className="w-full relative z-10 bg-card rounded-2xl shadow-xl p-4 lg:p-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="text-center flex flex-col items-center py-12">
                <Loader className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                <p className="text-muted-foreground text-sm">Loading games…</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
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
                        className="overflow-hidden relative w-full text-left bg-secondary hover:bg-muted h-auto py-4 px-3 lg:px-4 group"
                      >
                        <HoverShim/>
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
                            <h3 className="font-medium text-foreground truncate">
                              {game.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {game.players.length} players •{' '}
                              {game.status === 'completed' ? (
                                <span className="text-muted-foreground">
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
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-background overflow-hidden"
                                style={{ backgroundColor: player.color }}
                              >
                                <PlayerAvatar
                                  player={player}
                                  index={j}
                                  avatarStyle={game.avatarStyle}
                                />
                              </div>
                            ))}
                            {game.players.length > 2 && (
                              <div className="w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-background">
                                +{game.players.length - 2}
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground order-2 sm:order-1">
                    Showing{' '}
                    <span className="font-medium text-foreground">
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
                    <span className="text-sm text-muted-foreground tabular-nums px-2">
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
