export type ChangelogCategory = 'feature' | 'improvement' | 'fix';

export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  category: ChangelogCategory;
  // Optional filename in src/assets/changelog/, e.g. 'target-scores.png'.
  screenshot?: string;
}

// Newest first. Add an entry here as part of the same change whenever you
// ship a user-facing feature or improvement — see CLAUDE.md.
export const changelogEntries: ChangelogEntry[] = [
  {
    date: '2026-08-27',
    title: 'Fixed voice entry mic access on mobile',
    description: "Voice score entry now reliably requests microphone access on mobile browsers, and shows a clearer message if it can't get access instead of silently failing.",
    category: 'fix',
  },
  {
    date: '2026-08-25',
    title: 'Shareable game result cards',
    description: "Completed games now have a Share button that generates a rich preview card with the final standings — perfect for dropping into a group chat.",
    category: 'feature',
  },
  {
    date: '2026-08-25',
    title: 'Voice score entry',
    description: "Tap the mic during a round and say scores out loud, like \"Ryan 15, Amanda 10\" — great for keeping your eyes on the table. You'll get a quick chance to review before it's applied.",
    category: 'feature',
  },
  {
    date: '2026-08-25',
    title: 'Live win probability',
    description: "Score screens now show each player's live odds of winning, updated after every round based on how the game has been trending.",
    category: 'feature',
  },
  {
    date: '2026-08-14',
    title: 'Increase max number of players',
    description: "The number of maximum players in a game has been increased from 10 to 20. This allows larger groups to play together without needing to split into multiple games.",
    category: 'improvement',
  },
  {
    date: '2026-08-12',
    title: 'Smoother rematch button',
    description: "The Restart button now spins while your rematch is being set up, and won't create duplicate games if you tap it more than once.",
    category: 'improvement',
  },
  {
    date: '2026-07-31',
    title: 'Automatic bonus rounds',
    description: "Racing to a target score? If nobody's reached it by the final round, the game now adds another round automatically instead of ending early.",
    category: 'feature',
    screenshot: 'auto-extend-rounds.png',
  },
  {
    date: '2026-07-30',
    title: 'End-game banner',
    description: "When a player crosses the target score, you'll see a banner offering to end the game right then or keep playing.",
    category: 'feature',
    screenshot: 'end-game-banner.png',
  },
  {
    date: '2026-07-29',
    title: 'Target scores',
    description: 'Set an optional target score for any game and watch the standings show exactly how far each player is from winning.',
    category: 'feature',
    screenshot: 'target-scores.png',
  },
  {
    date: '2026-07-29',
    title: 'Tie-aware rankings',
    description: 'Standings now group tied players together and rank everyone else correctly around them.',
    category: 'improvement',
    screenshot: 'tie-aware-rankings.png',
  },
  {
    date: '2026-07-11',
    title: 'Rank movement in summaries',
    description: "Game summaries now show how each player's rank in the season standings moved up or down after the result.",
    category: 'improvement',
    screenshot: 'rank-movement.png',
  },
  {
    date: '2026-07-02',
    title: 'Scorekeeper tracking',
    description: "See who's been keeping score for a game, both while it's in progress and on the final summary.",
    category: 'feature',
    screenshot: 'scorekeeper-tracking.png',
  },
  {
    date: '2026-06-30',
    title: 'Helpful tooltips',
    description: 'Added tooltips across the scoring interface and season pages to explain what everything does.',
    category: 'improvement',
  },
  {
    date: '2026-06-25',
    title: 'Season stats',
    description: 'Season pages now show average scores and podium percentages for every player.',
    category: 'feature',
    screenshot: 'season-stats.png',
  },
  {
    date: '2026-06-22',
    title: 'Season dashboard cards',
    description: "New at-a-glance cards summarize a season's standings and recent activity.",
    category: 'feature',
    screenshot: 'season-dashboard.png',
  },
  {
    date: '2026-05-28',
    title: 'Custom scoring systems',
    description: 'Build custom point tables for ranked finishes and reuse them across games.',
    category: 'feature',
    screenshot: 'custom-scoring-system.png',
  },
  {
    date: '2026-05-11',
    title: 'Public profiles',
    description: 'Every player now has a shareable public profile with their stats and game history.',
    category: 'feature',
    screenshot: 'public-profile.png',
  },
  {
    date: '2026-05-04',
    title: 'Podium tuning',
    description: 'Adjusted how many players show on the podium so it better fits smaller and larger groups.',
    category: 'improvement',
  },
];
