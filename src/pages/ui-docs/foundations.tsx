import React from 'react';
import { DocPage, Preview } from './DocPage';

const COLOR_TOKENS = [
  { name: 'Background', className: 'bg-background', var: '--background' },
  { name: 'Foreground', className: 'bg-foreground', var: '--foreground' },
  { name: 'Primary', className: 'bg-primary', var: '--primary' },
  { name: 'Secondary', className: 'bg-secondary', var: '--secondary' },
  { name: 'Muted', className: 'bg-muted', var: '--muted' },
  { name: 'Accent', className: 'bg-accent', var: '--accent' },
  { name: 'Destructive', className: 'bg-destructive', var: '--destructive' },
  { name: 'Card', className: 'bg-card', var: '--card' },
  { name: 'Popover', className: 'bg-popover', var: '--popover' },
  { name: 'Border', className: 'bg-border', var: '--border' },
];

export const ColorsDoc: React.FC = () => (
  <DocPage
    title="Colors"
    description="Semantic color tokens driven by CSS variables, so they adapt automatically between light and dark."
  >
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {COLOR_TOKENS.map((token) => (
        <div key={token.name} className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg border border-border shrink-0 ${token.className}`} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{token.name}</div>
            <div className="text-xs text-muted-foreground truncate">{token.var}</div>
          </div>
        </div>
      ))}
    </div>
  </DocPage>
);

export const TypographyDoc: React.FC = () => (
  <DocPage
    title="Typography"
    description="Zalando Sans for body text, Zalando Sans SemiExpanded for headings."
  >
    <div className="flex flex-col gap-3">
      <p className="font-heading text-3xl font-bold text-foreground">Heading font, 3xl bold</p>
      <p className="font-heading text-xl font-semibold text-foreground">Heading font, xl semibold</p>
      <p className="font-sans text-base text-foreground">Body font, base regular — used for most UI text.</p>
      <p className="font-sans text-sm text-muted-foreground">Body font, sm muted — used for secondary/help text.</p>
    </div>
  </DocPage>
);

export const RadiusDoc: React.FC = () => (
  <DocPage title="Radius" description="Border radius scale from --radius.">
    <Preview>
      <div className="h-16 w-16 rounded-sm bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">sm</div>
      <div className="h-16 w-16 rounded-md bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">md</div>
      <div className="h-16 w-16 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">lg</div>
    </Preview>
  </DocPage>
);
