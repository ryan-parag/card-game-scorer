import * as React from 'react';
import { NotificationLayout, NotificationLinks, Paragraph, SITE_URL, previewLinks } from '../../components/NotificationLayout.js';

export interface SeasonStartedEmailProps extends NotificationLinks {
  leagueName: string;
  seasonName: string;
  // Already formatted, e.g. "Monday, Oct 20".
  startDate: string;
  endDate: string | null;
  hasStarted: boolean;
  seasonUrl: string;
}

export const SeasonStartedEmail = ({ leagueName, seasonName, startDate, endDate, hasStarted, seasonUrl, ...links }: SeasonStartedEmailProps) => (
  <NotificationLayout
    preview={`${seasonName} ${hasStarted ? 'has started' : `starts ${startDate}`} in ${leagueName}`}
    heading={hasStarted ? `${seasonName} has started` : `${seasonName} starts ${startDate}`}
    cta={{ label: 'View season', href: seasonUrl }}
    reason={`You're getting this because you're a member of ${leagueName}.`}
    category="league update"
    {...links}
  >
    <Paragraph>
      A new season of {leagueName} {hasStarted ? 'is underway' : 'is on the calendar'}
      {endDate ? `, running until ${endDate}` : ''}. Everyone starts at zero, so every game counts.
    </Paragraph>
  </NotificationLayout>
);

SeasonStartedEmail.PreviewProps = {
  leagueName: 'Thursday Card Club',
  seasonName: 'Winter Season',
  startDate: 'Monday, Oct 20',
  endDate: 'Saturday, Jan 31',
  hasStarted: false,
  seasonUrl: `${SITE_URL}/leagues/example/seasons/example`,
  ...previewLinks,
} satisfies SeasonStartedEmailProps;

export default SeasonStartedEmail;
