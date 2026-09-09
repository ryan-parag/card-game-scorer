import { motion, type Transition } from 'framer-motion';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  5: 'grid-cols-5',
} as const;

const COL_SPAN = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  5: 'col-span-5',
} as const;

interface FixedActionBarProps {
  children: ReactNode;
  columns: keyof typeof COLUMNS;
  /** Visual style: 'solid' matches the dark gradient pill used on setup/launch flows, 'subtle' matches the lighter card-toned pill used on the game summary. */
  variant?: 'solid' | 'subtle';
  maxWidth?: string;
  minWidth?: string;
  className?: string;
  /** Tailwind z-index class, e.g. 'z-20'. */
  zIndexClassName?: string;
  transitionDelay?: number;
}

const baseTransition: Omit<Transition, 'delay'> = {
  duration: 0.12,
  type: 'spring',
  stiffness: 180,
};

export function FixedActionBar({
  children,
  columns,
  variant = 'solid',
  maxWidth = '320px',
  minWidth,
  className,
  zIndexClassName,
  transitionDelay = 0.2,
}: FixedActionBarProps) {
  return (
    <motion.div
      className={cn(
        'grid gap-0 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full overflow-hidden w-full lg:w-auto',
        COLUMNS[columns],
        variant === 'solid'
          ? 'fixed-button'
          : 'bg-card/50 border border-border backdrop-blur-md shadow-xl shadow-foreground/10',
        zIndexClassName,
        className,
      )}
      style={{ maxWidth, minWidth }}
      initial={{ opacity: 0, bottom: 0 }}
      animate={{ opacity: 1, bottom: '8px' }}
      exit={{ opacity: 0, bottom: 0 }}
      transition={{ ...baseTransition, delay: transitionDelay }}
    >
      {children}
    </motion.div>
  );
}

interface FixedActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'subtle';
  colSpan?: keyof typeof COL_SPAN;
  /** Divider border on the side that touches the previous segment. */
  divider?: 'left' | 'right' | 'none';
}

export function FixedActionButton({
  variant = 'solid',
  colSpan,
  divider = 'none',
  className,
  children,
  ...buttonProps
}: FixedActionButtonProps) {
  return (
    <button
      {...buttonProps}
      className={cn(
        'transition p-4 flex items-center justify-center disabled:opacity-40 active:shadow-inner',
        variant === 'solid' ? 'fixed-button-inner' : 'hover:bg-foreground/10',
        colSpan && COL_SPAN[colSpan],
        divider === 'left' && 'border-l border-white/10 dark:border-black/10',
        divider === 'right' && 'border-r border-white/10 dark:border-black/10',
        className,
      )}
    >
      {children}
    </button>
  );
}
