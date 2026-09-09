import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { getSettings, saveSettings } from '../../utils/storage';
import { DocPage, Preview } from './DocPage';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { NeutralSelector, NeutralKey } from '../../components/ui/NeutralSelector';
import { TextAvatar } from '../../components/ui/TextAvatar';
import { FaceAvatar } from '../../components/ui/FaceAvatar';
import { PageHero } from '../../components/ui/PageHero';

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
        subtitle="Top 10 scores across completed games"
        className="mb-0"
      />
    </div>
  </DocPage>
);

export const AvatarsDoc: React.FC = () => (
  <DocPage title="Avatars" description="TextAvatar and FaceAvatar from src/components/ui/">
    <Preview>
      <TextAvatar name="Ryan" className="h-10 w-10 rounded-full bg-primary" />
      <FaceAvatar seed="ryan" title="Ryan" className="h-10 w-10 rounded-full" />
      <FaceAvatar seed="jordan" title="Jordan" className="h-10 w-10 rounded-full" />
    </Preview>
  </DocPage>
);
