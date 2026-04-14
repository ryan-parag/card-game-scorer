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
    <div className="grid grid-cols-6 gap-2 w-full">
      {NEUTRALS.map(({ key, label, swatch }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="flex flex-col items-center gap-1.5 group rounded-lg transform group"
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
            'text-xs transition-colors',
            value === key ? 'text-foreground font-medium' : 'text-muted-foreground'
          )}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
