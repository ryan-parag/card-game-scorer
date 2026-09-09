import React, { useState } from 'react';
import { Trophy, BadgePlus, ChevronRight, Home, Repeat } from 'lucide-react';
import { getSettings, saveSettings } from '../../utils/storage';
import { DocPage, Preview } from './DocPage';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { NeutralSelector, NeutralKey } from '../../components/ui/NeutralSelector';
import { TextAvatar } from '../../components/ui/TextAvatar';
import { FaceAvatar } from '../../components/ui/FaceAvatar';
import { PageHero } from '../../components/ui/PageHero';
import { FixedActionBar, FixedActionButton } from '../../components/ui/FixedActionBar';

// FixedActionBar is `position: fixed` in real usage (it docks to the bottom of the
// viewport). For the docs preview it's un-fixed so it lays out inline inside the card
// instead of pinning to the bottom of this page.
const unfixed = 'static left-auto bottom-auto translate-x-0 translate-y-0 mx-auto';

export const ThemeToggleDoc: React.FC = () => {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    saveSettings({ theme: next ? 'dark' : 'light' });
  };
  return (
    <DocPage title="Theme Toggle" description="src/components/ui/ThemeToggle.tsx — also controls the whole app's theme.">
      <Preview>
        <ThemeToggle toggleTheme={toggleTheme} isDark={isDark} />
      </Preview>
    </DocPage>
  );
};

export const NeutralSelectorDoc: React.FC = () => {
  const [neutral, setNeutral] = useState<NeutralKey>(getSettings().neutral || 'stone');
  const handleChange = (key: NeutralKey) => {
    setNeutral(key);
    document.documentElement.setAttribute('data-neutral', key);
    saveSettings({ neutral: key });
  };
  return (
    <DocPage title="Neutral Selector" description="src/components/ui/NeutralSelector.tsx — picks the app's neutral color palette.">
      <div className="rounded-xl bg-secondary/60 p-6">
        <NeutralSelector value={neutral} onChange={handleChange} />
      </div>
    </DocPage>
  );
};

export const PageHeroDoc: React.FC = () => (
  <DocPage title="Page Hero" description="src/components/ui/PageHero.tsx — the icon-square header used at the top of most pages, this docs site included.">
    <div className="rounded-xl bg-secondary/60 p-6 flex justify-center">
      <PageHero
        icon={<Trophy className="h-10 w-10" aria-hidden />}
        color="yellow"
        title="Leaderboard"
        subtitle="This is a description"
        className="mb-0"
        animated={false}
      />
    </div>
  </DocPage>
);

export const FixedActionBarDoc: React.FC = () => (
  <DocPage
    title="Fixed Action Bar"
    description="src/components/ui/FixedActionBar.tsx — the pill of buttons docked to the bottom of the screen on setup, scoring, and summary pages. Shown here un-fixed so it lays out inline; in the app it's pinned to the bottom of the viewport."
  >
    <Preview className="flex-col items-stretch">
      <p className="text-xs text-muted-foreground -mt-2 mb-2">Single button, 5 columns — launch screen / new game</p>
      <FixedActionBar columns={5} minWidth="320px" className={unfixed}>
        <FixedActionButton colSpan={5}>
          <BadgePlus className="w-6 h-6" />
          <span className="ml-2 font-semibold">New Game</span>
        </FixedActionButton>
      </FixedActionBar>
    </Preview>

    <Preview className="flex-col items-stretch">
      <p className="text-xs text-muted-foreground -mt-2 mb-2">Two segments with a divider — score interface</p>
      <FixedActionBar columns={3} maxWidth="340px" minWidth="280px" className={unfixed}>
        <FixedActionButton divider="right">
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span className="ml-1 font-semibold">Previous</span>
        </FixedActionButton>
        <FixedActionButton colSpan={2}>
          <span className="mr-1 font-semibold">Next Round</span>
          <ChevronRight className="w-5 h-5" />
        </FixedActionButton>
      </FixedActionBar>
    </Preview>

    <Preview className="flex-col items-stretch">
      <p className="text-xs text-muted-foreground -mt-2 mb-2">variant="subtle" with three segments — game summary</p>
      <FixedActionBar columns={3} variant="subtle" maxWidth="380px" className={unfixed}>
        <FixedActionButton variant="subtle">
          <Home className="w-6 h-6" />
          <span className="ml-2 font-medium">Home</span>
        </FixedActionButton>
        <FixedActionButton variant="subtle" className="border-x border-x-border">
          <BadgePlus className="w-6 h-6" />
          <span className="ml-2 font-medium">New</span>
        </FixedActionButton>
        <FixedActionButton variant="subtle">
          <Repeat className="w-6 h-6" />
          <span className="ml-2 font-medium">Restart</span>
        </FixedActionButton>
      </FixedActionBar>
    </Preview>

    <Preview className="flex-col items-stretch">
      <p className="text-xs text-muted-foreground -mt-2 mb-2">Disabled state</p>
      <FixedActionBar columns={1} minWidth="320px" className={unfixed}>
        <FixedActionButton disabled>
          <span className="ml-2 font-medium">Continue to Players</span>
        </FixedActionButton>
      </FixedActionBar>
    </Preview>
  </DocPage>
);

export const AvatarsDoc: React.FC = () => (
  <DocPage title="Avatars" description="TextAvatar and FaceAvatar from src/components/ui/">
    <Preview>
      <div className="relative h-10 w-10">
        <TextAvatar name="Ryan" className="h-10 w-10 rounded-full text-emerald-700 dark:text-emerald-500 bg-emerald-500/20" />
      </div>
      <div className="relative h-10 w-10">
        <FaceAvatar seed="ryan" title="Ryan" className="h-10 w-10 rounded-full" />
      </div>
      <div className="relative h-10 w-10">
        <FaceAvatar seed="jordan" title="Jordan" className="h-10 w-10 rounded-full" />
      </div>
    </Preview>
  </DocPage>
);
