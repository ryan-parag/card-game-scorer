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

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <div>
    <h2 className="font-heading text-lg font-bold text-foreground mb-1">{title}</h2>
    {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
    <div className="mt-3">{children}</div>
  </div>
);

export const FoundationsDoc: React.FC = () => (
  <DocPage
    title="Foundations"
    description="The tokens and scales every screen is built from — colors, type, and radius."
  >
    <Section
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
    </Section>

    <Section title="Typography" description="Zalando Sans for body text, Zalando Sans SemiExpanded for headings.">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-2 justify-between py-2 border-b border-black/10 dark:border-white/10">
          <span className="font-heading text-3xl font-bold text-foreground">Title</span>
          <code className="text-xs text-muted-foreground">text-3xl text-foreground font-heading font-bold</code>
        </div>
        <div className="flex flex-col lg:flex-row gap-2 justify-between py-2 border-b border-black/10 dark:border-white/10">
          <span className="font-heading text-xl font-bold text-foreground">Heading</span>
          <code className="text-xs text-muted-foreground">text-xl text-foreground font-heading font-bold</code>
        </div>
        <div className="flex flex-col lg:flex-row gap-2 justify-between py-2 border-b border-black/10 dark:border-white/10">
          <span className="font-body text-base text-foreground">Body</span>
          <code className="text-xs text-muted-foreground">text-base text-foreground font-body</code>
        </div>
        <div className="flex flex-col lg:flex-row gap-2 justify-between py-2 border-b border-black/10 dark:border-white/10">
          <span className="font-body text-sm text-muted-foreground">Small</span>
          <code className="text-xs text-muted-foreground">text-sm text-muted-foreground font-body</code>
        </div>
      </div>
    </Section>

    <Section title="Radius" description="Border radius scale from --radius.">
      <Preview>
        <div className="h-16 w-16 rounded-sm bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">sm</div>
        <div className="h-16 w-16 rounded-md bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">md</div>
        <div className="h-16 w-16 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">lg</div>
      </Preview>
    </Section>
  </DocPage>
);
