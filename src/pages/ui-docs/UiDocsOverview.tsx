import React from 'react';
import { Link } from 'react-router-dom';
import { Palette } from 'lucide-react';
import { PageHero } from '../../components/ui/PageHero';
import { docsRegistry, docGroups } from './registry';

export const UiDocsOverview: React.FC = () => (
  <div className="flex flex-col items-center w-full relative">
    <PageHero
      icon={<Palette className="h-10 w-10" aria-hidden />}
      title="UI Kit"
      subtitle="The components ScoreKeeper is built from"
    />
    <div className="flex flex-col gap-6 w-full mt-6">
      {docGroups.map((group) => (
        <div key={group}>
          <h2 className="text-sm font-bold text-muted-foreground mb-2">{group}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {docsRegistry
              .filter((entry) => entry.group === group)
              .map((entry) => (
                <Link
                  key={entry.slug}
                  to={`/ui/${entry.slug}`}
                  className="rounded-xl bg-secondary/60 hover:bg-secondary transition-colors px-4 py-3 text-sm font-medium text-foreground"
                >
                  {entry.label}
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
