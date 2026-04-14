import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

import 'react-day-picker/style.css';

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  min,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Track dark mode so we can swap the accent CSS variable
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.classList.contains('dark')
  );
  React.useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const validSelected = selected && isValid(selected) ? selected : undefined;
  const minDate = min ? parse(min, 'yyyy-MM-dd', new Date()) : undefined;
  const validMin = minDate && isValid(minDate) ? minDate : undefined;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  // Stone palette: stone-900 light / stone-300 dark for accent (chevrons, today, selected border)
  const rdpVars = {
    '--rdp-accent-color': isDark ? '#d6d3d1' : '#1c1917',
    '--rdp-accent-background-color': isDark ? '#44403c' : '#e7e5e4',
    '--rdp-day-height': '36px',
    '--rdp-day-width': '36px',
    '--rdp-day_button-height': '34px',
    '--rdp-day_button-width': '34px',
    '--rdp-nav_button-height': '2rem',
    '--rdp-nav_button-width': '2rem',
    '--rdp-nav-height': '2.25rem',
  } as React.CSSProperties;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg border transition-colors text-left',
          'border-input',
          'bg-card',
          validSelected
            ? 'text-foreground'
            : 'text-muted-foreground',
          'hover:border-ring',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">
          {validSelected ? format(validSelected, 'MMM d, yyyy') : placeholder}
        </span>
      </button>

      {/* Calendar popover */}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 rounded-xl border shadow-lg p-2',
            'border-border',
            'bg-card',
            'text-foreground',
          )}
        >
          <DayPicker
            mode="single"
            selected={validSelected}
            onSelect={handleSelect}
            disabled={validMin ? { before: validMin } : undefined}
            defaultMonth={validSelected ?? validMin}
            style={rdpVars}
          />
        </div>
      )}
    </div>
  );
}
