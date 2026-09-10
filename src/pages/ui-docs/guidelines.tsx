import React from 'react';
import { Link } from 'react-router-dom';
import { DocPage } from './DocPage';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h2 className="font-heading text-lg font-bold text-foreground mb-2">{title}</h2>
    <div className="flex flex-col gap-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

const List: React.FC<{ items: { label: string; body: string }[] }> = ({ items }) => (
  <ul className="flex flex-col gap-2">
    {items.map((item) => (
      <li key={item.label}>
        <span className="text-foreground font-medium">{item.label}</span> — {item.body}
      </li>
    ))}
  </ul>
);

export const GuidelinesDoc: React.FC = () => (
  <DocPage
    title="Design Guidelines"
    description="How to design new ScoreKeeper screens so they feel like part of the same app."
  >
    <Section title="Start from the product">
      <p>
        Before building something new, look at existing screens with a similar purpose — setup, scoring, and
        summary flows all share the same bones. Reuse their composition rather than inventing a new layout.
        Import components from <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">@/components/ui</code>{' '}
        and icons from <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">lucide-react</code> rather than
        writing one-off markup.
      </p>
    </Section>

    <Section title="Principles">
      <List
        items={[
          {
            label: 'Score and players first',
            body: 'the current score, whose turn it is, and the next action should be the most visually prominent things on screen.',
          },
          {
            label: 'Clear hierarchy',
            body: 'lean on the Page Hero, spacing, and the type scale to establish hierarchy — not extra colors or borders.',
          },
          {
            label: 'Purposeful density',
            body: 'game setup and scoring happen fast, often one-handed on mobile. Keep primary actions large and reachable; use the Fixed Action Bar for the primary action on a screen.',
          },
          {
            label: 'Familiar interactions',
            body: 'a component should behave the way its type implies — buttons act, tags label, tooltips explain. Don’t repurpose one component to do another’s job.',
          },
          {
            label: 'Accessible by default',
            body: 'every interactive element needs a visible focus state, sufficient contrast in both themes, and a touch target large enough for mobile play.',
          },
        ]}
      />
    </Section>

    <Section title="Component defaults">
      <p>
        Start with a component's default variant and shared styles before reaching for a custom one. Compose
        existing components (Button, Tag, Panel, FixedActionBar) before adding new variants — most screens in
        ScoreKeeper are combinations of the same handful of primitives, not bespoke UI.
      </p>
    </Section>

    <Section title="Color and themes">
      <p>
        Use semantic tokens, not raw colors, so screens adapt automatically between light and dark and across the
        neutral palettes: <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">background</code>/
        <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">foreground</code> for the page,{' '}
        <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">card</code>/
        <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">popover</code> for surfaces,{' '}
        <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">muted-foreground</code> for secondary text,
        and <code className="text-xs bg-secondary/60 px-1 py-0.5 rounded">border</code> for dividers. See{' '}
        <Link to="/ui/foundations" className="underline text-foreground">Foundations</Link>.
      </p>
    </Section>

    <Section title="Type and spacing">
      <p>
        Zalando Sans SemiExpanded for headings, Zalando Sans for body text — keep to the existing type scale
        rather than introducing one-off sizes. See <Link to="/ui/foundations" className="underline text-foreground">Foundations</Link>.
        For spacing, follow the app's rhythm (multiples of 4) and check that longer player names or scores don't
        break the layout.
      </p>
    </Section>

    <Section title="Product patterns and sources">
      <List
        items={[
          { label: 'Page Hero', body: 'the icon-square header at the top of most pages — src/components/ui/PageHero.tsx.' },
          { label: 'Fixed Action Bar', body: 'the pill of primary actions docked to the bottom of setup, scoring, and summary screens — src/components/ui/FixedActionBar.tsx.' },
          { label: 'Avatars', body: 'TextAvatar / FaceAvatar for representing players — src/components/ui/.' },
          { label: 'Theme Toggle & Neutral Selector', body: 'the two controls that drive the app-wide theme — src/components/ui/ThemeToggle.tsx, NeutralSelector.tsx.' },
        ]}
      />
    </Section>

    <Section title="States and copy">
      <p>
        Every interactive element needs its states designed: default, hover, active, disabled, and loading where
        relevant. Write copy the way a scorekeeper would say it out loud — direct and action-oriented ("Add
        Player", "Next Round") — not ornamental or vague ("Let's get started!").
      </p>
    </Section>

    <Section title="Review in context">
      <p>
        Before shipping, compare the new screen against neighboring pages in the same flow, and check it in both
        themes, on mobile widths, and via keyboard navigation.
      </p>
    </Section>
  </DocPage>
);
