// Turns queued notifications (see supabase/migrations/018_notifications.sql)
// into emails sent through Resend.
import { createElement, type ReactElement } from 'react';
import { render } from 'react-email';
// Built from emails/ by `npm run build:emails` (part of `npm run build`).
import {
  FriendRequestEmail,
  FriendAcceptedEmail,
  LeagueAddedEmail,
  SeasonStartedEmail,
  SeasonEndedEmail,
  WeeklyDigestEmail,
  type WeeklyDigestEmailProps,
} from './email-templates.generated.js';
import { rest, restWrite, countRows, signMessage, verifyMessage, siteUrl } from './share.js';
import { loadProfiles, loadSeasonStandings, profileName } from './cardData.js';

export type NotificationType =
  | 'friend_request' | 'friend_accepted' | 'league_added'
  | 'season_started' | 'season_ended' | 'weekly_digest';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  data: Record<string, unknown>;
  created_at: string;
  emailed_at: string | null;
  email_skipped: string | null;
  email_attempts: number;
  email_claimed_at: string | null;
}

// Each kind of email maps to one on/off setting.
export type EmailCategory = 'friend' | 'league' | 'digest';

const CATEGORY: Record<NotificationType, EmailCategory> = {
  friend_request: 'friend',
  friend_accepted: 'friend',
  league_added: 'league',
  season_started: 'league',
  season_ended: 'league',
  weekly_digest: 'digest',
};

export const SETTING_COLUMN: Record<EmailCategory, string> = {
  friend: 'email_friend_activity',
  league: 'email_league_activity',
  digest: 'email_weekly_digest',
};

const MAX_ATTEMPTS = 3;
// A send that started this long ago and never finished is treated as dead.
const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

const fromAddress = () => process.env.NOTIFICATIONS_FROM || 'ScoreKeeper <notifications@scorekeeper.ryanparag.com>';

// ── Unsubscribe links ────────────────────────────────────────────────────────

const unsubscribeMessage = (userId: string, category: EmailCategory) =>
  `scorekeeper-unsubscribe-v1|${userId}|${category}`;

export async function unsubscribeUrl(userId: string, category: EmailCategory): Promise<string> {
  const signature = await signMessage(unsubscribeMessage(userId, category));
  const params = new URLSearchParams({ u: userId, c: category, s: signature });
  return `${siteUrl()}/api/notifications/unsubscribe?${params.toString()}`;
}

export const verifyUnsubscribe = (userId: string, category: EmailCategory, signature: string | null) =>
  verifyMessage(unsubscribeMessage(userId, category), signature);

// ── Building emails ──────────────────────────────────────────────────────────

interface BuiltEmail {
  subject: string;
  element: ReactElement;
}

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });

const INDEFINITE_END_DATE = '9999-12-31';

const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;

async function friendshipStatus(id: unknown): Promise<string | null> {
  if (typeof id !== 'string') return null;
  const rows = await rest<{ status: string }[]>(`friendships?id=eq.${id}&select=status`);
  return rows?.[0]?.status ?? null;
}

