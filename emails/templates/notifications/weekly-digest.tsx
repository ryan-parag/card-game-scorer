import { Heading, Link, Section, Text } from 'react-email';
import * as React from 'react';
import { NotificationLayout, NotificationLinks, Paragraph, SITE_URL, previewLinks } from '../../components/NotificationLayout.js';

export interface DigestLeague {
  name: string;
  url: string;
  gamesThisWeek: number;
  // Most wins this week.
  topWinners: { names: string[]; wins: number } | null;
  // Your games and wins this week in this league.
  yourGames: number;
  yourWins: number;
  season: {
    name: string;
    url: string;
    leaders: string[];
    yourRank: number | null;
    playerCount: number;
    endsInDays: number | null;
  } | null;
}

export interface WeeklyDigestEmailProps extends NotificationLinks {
  weekLabel: string;
  leagues: DigestLeague[];
}

const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export const WeeklyDigestEmail = ({ weekLabel, leagues, ...links }: WeeklyDigestEmailProps) => {
  const totalGames = leagues.reduce((sum, l) => sum + l.gamesThisWeek, 0);
  return (
    <NotificationLayout
      preview={`${totalGames} league ${totalGames === 1 ? 'game' : 'games'} this week — here's where things stand`}
      heading="Your week in ScoreKeeper"
      cta={{ label: 'Open ScoreKeeper', href: `${SITE_URL}/leagues` }}
      reason="You're getting this weekly summary because your leagues played games this week."
      category="weekly digest"
      {...links}
    >
      <Paragraph>{weekLabel}</Paragraph>
      {leagues.map(league => (
        <Section key={league.url} className="mt-4 rounded-xl border border-solid border-stone-200 px-5 py-3">
          <Heading as="h2" className="text-stone-900 text-base font-bold mt-1 mb-1">
            <Link href={league.url} className="text-stone-900 no-underline">{league.name}</Link>
          </Heading>
          <Text className="text-stone-600 text-sm my-1">
            {league.gamesThisWeek} {league.gamesThisWeek === 1 ? 'game' : 'games'} played
            {league.topWinners ? ` · Most wins: ${joinNames(league.topWinners.names)} (${league.topWinners.wins})` : ''}
          </Text>
          {league.yourGames > 0 && (
            <Text className="text-stone-600 text-sm my-1">
              You played {league.yourGames} and won {league.yourWins}.
            </Text>
          )}
          {league.season && (
            <Text className="text-stone-600 text-sm my-1">
              <Link href={league.season.url} className="text-stone-900 underline">{league.season.name}</Link>
              {league.season.leaders.length > 0 ? `: ${joinNames(league.season.leaders)} ${league.season.leaders.length > 1 ? 'share the lead' : 'leads'}` : ''}
              {league.season.yourRank ? `, you're ${ordinal(league.season.yourRank)} of ${league.season.playerCount}` : ''}
              {league.season.endsInDays !== null && league.season.endsInDays <= 14
                ? ` · ends in ${league.season.endsInDays} ${league.season.endsInDays === 1 ? 'day' : 'days'}`
                : ''}
              .
            </Text>
          )}
        </Section>
      ))}
    </NotificationLayout>
  );
};

WeeklyDigestEmail.PreviewProps = {
  weekLabel: 'Oct 12 – Oct 18',
  leagues: [
    {
      name: 'Thursday Card Club',
      url: `${SITE_URL}/leagues/example`,
      gamesThisWeek: 5,
      topWinners: { names: ['Amanda'], wins: 3 },
      yourGames: 4,
      yourWins: 1,
      season: { name: 'Fall Season', url: `${SITE_URL}/leagues/example/seasons/example`, leaders: ['Amanda'], yourRank: 2, playerCount: 6, endsInDays: 9 },
    },
  ],
  ...previewLinks,
} satisfies WeeklyDigestEmailProps;

export default WeeklyDigestEmail;
