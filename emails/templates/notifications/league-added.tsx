import * as React from 'react';
import { NotificationLayout, NotificationLinks, Paragraph, SITE_URL, previewLinks } from '../../components/NotificationLayout.js';

export interface LeagueAddedEmailProps extends NotificationLinks {
  leagueName: string;
  addedByName: string | null;
  memberCount: number;
  leagueUrl: string;
}

export const LeagueAddedEmail = ({ leagueName, addedByName, memberCount, leagueUrl, ...links }: LeagueAddedEmailProps) => (
  <NotificationLayout
    preview={`You're in ${leagueName}`}
    heading={`You've been added to ${leagueName}`}
    cta={{ label: 'Open league', href: leagueUrl }}
    reason={`You're getting this because you're a member of ${leagueName}.`}
    category="league update"
    {...links}
  >
    <Paragraph>
      {addedByName ? `${addedByName} added you to the league` : 'You were added to the league'}
      {memberCount > 1 ? `, joining ${memberCount - 1} other ${memberCount - 1 === 1 ? 'player' : 'players'}` : ''}.
      Games you play in the league will count toward its seasons and standings.
    </Paragraph>
  </NotificationLayout>
);

LeagueAddedEmail.PreviewProps = {
  leagueName: 'Thursday Card Club',
  addedByName: 'Ryan',
  memberCount: 6,
  leagueUrl: `${SITE_URL}/leagues/example`,
  ...previewLinks,
} satisfies LeagueAddedEmailProps;

export default LeagueAddedEmail;
