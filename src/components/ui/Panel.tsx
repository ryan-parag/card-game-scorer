import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type PanelBorder = 'default' | 'subtle' | 'none';
export type PanelPadding = 'none' | 'sm' | 'md' | 'lg';

const BORDER_CLASSES: Record<PanelBorder, string> = {
  default: 'border border-border',
  subtle: 'border border-black/5 dark:border-white/5',
  none: '',
};

const PADDING_CLASSES: Record<PanelPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-4 lg:p-6',
  lg: 'p-4 lg:p-8',
};

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: PanelBorder;
  padding?: PanelPadding;
  animate?: boolean;
  delay?: number;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ border = 'default', padding = 'lg', animate = true, delay = 0, className, children, ...props }, ref) => {
    const classes = cn(
      'bg-card rounded-2xl shadow-xl',
      BORDER_CLASSES[border],
      PADDING_CLASSES[padding],
      className
    );

    if (!animate) {
      return (
        <div ref={ref} className={classes} {...props}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={classes}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay }}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);
Panel.displayName = 'Panel';
