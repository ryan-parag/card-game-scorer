import { hasSecret } from '../_lib/notify.js';
import { ApiRequest, ApiResponse, header } from '../_lib/http.js';
import { ApnsEnvironment, ApnsResult, apnsConfigured, closeSessions, sendLiveActivityPush } from '../_lib/apns.js';
import { contentStateFor, GameRecord } from '../_lib/liveActivityState.js';

// Keeps games' iOS Live Activities (Lock Screen / Dynamic Island) in sync.
// Called by a Supabase Database Webhook on every games INSERT and UPDATE:
//
// 1. League games that are being played are started automatically on every
//    league member's iPhone (push-to-start, iOS 17.2+), unless they've turned
//    that off (notification_settings.live_activity_league_games).
// 2. Every running activity for the game (auto-started, followed, or the
//    scorekeeper's own) gets the new standings via its update token.
// 3. When the game completes, activities end with the final standings.
//
// Webhook setup (Supabase dashboard → Database → Webhooks):
//   table: games · events: Insert + Update · type: HTTP request · method: POST
//   URL: https://<your site>/api/live-activity/dispatch
//   header: Authorization: Bearer <LIVE_ACTIVITY_WEBHOOK_SECRET>
//
// The content-state / attributes shapes must match GameActivityAttributes in
// the iOS app (ios/Shared/GameActivityAttributes.swift).

interface TokenRow {
  id: string;
  user_id: string;
  push_token: string;
  environment: ApnsEnvironment;
}

// Final standings stay on the Lock Screen this long after the game ends.
const END_DISMISS_SECONDS = 60 * 60;

