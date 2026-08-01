import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, X, ZoomIn } from 'lucide-react';
import moment from 'moment';
import { getSettings, saveSettings } from '../utils/storage';
import { Tag } from '../components/ui/tag';
import Topbar from '../components/ui/Topbar';
import BlurBg from '../components/ui/BlurBg';
import { changelogEntries, ChangelogCategory } from '../data/changelog';

const CATEGORY_LABEL: Record<ChangelogCategory, string> = {
  feature: 'New',
  improvement: 'Improved',
  fix: 'Fixed',
};

const CATEGORY_COLOR: Record<ChangelogCategory, 'default' | 'success' | 'warning'> = {
  feature: 'success',
  improvement: 'default',
  fix: 'warning',
};

const changelogScreenshots = import.meta.glob<{ default: string }>(
  '../assets/changelog/*.{png,jpg,jpeg,webp,gif}',
  { eager: true }
);

function getScreenshotUrl(filename?: string): string | undefined {
  if (!filename) return undefined;
  return changelogScreenshots[`../assets/changelog/${filename}`]?.default;
}

const changelogGroups: { month: string; entries: typeof changelogEntries }[] = [];
changelogEntries.forEach((entry) => {
  const month = moment(entry.date).format('MMMM YYYY');
  const lastGroup = changelogGroups[changelogGroups.length - 1];
  if (lastGroup && lastGroup.month === month) {
    lastGroup.entries.push(entry);
  } else {
    changelogGroups.push({ month, entries: [entry] });
  }
});

export const ChangelogPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    () => new Set(changelogGroups[0] ? [changelogGroups[0].month] : [])
  );

  const toggleMonth = (month: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-3xl mx-auto mt-16 flex flex-col items-center">
          <motion.div
            className="w-full max-w-sm flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-border bg-card/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px', rotate: 0 }}
            animate={{ opacity: 1, y: '48px', rotate: 2 }}
            exit={{ opacity: 0, y: '80px', rotate: 0 }}
            transition={{ duration: 0.24, delay: 0.4, type: 'spring', stiffness: 150 }}
          >
            <BlurBg />
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-secondary to-muted text-muted-foreground shadow-2xl shadow-border/50 border border-black/5 dark:border-white/5">
              <Sparkles className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
                Changelog
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                What's new, newest first
              </p>
            </div>
          </motion.div>
          <div className="flex flex-col gap-4 w-full">
            {changelogGroups.map((group) => {
              const isOpen = openMonths.has(group.month);
              return (
              <motion.div
                key={group.month}
                className="w-full relative z-10 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <button
                    type="button"
                    onClick={() => toggleMonth(group.month)}
                    className="transition flex items-center gap-2 w-full text-left p-4 lg:p-6 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <h2 className="text-sm font-bold text-muted-foreground">
                      {group.month}
                    </h2>
                    <span className="text-xs text-muted-foreground/70 font-normal">
                      ({group.entries.length})
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden px-4 lg:px-6 pb-4 lg:pb-6"
                      >
                        <div className="flex flex-col gap-6 mt-3">
                          {group.entries.map((entry, i) => {
                            const screenshotUrl = getScreenshotUrl(entry.screenshot);
                            return (
                              <motion.div
                                key={`${entry.date}-${entry.title}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.12, delay: 0.03 * i }}
                                className="flex flex-col gap-2 px-4 py-4 rounded-xl bg-secondary/60"
                              >
                                {screenshotUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setLightbox({ src: screenshotUrl, alt: entry.title })}
                                    className="group relative block w-full rounded-2xl overflow-hidden border border-border"
                                  >
                                    <img src={screenshotUrl} alt={entry.title} className="w-full h-auto block" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                )}
                                <div className="w-full shrink-0 text-xs text-muted-foreground">
                                  {moment(entry.date).format('MMM D')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="font-semibold text-foreground">
                                      {entry.title}
                                    </h3>
                                    <Tag size="sm" color={CATEGORY_COLOR[entry.category]}>
                                      {CATEGORY_LABEL[entry.category]}
                                    </Tag>
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-5">
                                    {entry.description}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-w-full max-h-full rounded-xl shadow-2xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
