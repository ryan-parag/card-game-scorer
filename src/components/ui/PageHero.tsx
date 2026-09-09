import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import BlurBg from './BlurBg';

export type PageHeroColor = 'neutral' | 'indigo' | 'yellow' | 'teal' | 'rose' | 'violet';

const COLOR_CLASSES: Record<PageHeroColor, string> = {
  neutral: 'bg-gradient-to-b from-secondary to-muted text-muted-foreground shadow-2xl shadow-border/50 border border-black/5 dark:border-white/5',
  indigo: 'bg-gradient-to-b from-indigo-400 to-indigo-700 text-white shadow-2xl shadow-indigo-500/50 border border-indigo-500 dark:border-indigo-800',
  yellow: 'bg-gradient-to-b from-yellow-400 to-yellow-700 text-white shadow-2xl shadow-yellow-500/50 border border-yellow-500 dark:border-yellow-800',
  teal: 'bg-gradient-to-b from-teal-400 to-teal-700 text-white shadow-2xl shadow-teal-500/50 border border-teal-500 dark:border-teal-800',
  rose: 'bg-gradient-to-b from-rose-400 to-rose-700 text-white shadow-2xl shadow-rose-500/50 border border-rose-500 dark:border-rose-800',
  violet: 'bg-gradient-to-b from-violet-400 to-violet-700 text-white shadow-2xl shadow-violet-500/50 border border-violet-500 dark:border-violet-800',
};

export interface PageHeroProps {
  icon: React.ReactNode;
  color?: PageHeroColor;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  compact?: boolean;
  fullWidth?: boolean;
  beforeTitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({
  icon,
  color = 'neutral',
  title,
  subtitle,
  compact = false,
  fullWidth = false,
  beforeTitle,
  children,
  className,
}) => (
  <motion.div
    className={cn(
      'w-full flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-border bg-card/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden',
      !fullWidth && 'max-w-sm',
      className
    )}
    initial={{ opacity: 0, y: '80px', rotate: 0 }}
    animate={{ opacity: 1, y: '48px', rotate: 2 }}
    exit={{ opacity: 0, y: '80px', rotate: 0 }}
    transition={{ duration: 0.24, delay: 0.4, type: 'spring', stiffness: 150 }}
  >
    <BlurBg />
    <div className={cn('flex h-16 w-16 items-center justify-center rounded-xl', COLOR_CLASSES[color])}>
      {icon}
    </div>
    <div>
      {beforeTitle}
      <h1 className={cn('font-bold text-foreground mb-1', compact ? 'text-lg md:text-2xl' : 'text-2xl md:text-4xl')}>
        {title}
      </h1>
      {subtitle && <p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);