const supabaseUrl = () => process.env.VITE_SUPABASE_URL;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rest(method: string, path: string, body?: unknown, prefer = 'return=minimal'): Promise<Response> {
  const key = serviceKey()!;
  return fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function restJson<T>(path: string): Promise<T | null> {
  const res = await rest('GET', path);
  return res.ok ? ((await res.json()) as T) : null;
}

const inList = (values: string[]) => `(${values.map(v => `"${v}"`).join(',')})`;
const otherEnv = (env: ApnsEnvironment): ApnsEnvironment => (env === 'production' ? 'sandbox' : 'production');
const isDeadToken = (r: ApnsResult) =>
  r.status === 410 || r.reason === 'Unregistered' || r.reason === 'ExpiredToken' || r.reason === 'BadDeviceToken';

// Sends to the token's stored environment, falling back to the other one
// (development builds get sandbox tokens) and correcting the stored value.
async function pushWithFallback(table: string, token: TokenRow, payload: unknown): Promise<ApnsResult> {
  let result = await sendLiveActivityPush(token.environment, token.push_token, payload, 10);
  if (result.status === 400 && result.reason === 'BadDeviceToken') {
    const alt = otherEnv(token.environment);
    result = await sendLiveActivityPush(alt, token.push_token, payload, 10);
    if (result.status === 200) {
      await rest('PATCH', `${table}?id=eq.${token.id}`, { environment: alt });
    }
  }
  return result;
}

async function subtitleFor(game: GameRecord): Promise<string | null> {
  if (!game.league_id) return null;
  const [leagues, seasons] = await Promise.all([
    restJson<{ name: string }[]>(`leagues?id=eq.${game.league_id}&select=name`),
    game.season_id
      ? restJson<{ name: string }[]>(`league_seasons?id=eq.${game.season_id}&select=name`)
      : Promise.resolve(null),
  ]);
  const league = leagues?.[0]?.name;
  const season = seasons?.[0]?.name;
  return [league, season].filter(Boolean).join(' · ') || null;
}

// Starts the game's activity on league members' phones that don't have it yet.
async function autoStart(game: GameRecord, timestamp: number) {
  const summary = { candidates: 0, started: 0, failed: [] as string[] };
  if (!game.league_id) return summary;

  const members = await restJson<{ user_id: string }[]>(
    `league_members?league_id=eq.${game.league_id}&select=user_id`,
  );
  let userIds = (members ?? []).map(m => m.user_id);
  if (userIds.length === 0) return summary;

  const [optedOut, running] = await Promise.all([
    restJson<{ user_id: string }[]>(
      `notification_settings?user_id=in.${inList(userIds)}&live_activity_league_games=eq.false&select=user_id`,
    ),
    // Already showing it (scorekeeper's own, or followed) — don't start a second.
    restJson<{ user_id: string }[]>(
      `live_activity_tokens?game_id=eq.${encodeURIComponent(game.id)}&select=user_id`,
    ),
  ]);
  const skip = new Set([...(optedOut ?? []), ...(running ?? [])].map(r => r.user_id));
  userIds = userIds.filter(id => !skip.has(id));
  if (userIds.length === 0) return summary;

  const startTokens = await restJson<TokenRow[]>(
    `live_activity_start_tokens?user_id=in.${inList(userIds)}&select=id,user_id,push_token,environment`,
  );
  const withTokens = [...new Set((startTokens ?? []).map(t => t.user_id))];
  summary.candidates = withTokens.length;
  if (withTokens.length === 0) return summary;

  // Claim (game, user) pairs first; only pairs this call inserted get a start,
  // so overlapping webhook calls can't start the game twice.
  const claimRes = await rest(
    'POST',
    'live_activity_auto_starts?on_conflict=game_id,user_id',
    withTokens.map(user_id => ({ game_id: game.id, user_id })),
    'resolution=ignore-duplicates,return=representation',
  );
  if (!claimRes.ok) {
    summary.failed.push(`claim ${claimRes.status}`);
    return summary;
  }
  const claimed = new Set(((await claimRes.json()) as { user_id: string }[]).map(r => r.user_id));
  if (claimed.size === 0) return summary;

  const subtitle = await subtitleFor(game);
  const gameName = game.name ?? 'Game';
  const payload = {
    aps: {
      timestamp,
      event: 'start',
      'content-state': contentStateFor(game),
      'attributes-type': 'GameActivityAttributes',
      attributes: { gameId: game.id, gameName, ...(subtitle ? { subtitle } : {}) },
      // A start needs an alert; this is what shows if the Lock Screen is on.
      alert: {
        title: `${gameName} is underway`,
        body: subtitle ? `Live scores from ${subtitle}` : 'Follow the scores live',
      },
    },
  };

  const dead: string[] = [];
  await Promise.all((startTokens ?? []).filter(t => claimed.has(t.user_id)).map(async token => {
    const result = await pushWithFallback('live_activity_start_tokens', token, payload);
    if (result.status === 200) summary.started += 1;
    else {
      summary.failed.push(`${result.status} ${result.reason ?? ''}`.trim());
      if (isDeadToken(result)) dead.push(token.id);
    }
  }));
  if (dead.length > 0) await rest('DELETE', `live_activity_start_tokens?id=in.${inList(dead)}`);
  return summary;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasSecret(header(req, 'authorization'), process.env.LIVE_ACTIVITY_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!apnsConfigured() || !supabaseUrl() || !serviceKey()) {
    return res.status(500).json({ error: 'APNs or Supabase service key not configured' });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as
    { type?: string; table?: string; record?: GameRecord } | undefined;
  const game = body?.record;
  if (
    body?.table !== 'games' ||
    (body?.type !== 'UPDATE' && body?.type !== 'INSERT') ||
    typeof game?.id !== 'string'
  ) {
    return res.status(400).json({ error: 'Expected a games INSERT/UPDATE webhook' });
  }

  const isEnd = game.status === 'completed';
  const now = Math.floor(Date.now() / 1000);
  // ActivityKit silently drops any push whose timestamp isn't newer than what
  // it's already showing. Stamp with the time we send, not games.updated_at:
  // the web app never bumps updated_at while a game is played (it stays at
  // creation time), which made every update look stale and get discarded.
  const timestamp = now;

  try {
    const started = isEnd ? null : await autoStart(game, timestamp);

    const tokens = await restJson<TokenRow[]>(
      `live_activity_tokens?game_id=eq.${encodeURIComponent(game.id)}&select=id,user_id,push_token,environment`,
    ) ?? [];

    const payload = {
      aps: {
        timestamp,
        event: isEnd ? 'end' : 'update',
        'content-state': contentStateFor(game),
        ...(isEnd ? { 'dismissal-date': now + END_DISMISS_SECONDS } : {}),
      },
    };

    let sent = 0;
    const failed: string[] = [];
    const dead: string[] = [];
    await Promise.all(tokens.map(async token => {
      const result = await pushWithFallback('live_activity_tokens', token, payload);
      if (result.status === 200) sent += 1;
      else {
        failed.push(`${result.status} ${result.reason ?? ''}`.trim());
        if (isDeadToken(result)) dead.push(token.id);
      }
    }));

    // A completed game's activities are over; drop its tokens and claims.
    if (isEnd) {
      await Promise.all([
        rest('DELETE', `live_activity_tokens?game_id=eq.${encodeURIComponent(game.id)}`),
        rest('DELETE', `live_activity_auto_starts?game_id=eq.${encodeURIComponent(game.id)}`),
      ]);
    } else if (dead.length > 0) {
      await rest('DELETE', `live_activity_tokens?id=in.${inList(dead)}`);
    }

    const result = {
      game: game.id,
      event: isEnd ? 'end' : 'update',
      tokens: tokens.length,
      sent,
      failed,
      removed: isEnd ? tokens.length : dead.length,
      autoStart: started,
    };
    // Visible in Vercel → Logs (expand the request) for troubleshooting.
    if (tokens.length > 0 || (started && started.candidates > 0)) console.log('live-activity', JSON.stringify(result));
    return res.status(200).json(result);
  } finally {
    closeSessions();
  }
}