// Returns null when the email no longer makes sense (request withdrawn,
// league deleted, …).
async function buildEmail(n: NotificationRow, links: { unsubscribeUrl: string; settingsUrl: string }): Promise<BuiltEmail | null> {
  const site = siteUrl();
  const data = n.data;

  switch (n.type) {
    case 'friend_request': {
      if ((await friendshipStatus(data.friendship_id)) !== 'pending') return null;
      const requesterId = String(data.requester_id);
      const requester = (await loadProfiles([requesterId])).get(requesterId);
      if (!requester) return null;
      const name = profileName(requester);
      return {
        subject: `${name} sent you a friend request`,
        element: createElement(FriendRequestEmail, { requesterName: name, requesterUrl: `${site}/u/${requesterId}`, ...links }),
      };
    }
    case 'friend_accepted': {
      if ((await friendshipStatus(data.friendship_id)) !== 'accepted') return null;
      const friendId = String(data.addressee_id);
      const friend = (await loadProfiles([friendId])).get(friendId);
      if (!friend) return null;
      const name = profileName(friend);
      return {
        subject: `${name} accepted your friend request`,
        element: createElement(FriendAcceptedEmail, { friendName: name, friendUrl: `${site}/u/${friendId}`, ...links }),
      };
    }
    case 'league_added': {
      const leagueId = String(data.league_id);
      const [leagues, stillMember, memberCount] = await Promise.all([
        rest<{ name: string }[]>(`leagues?id=eq.${leagueId}&select=name`),
        rest<{ user_id: string }[]>(`league_members?league_id=eq.${leagueId}&user_id=eq.${n.user_id}&select=user_id`),
        countRows('league_members', `league_id=eq.${leagueId}`),
      ]);
      const league = leagues?.[0];
      if (!league || !stillMember?.length) return null;
      const addedById = typeof data.added_by === 'string' ? data.added_by : null;
      const addedBy = addedById ? (await loadProfiles([addedById])).get(addedById) : null;
      return {
        subject: `You've been added to ${league.name}`,
        element: createElement(LeagueAddedEmail, {
          leagueName: league.name,
          addedByName: addedBy ? profileName(addedBy) : null,
          memberCount,
          leagueUrl: `${site}/leagues/${leagueId}`,
          ...links,
        }),
      };
    }
    case 'season_started': {
      const seasons = await rest<{ name: string; start_date: string; end_date: string; league_id: string; league: { name: string } | null }[]>(
        `league_seasons?id=eq.${String(data.season_id)}&select=name,start_date,end_date,league_id,league:leagues(name)`,
      );
      const season = seasons?.[0];
      if (!season) return null;
      const leagueName = season.league?.name ?? 'your league';
      const hasStarted = new Date(`${season.start_date}T00:00:00Z`) <= new Date();
      return {
        subject: hasStarted
          ? `${season.name} has started in ${leagueName}`
          : `${season.name} starts ${formatDate(season.start_date)} in ${leagueName}`,
        element: createElement(SeasonStartedEmail, {
          leagueName,
          seasonName: season.name,
          startDate: formatDate(season.start_date),
          endDate: season.end_date === INDEFINITE_END_DATE ? null : formatDate(season.end_date),
          hasStarted,
          seasonUrl: `${site}/leagues/${season.league_id}/seasons/${String(data.season_id)}`,
          ...links,
        }),
      };
    }
    case 'season_ended': {
      const loaded = await loadSeasonStandings(String(data.season_id));
      // Nothing to announce for a season nobody played.
      if (!loaded || loaded.gamesPlayed === 0) return null;
      const { season, standings } = loaded;
      const leagueName = season.league?.name ?? 'your league';
      const champions = standings.filter(s => s.rank === 1).map(s => s.displayName);
      return {
        subject: champions.length > 1
          ? `${joinNames(champions)} shared ${season.name} in ${leagueName}`
          : `${champions[0]} won ${season.name} in ${leagueName}`,
        element: createElement(SeasonEndedEmail, {
          leagueName,
          seasonName: season.name,
          champions,
          standings: standings.slice(0, 5).map(s => ({ rank: s.rank, name: s.displayName, score: s.totalScore })),
          gamesPlayed: loaded.gamesPlayed,
          seasonUrl: `${site}/leagues/${season.league_id}/seasons/${season.id}`,
          ...links,
        }),
      };
    }
    case 'weekly_digest': {
      const digest = data as unknown as Pick<WeeklyDigestEmailProps, 'weekLabel' | 'leagues'>;
      if (!Array.isArray(digest.leagues) || digest.leagues.length === 0) return null;
      const games = digest.leagues.reduce((sum, l) => sum + l.gamesThisWeek, 0);
      return {
        subject: `Your week in ScoreKeeper: ${games} league ${games === 1 ? 'game' : 'games'}`,
        element: createElement(WeeklyDigestEmail, { ...digest, ...links }),
      };
    }
  }
}

// ── Sending ──────────────────────────────────────────────────────────────────

