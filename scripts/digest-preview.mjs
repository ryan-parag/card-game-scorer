// Builds the weekly digest from real data, as the Monday cron would, for one
// person, without waiting for Monday.
//
//   npm run digest:preview -- you@example.com          # save the HTML and open it
//   npm run digest:preview -- you@example.com --send   # also email it to you
//   add --no-open to skip opening the saved HTML
//
// Reads Supabase and Resend credentials from .env. Read-only apart from the
// optional test email: nothing is written to the notifications table and no
// one else is emailed.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['.env', '.env.local']) {
  try { process.loadEnvFile(path.join(root, file)); } catch { /* optional */ }
}

const args = process.argv.slice(2);
const email = args.find(a => !a.startsWith('--'));
const send = args.includes('--send');
const openPreview = !args.includes('--no-open');
if (!email) {
  console.error('Usage: npm run digest:preview -- you@example.com [--send]');
  process.exit(1);
}
for (const name of ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', ...(send ? ['RESEND_API_KEY'] : [])]) {
  if (!process.env[name]) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
}

// The digest code is TypeScript and the templates are TSX, so bundle them the
// same way the deploy does before running.
const cacheDir = path.join(root, 'node_modules/.cache/scorekeeper');
mkdirSync(cacheDir, { recursive: true });
const bundlePath = path.join(cacheDir, 'digest-preview.mjs');
await build({
  stdin: {
    contents: `
      export { buildWeeklyDigests } from './api/_lib/digest.ts';
      export { unsubscribeUrl } from './api/_lib/notify.ts';
      export { WeeklyDigestEmail } from './emails/notifications.ts';
    `,
    resolveDir: root,
    loader: 'ts',
  },
  outfile: bundlePath,
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  packages: 'external',
  logLevel: 'warning',
});
const { buildWeeklyDigests, unsubscribeUrl, WeeklyDigestEmail } = await import(pathToFileURL(bundlePath).href);
const { createElement } = await import('react');
const { render } = await import('react-email');

const supabase = (pathAndQuery) =>
  fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
  }).then(res => res.json());

const profiles = await supabase(`profiles?email=eq.${encodeURIComponent(email)}&select=id,display_name`);
const profile = profiles?.[0];
if (!profile) {
  console.error(`No ScoreKeeper account with the email ${email}.`);
  process.exit(1);
}

const digests = await buildWeeklyDigests(new Date());
const mine = digests.find(d => d.userId === profile.id);
if (!mine) {
  console.log(`No digest for ${email}: none of their leagues completed a game in the last 7 days.`);
  console.log('Finish a league game and run this again.');
  process.exit(0);
}

const siteUrl = process.env.SITE_URL || 'https://scorekeeper.ryanparag.com';
const element = createElement(WeeklyDigestEmail, {
  ...mine.digest,
  unsubscribeUrl: await unsubscribeUrl(profile.id, 'digest'),
  settingsUrl: `${siteUrl}/profile`,
});
const html = await render(element);
const htmlPath = path.join(cacheDir, 'weekly-digest-preview.html');
writeFileSync(htmlPath, html);

console.log(`Digest for ${profile.display_name ?? email} (${mine.digest.weekLabel}):`);
for (const league of mine.digest.leagues) {
  console.log(`  ${league.name}: ${league.gamesThisWeek} games, you played ${league.yourGames} and won ${league.yourWins}` +
    (league.season ? ` · ${league.season.name}: rank ${league.season.yourRank ?? '–'} of ${league.season.playerCount}` : ''));
}
console.log(`\nSaved ${path.relative(root, htmlPath)}`);
if (openPreview && process.platform === 'darwin') execFile('open', [htmlPath]);

if (send) {
  const games = mine.digest.leagues.reduce((sum, l) => sum + l.gamesThisWeek, 0);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.NOTIFICATIONS_FROM || 'ScoreKeeper <notifications@scorekeeper.ryanparag.com>',
      to: [email],
      subject: `[Test] Your week in ScoreKeeper: ${games} league ${games === 1 ? 'game' : 'games'}`,
      html,
      text: await render(element, { plainText: true }),
    }),
  });
  console.log(res.ok ? `Sent a test email to ${email}.` : `Resend error ${res.status}: ${await res.text()}`);
}
