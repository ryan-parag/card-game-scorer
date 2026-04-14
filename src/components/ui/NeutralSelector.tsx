import { cn } from '@/lib/utils';

export type NeutralKey =
  | 'stone' | 'slate' | 'gray' | 'zinc' | 'neutral'
  | 'olive' | 'mist' | 'mauve' | 'taupe';

const NEUTRALS: { key: NeutralKey; label: string; swatch: string }[] = [
  { key: 'stone',   label: 'Stone',   swatch: 'hsl(24 5.4% 63.9%)' },
  { key: 'slate',   label: 'Slate',   swatch: 'hsl(215 20.2% 65.1%)' },
  { key: 'gray',    label: 'Gray',    swatch: 'hsl(217.9 10.6% 64.9%)' },
  { key: 'zinc',    label: 'Zinc',    swatch: 'hsl(240 5% 64.9%)' },
  { key: 'neutral', label: 'Neutral', swatch: 'hsl(0 0% 63.9%)' },
  { key: 'olive',   label: 'Olive',   swatch: 'hsl(74 5% 63%)' },
  { key: 'mist',    label: 'Mist',    swatch: 'hsl(205 8% 65%)' },
  { key: 'mauve',   label: 'Mauve',   swatch: 'hsl(272 5% 63.5%)' },
  { key: 'taupe',   label: 'Taupe',   swatch: 'hsl(34 7% 63%)' },
];

interface NeutralSelectorProps {
  value: NeutralKey;
  onChange: (key: NeutralKey) => void;
}

export const NeutralSelector = ({ value, onChange }: NeutralSelectorProps) => {
  return (
    <div className="grid grid-cols-5 gap-x-2 gap-y-6 w-full mb-4">
      {NEUTRALS.map(({ key, label, swatch }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="relative flex flex-col items-center w-full px-1 py-2 gap-1.5 group rounded-lg transform group hover:bg-black/5 dark:hover:bg-white/5 group"
          title={label}
        >
          <span
            className={cn(
              'w-5 h-5 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all transform group-hover:scale-110 group-active:scale-95',
              value === key
                ? 'ring-foreground'
                : 'ring-transparent group-hover:ring-border'
            )}
            style={{ backgroundColor: swatch }}
          />
          <span className={cn(
            'absolute left-1/2 -translate-x-1/2 -bottom-4 text-xs transition-colors opacity-50 group-hover:opacity-100',
            value === key ? 'text-foreground font-medium' : 'text-foreground'
          )}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