async function sendWithResend(args: {
  idempotencyKey: string; to: string; subject: string; html: string; text: string; unsubscribeUrl: string;
}): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 'Missing RESEND_API_KEY';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Resend drops repeats of the same key, so a retry can't double-send.
      'Idempotency-Key': args.idempotencyKey,
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: {
        'List-Unsubscribe': `<${args.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  return res.ok ? null : `Resend ${res.status}: ${await res.text()}`;
}

// The sign-in email from Supabase Auth. profiles.email is only copied when
// the account is created, so it goes stale if someone changes their email.
async function recipientEmail(userId: string): Promise<string | null> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        const user = (await res.json()) as { email?: string | null };
        if (user.email) return user.email;
      }
    } catch {
      // Fall back to the profile's copy below.
    }
  }
  const profiles = await rest<{ email: string | null }[]>(`profiles?id=eq.${userId}&select=email`);
  return profiles?.[0]?.email ?? null;
}

const patchNotification = (id: string, fields: Record<string, unknown>) =>
  restWrite('PATCH', `notifications?id=eq.${id}`, fields, 'return=minimal');

export type DeliveryResult = 'sent' | 'skipped' | 'busy' | 'failed' | 'done';

// Emails one notification. Safe to call more than once for the same row (the
// webhook and the daily retry can overlap): only one caller wins the claim.
export async function deliverNotification(id: string): Promise<DeliveryResult> {
  const rows = await rest<NotificationRow[]>(`notifications?id=eq.${id}&select=*`);
  const n = rows?.[0];
  if (!n || n.emailed_at || n.email_skipped) return 'done';

  if (n.email_attempts >= MAX_ATTEMPTS) {
    await patchNotification(id, { email_skipped: 'gave up after repeated failures' });
    return 'skipped';
  }

  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS).toISOString();
  const claim = await restWrite<NotificationRow[]>(
    'PATCH',
    `notifications?id=eq.${id}&emailed_at=is.null&email_skipped=is.null&email_attempts=eq.${n.email_attempts}` +
      `&or=(email_claimed_at.is.null,email_claimed_at.lt.${encodeURIComponent(`"${staleBefore}"`)})`,
    { email_attempts: n.email_attempts + 1, email_claimed_at: new Date().toISOString() },
  );
  if (!claim.ok || !claim.data?.length) return 'busy';

  const skip = async (reason: string) => {
    await patchNotification(id, { email_skipped: reason, email_claimed_at: null });
    return 'skipped' as const;
  };

  const category = CATEGORY[n.type];
  const [email, settings] = await Promise.all([
    recipientEmail(n.user_id),
    rest<Record<string, boolean>[]>(`notification_settings?user_id=eq.${n.user_id}&select=*`),
  ]);
  if (!email) return skip('no email address');
  if (settings?.[0]?.[SETTING_COLUMN[category]] === false) return skip('turned off by recipient');

  try {
    const links = { unsubscribeUrl: await unsubscribeUrl(n.user_id, category), settingsUrl: `${siteUrl()}/profile` };
    const built = await buildEmail(n, links);
    if (!built) return skip('no longer relevant');

    const html = await render(built.element);
    const text = await render(built.element, { plainText: true });
    const error = await sendWithResend({
      idempotencyKey: `notification-${n.id}`,
      to: email,
      subject: built.subject,
      html,
      text,
      unsubscribeUrl: links.unsubscribeUrl,
    });
    if (error) {
      await patchNotification(id, { email_error: error.slice(0, 1000), email_claimed_at: null });
      return 'failed';
    }
    await patchNotification(id, { emailed_at: new Date().toISOString(), email_error: null });
    return 'sent';
  } catch (err) {
    await patchNotification(id, { email_error: String(err).slice(0, 1000), email_claimed_at: null });
    return 'failed';
  }
}

// Shared-secret check for endpoints only Supabase or Vercel Cron should call.
export function hasSecret(authorization: string | undefined | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const expected = `Bearer ${secret}`;
  if (authorization.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ authorization.charCodeAt(i);
  return diff === 0;
}
