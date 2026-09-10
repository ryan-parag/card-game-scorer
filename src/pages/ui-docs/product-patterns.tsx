import React from 'react';
import { Link } from 'react-router-dom';
import { Loader, Plus, CircleUserRound } from 'lucide-react';
import { DocPage } from './DocPage';
import { Button } from '../../components/ui/button';
import { Panel } from '../../components/ui/Panel';

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <div>
    <h2 className="font-heading text-lg font-bold text-foreground mb-1">{title}</h2>
    {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
    <div className="flex flex-col gap-4 mt-3">{children}</div>
  </div>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <pre className="text-xs bg-secondary/60 rounded-lg p-3 overflow-x-auto text-muted-foreground">
    <code>{children}</code>
  </pre>
);

export const ProductPatternsDoc: React.FC = () => (
  <DocPage
    title="Product Patterns"
    description="Recurring compositions used across ScoreKeeper's pages — reuse these instead of reinventing a layout per screen."
  >
    <Section
      title="Page header"
      description="Every top-level page opens with a Page Hero: an icon square, a title, and a one-line subtitle. It sets the page's color and establishes hierarchy before anything else on screen."
    >
      <Code>{`<PageHero
  icon={<Trophy className="h-10 w-10" />}
  color="indigo"
  title="Leagues"
  subtitle="Play with friends in seasons"
/>`}</Code>
      <p className="text-xs text-muted-foreground">See the <Link to="/ui/page-hero" className="underline text-foreground">Page Hero</Link> doc.</p>
    </Section>

    <Section
      title="Panel sections"
      description="Content below the header is grouped into Panels — a card with its own heading, used for anything from a settings block to a list. Stack multiple panels rather than building one long unstructured page."
    >
      <Panel padding="md" animate={false} className="max-w-sm">
        <h3 className="text-base font-bold text-card-foreground mb-2">Invites</h3>
        <p className="text-sm text-muted-foreground mb-3">Invite someone to join ScoreKeeper.</p>
        <Button size="sm" variant="secondary" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New
        </Button>
      </Panel>
      <Code>{`<Panel padding="md">
  <h2 className="text-lg font-bold text-card-foreground mb-4">Invites</h2>
  {/* section content */}
</Panel>`}</Code>
    </Section>

    <Section
      title="List rows"
      description="Friends, invites, players, and league members all render as the same row shape: a small avatar, a name that links out, and trailing action buttons — never a full card per item."
    >
      <Panel padding="md" animate={false} className="max-w-sm">
        <ul className="flex flex-col gap-2">
          <li className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                <CircleUserRound className="w-full h-full p-1 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground truncate">Jordan</span>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="secondary">Accept</Button>
            </div>
          </li>
        </ul>
      </Panel>
      <Code>{`<li className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-2 min-w-0">
    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">…</div>
    <Link to={\`/u/\${id}\`} className="text-sm text-muted-foreground hover:text-foreground truncate">
      {name}
    </Link>
  </div>
  <div className="flex gap-1 shrink-0">{/* actions */}</div>
</li>`}</Code>
    </Section>

    <Section
      title="Async states"
      description="Loading, empty, and error states follow the same three treatments everywhere: a small spinning Loader with muted text while fetching, a muted one-line message when a list is empty, and red text below the control that failed."
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    </Section>

    <Section
      title="Bottom action bar"
      description="Setup, scoring, and summary flows put their primary action in a Fixed Action Bar docked to the bottom of the viewport, instead of an inline button at the end of the page."
    >
      <p className="text-xs text-muted-foreground">See the <Link to="/ui/fixed-action-bar" className="underline text-foreground">Fixed Action Bar</Link> doc.</p>
    </Section>
  </DocPage>
);
