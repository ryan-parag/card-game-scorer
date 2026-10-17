import { Column, Heading, Link, Row, Section, Text } from 'react-email';
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
    // Others in first place (not you).
    leaders: string[];
    yourRank: number | null;
    playerCount: number;
    endsInDays: number | null;
    // Top of the table, plus your row (after a gap) if you're further down.
    standings: DigestStandingRow[];
  } | null;
}

export interface DigestStandingRow {
  rank: number;
  name: string;
  score: number;
  isYou: boolean;
  // You're below the rows shown above, so mark the skipped places.
  afterGap: boolean;
}

const StandingsTable = ({ rows }: { rows: DigestStandingRow[] }) => (
  <Section className="mt-2 mb-1 rounded-lg bg-stone-100 border border-stone-100 px-0 py-1">
    {rows.map(row => (
      <React.Fragment key={`${row.rank}-${row.name}`}>
        {row.afterGap && (
          <Row className="px-3">
            <Column>
              <Text className="text-stone-700 text-xs text-left my-0">⋯</Text>
            </Column>
          </Row>
        )}
        <Row className={`px-3 ${row.isYou ? 'opacity-100 bg-stone-50' : 'opacity-60'}`}>
          <Column className="w-8">
            <Text className="text-stone-900 text-sm my-1">{row.rank}</Text>
          </Column>
          <Column>
            <Text className={`text-stone-900 text-sm my-1 ${row.isYou ? 'font-bold' : 'font-medium'}`}>
              {row.name}
              {row.isYou && <span className="text-stone-400 font-normal"> · you</span>}
            </Text>
          </Column>
          <Column align="right">
            <Text className={`text-sm my-1 text-stone-900 ${row.isYou && 'font-bold'}`}>
              {row.score} pts
            </Text>
          </Column>
        </Row>
      </React.Fragment>
    ))}
  </Section>
);

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

// "You're in the lead out of 6", "you share the lead with Amanda", or
// "Amanda leads, you're 3rd of 6".
const seasonStanding = (season: NonNullable<DigestLeague['season']>) => {
  const others = joinNames(season.leaders);
  if (season.yourRank === 1) {
    return season.leaders.length > 0
      ? `you share the lead with ${others}`
      : `you're in the lead out of ${season.playerCount}`;
  }
  const leader = season.leaders.length > 0
    ? `${others} ${season.leaders.length > 1 ? 'share the lead' : 'leads'}`
    : 'no games yet';
  return season.yourRank ? `${leader}, you're ${ordinal(season.yourRank)} of ${season.playerCount}` : leader;
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
      {/* Centered as inline text: Gmail strips flexbox. */}
      <Text className="text-center my-2">
        <span className="inline-block text-stone-700 bg-stone-100 text-xs font-bold px-2 py-1 rounded-full border border-solid border-stone-200">{weekLabel}</span>
      </Text>
      {leagues.map(league => (
        <Section key={league.url} className="my-4 border border-stone-200 rounded-xl px-3 py-3">
          <Heading as="h2" className="text-stone-600 text-xs font-bold my-1">
            <Link href={league.url} className="text-stone-900 no-underline">{league.name}</Link>
          </Heading>
          {league.season && (
            <Text className="text-stone-900 text-sm my-1">
              <Link href={league.season.url} className="text-stone-900 font-bold underline">{league.season.name}</Link>
              {': '}{seasonStanding(league.season)}
              {league.season.endsInDays !== null && league.season.endsInDays <= 14
                ? ` · ends in ${league.season.endsInDays} ${league.season.endsInDays === 1 ? 'day' : 'days'}`
                : ''}
              .
            </Text>
          )}
          {league.season && league.season.standings.length > 0 && (
            <StandingsTable rows={league.season.standings} />
          )}
          {league.yourGames > 0 && (
            <Text className="text-stone-900 text-sm my-1">
              You played {league.yourGames} and won {league.yourWins}.
            </Text>
          )}
          <Text className="text-stone-900 text-sm my-1">
            {league.gamesThisWeek} {league.gamesThisWeek === 1 ? 'game' : 'games'} played
            {league.topWinners ? ` · Most wins: ${joinNames(league.topWinners.names)} (${league.topWinners.wins})` : ''}
          </Text>
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
      topWinners: { names: ['Claire'], wins: 3 },
      yourGames: 4,
      yourWins: 1,
      season: {
        name: 'Fall Season',
        url: `${SITE_URL}/leagues/example/seasons/example`,
        leaders: ['Claire'],
        yourRank: 2,
        playerCount: 6,
        endsInDays: 9,
        standings: [
          { rank: 1, name: 'Claire', score: 940, isYou: false, afterGap: false },
          { rank: 2, name: 'Ryan', score: 910, isYou: true, afterGap: false },
          { rank: 3, name: 'Sam', score: 875, isYou: false, afterGap: false },
          { rank: 4, name: 'Priya', score: 820, isYou: false, afterGap: false },
          { rank: 5, name: 'Jordan', score: 790, isYou: false, afterGap: false },
        ],
      },
    },{
      name: 'Monday Card Club',
      url: `${SITE_URL}/leagues/example`,
      gamesThisWeek: 17,
      topWinners: { names: ['Gary'], wins: 8 },
      yourGames: 6,
      yourWins: 3,
      season: {
        name: 'October',
        url: `${SITE_URL}/leagues/example/seasons/example`,
        leaders: ['Gary'],
        yourRank: 7,
        playerCount: 9,
        endsInDays: 9,
        standings: [
          { rank: 1, name: 'Gary', score: 1210, isYou: false, afterGap: false },
          { rank: 2, name: 'Mei', score: 1185, isYou: false, afterGap: false },
          { rank: 3, name: 'Tom', score: 1102, isYou: false, afterGap: false },
          { rank: 4, name: 'Alex', score: 1040, isYou: false, afterGap: false },
          { rank: 5, name: 'Dana', score: 998, isYou: false, afterGap: false },
          { rank: 7, name: 'Ryan', score: 905, isYou: true, afterGap: true },
        ],
      },
    },
  ],
  ...previewLinks,
} satisfies WeeklyDigestEmailProps;

export default WeeklyDigestEmail;
