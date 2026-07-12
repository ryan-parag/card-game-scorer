import HoverShim from './HoverShim';
import { tv } from 'tailwind-variants';

const tag = tv({
  base: 'h-6 transition transform relative inline-flex items-center overflow-hidden border text-center justify-center',
  variants: {
    color: {
      default: 'bg-gradient-to-b from-secondary to-muted text-foreground border border-black/20 dark:border-white/20',
      error: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/20',
      success: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      warning: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/20',
      secondary: 'bg-black/10 dark:bg-white/10 text-foreground transition-colors border-transparent',
      info: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20'
    },
    size: {
        default: 'h-6 text-sm px-1.5 font-medium gap-0.5 rounded-lg gap-1',
        sm: 'h-5 text-xs px-1.5 py-0.5 gap-1 rounded-md',
        lg: 'h-7 text-sm px-2 py-1 gap-1 rounded-lg font-semibold'
    },
    type: {
        default: '',
        link: 'user-select-none cursor-pointer group transition relative shadow-none hover:shadow-sm transform active:scale-[97%] active:shadow-inner'
    }
  },
  defaultVariants: {
    color: 'default',
    type: 'default',
    size: 'default'
  }
});

export const Tag = ({ children, color, title, type, size, leadingIcon, trailingIcon }: { children: React.ReactNode; color?: 'default' | 'error' | 'success' | 'warning'; title?: string; type?: 'default' | 'link'; size?: 'default' | 'sm' | 'lg'; leadingIcon?: React.ReactNode; trailingIcon?: React.ReactNode }) => {
    return(
        <span
            className={tag({ color, type, size })}
            title={title}
        >
            {leadingIcon && <div className="inline-flex items-center justify-center h-3.5 w-3.5">{leadingIcon}</div>}
            {children}
            {trailingIcon && <div className="inline-flex items-center justify-center h-3.5 w-3.5">{trailingIcon}</div>}
            {type === 'link' && <HoverShim/>}
        </span>
    )
}

export const TagLink = ({ href, children, color, title, type, size, leadingIcon, trailingIcon }: { href: string; children: React.ReactNode; color?: 'default' | 'error' | 'success' | 'warning'; title?: string, type?: 'default' | 'link'; size?: 'default' | 'sm' | 'lg'; leadingIcon?: React.ReactNode; trailingIcon?: React.ReactNode }) => {
    return(
        <a href={href} target="_blank"
            className={tag({ color, type, size })}
            title={title}
        >
            {leadingIcon && <div className="inline-flex items-center justify-center h-3.5 w-3.5">{leadingIcon}</div>}
            {children}
            {trailingIcon && <div className="h-3.5 w-3.5">{trailingIcon}</div>}
            <HoverShim/>
        </a>
    )
}