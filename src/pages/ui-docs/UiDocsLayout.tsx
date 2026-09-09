import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSettings, saveSettings } from '../../utils/storage';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { NEUTRALS, NeutralKey } from '../../components/ui/NeutralSelector';
import { docsRegistry, docGroups } from './registry';
import { ScorekeeperLogo } from '@/components/ui/ScorekeeperLogo';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block px-3 py-1.5 rounded-lg text-sm transition-colors truncate',
    isActive
      ? 'bg-secondary text-foreground font-medium'
      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
  );

export const UiDocsLayout: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [neutral, setNeutral] = useState<NeutralKey>('stone');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    setNeutral((settings.neutral as NeutralKey) || 'stone');
  }, []);

  const handleThemeChange = (value: string) => {
    const next = value === 'dark';
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  const handleNeutralChange = (value: string) => {
    const key = value as NeutralKey;
    setNeutral(key);
    document.documentElement.setAttribute('data-neutral', key);
    saveSettings({ neutral: key });
  };

  const navContent = (
    <>
      <div className="flex flex-col gap-2">
        <NavLink to={'/'}>
          <div className="transition flex justify-start items-center w-full gap-4 mb-4 rounded-lg hover:underline">
            <ScorekeeperLogo size="sm" noAnimate/>
            <strong>ScoreKeeper UI</strong>
          </div>
        </NavLink>
        <Select value={isDark ? 'dark' : 'light'} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
        <Select value={neutral} onValueChange={handleNeutralChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Neutral" />
          </SelectTrigger>
          <SelectContent>
            {NEUTRALS.map(({ key, label, swatch }) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: swatch }}
                  />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <NavLink to="/ui" end className={navLinkClasses} onClick={() => setNavOpen(false)}>
        Overview
      </NavLink>
      {docGroups.map((group) => (
        <div key={group}>
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 mb-1">
            {group}
          </div>
          <div className="flex flex-col gap-px">
            {docsRegistry
              .filter((entry) => entry.group === group)
              .map((entry) => (
                <NavLink
                  key={entry.slug}
                  to={`/ui/${entry.slug}`}
                  className={navLinkClasses}
                  onClick={() => setNavOpen(false)}
                >
                  {entry.label}
                </NavLink>
              ))}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="relative min-h-screen w-full">
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-8 px-4 pb-32">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-8 flex flex-col gap-6">{navContent}</div>
          </aside>

          <main className="flex-1 min-w-0">
            <header className="flex lg:hidden items-center justify-between mb-6">

              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label="Open navigation"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </header>

            <AnimatePresence>
              {navOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setNavOpen(false)}
                  />
                  <motion.aside
                    className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl p-4 overflow-y-auto lg:hidden"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <div className="flex items-center justify-end mb-2">
                      <button
                        type="button"
                        onClick={() => setNavOpen(false)}
                        aria-label="Close navigation"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-6">{navContent}</div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            <div className="bg-card border border-border rounded-2xl shadow-xl p-4 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
