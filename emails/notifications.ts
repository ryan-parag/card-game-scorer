// The notification emails the server sends (via api/_lib/notify.ts). Bundled
// to plain JS by scripts/build-email-templates.mjs, because Vercel's Node
// functions can't import .tsx files directly.
export { FriendRequestEmail } from './templates/notifications/friend-request.js';
export { FriendAcceptedEmail } from './templates/notifications/friend-accepted.js';
export { LeagueAddedEmail } from './templates/notifications/league-added.js';
export { SeasonStartedEmail } from './templates/notifications/season-started.js';
export { SeasonEndedEmail } from './templates/notifications/season-ended.js';
export { WeeklyDigestEmail } from './templates/notifications/weekly-digest.js';
export type { WeeklyDigestEmailProps, DigestLeague } from './templates/notifications/weekly-digest.js';
