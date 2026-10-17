import { Column, Row, Section, Text } from 'react-email';
import * as React from 'react';
import { NotificationLayout, NotificationLinks, Paragraph, SITE_URL, previewLinks } from '../../components/NotificationLayout.js';

export interface SeasonEndedEmailProps extends NotificationLinks {
  leagueName: string;
  seasonName: string;
  champions: string[];
  standings: { rank: number; name: string; score: number }[];
  gamesPlayed: number;
  seasonUrl: string;
}

const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;

export const SeasonEndedEmail = ({ leagueName, seasonName, champions, standings, gamesPlayed, seasonUrl, ...links }: SeasonEndedEmailProps) => {
  const heading = champions.length === 0
    ? `${seasonName} has ended`
    : champions.length > 1
      ? `🏆 ${joinNames(champions)} shared ${seasonName}`
      : `🏆 ${champions[0]} won ${seasonName}`;
  return (
    <NotificationLayout
      preview={`${heading.replace('🏆 ', '')} in ${leagueName}`}
      heading={heading}
      cta={{ label: 'See final standings', href: seasonUrl }}
      reason={`You're getting this because you're a member of ${leagueName}.`}
      category="league update"
      {...links}
    >
      <Paragraph>
        {seasonName} of {leagueName} is in the books after {gamesPlayed} {gamesPlayed === 1 ? 'game' : 'games'}.
      </Paragraph>
      {standings.length > 0 && (
        <Section className="mt-4 rounded-xl border border-solid border-stone-200 px-4 py-2">
          {standings.map(row => (
            <Row key={`${row.rank}-${row.name}`}>
              <Column className="w-8">
                <Text className="text-stone-400 text-sm my-1">{row.rank}</Text>
              </Column>
              <Column>
                <Text className="text-stone-900 text-sm font-medium my-1">{row.name}</Text>
              </Column>
              <Column align="right">
                <Text className="text-stone-600 text-sm my-1">{row.score} pts</Text>
              </Column>
            </Row>
          ))}
        </Section>
      )}
    </NotificationLayout>
  );
};

SeasonEndedEmail.PreviewProps = {
  leagueName: 'Thursday Card Club',
  seasonName: 'Fall Season',
  champions: ['Amanda'],
  standings: [
    { rank: 1, name: 'Amanda', score: 940 },
    { rank: 2, name: 'Ryan', score: 910 },
    { rank: 3, name: 'Sam', score: 832 },
  ],
  gamesPlayed: 14,
  seasonUrl: `${SITE_URL}/leagues/example/seasons/example`,
  ...previewLinks,
} satisfies SeasonEndedEmailProps;

export default SeasonEndedEmail;
