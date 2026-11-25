import { hasSecret } from '../_lib/notify.js';
import { ApiRequest, ApiResponse, header } from '../_lib/http.js';
import { ApnsEnvironment, apnsConfigured, closeSessions, sendLiveActivityPush } from '../_lib/apns.js';
import { contentStateFor, GameRecord } from '../_lib/liveActivityState.js';

// Pushes a game's latest standings to everyone following it on their iOS Lock
// Screen (Live Activities). Called by a Supabase Database Webhook on every
// games UPDATE; returns quickly when nobody follows the game.
//
// Webhook setup (Supabase dashboard → Database → Webhooks):
//   table: games · events: Update · type: HTTP request · method: POST
//   URL: https://<your site>/api/live-activity/dispatch
//   header: Authorization: Bearer <LIVE_ACTIVITY_WEBHOOK_SECRET>
//
// The content-state shape must match GameActivityAttributes.ContentState in
// the iOS app (ios/Shared/GameActivityAttributes.swift) and the app's own
// local updates (lib/core/live_activity/live_activity_service.dart).

interface TokenRow {
  id: string;
  push_token: string;
  environment: ApnsEnvironment;
}

// Final standings stay on the Lock Screen this long after the game ends.
const END_DISMISS_SECONDS = 60 * 60;

const supabaseUrl = () => process.env.VITE_SUPABASE_URL;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rest(method: string, path: string, body?: unknown): Promise<Response> {
  const key = serviceKey()!;
  return fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const otherEnv = (env: ApnsEnvironment): ApnsEnvironment => (env === 'production' ? 'sandbox' : 'production');
const isDeadToken = (status: number, reason?: string) =>
  status === 410 || reason === 'Unregistered' || reason === 'ExpiredToken';

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
  if (body?.table !== 'games' || body?.type !== 'UPDATE' || typeof game?.id !== 'string') {
    return res.status(400).json({ error: 'Expected a games UPDATE webhook' });
  }

  const tokensRes = await rest(
    'GET',
    `live_activity_tokens?game_id=eq.${encodeURIComponent(game.id)}&select=id,push_token,environment`,
  );
  if (!tokensRes.ok) return res.status(200).json({ error: `token lookup ${tokensRes.status}` });
  const tokens = (await tokensRes.json()) as TokenRow[];
  if (tokens.length === 0) return res.status(200).json({ sent: 0 });

  const isEnd = game.status === 'completed';
  const now = Math.floor(Date.now() / 1000);
  // ActivityKit drops updates older than the one it's showing, so stamp with
  // the game's own update time.
  const timestamp = game.updated_at ? Math.floor(Date.parse(game.updated_at) / 1000) || now : now;
  const payload = {
    aps: {
      timestamp,
      event: isEnd ? 'end' : 'update',
      'content-state': contentStateFor(game),
      ...(isEnd ? { 'dismissal-date': now + END_DISMISS_SECONDS } : {}),
    },
  };

  let sent = 0;
  const dead: string[] = [];
  try {
    await Promise.all(tokens.map(async token => {
      let result = await sendLiveActivityPush(token.environment, token.push_token, payload, 10);
      // Development builds get sandbox tokens; if the stored environment was
      // wrong, try the other one and remember whichever works.
      if (result.status === 400 && result.reason === 'BadDeviceToken') {
        const alt = otherEnv(token.environment);
        result = await sendLiveActivityPush(alt, token.push_token, payload, 10);
        if (result.status === 200) {
          await rest('PATCH', `live_activity_tokens?id=eq.${token.id}`, { environment: alt });
        }
      }
      if (result.status === 200) sent += 1;
      else if (isDeadToken(result.status, result.reason) || result.reason === 'BadDeviceToken') dead.push(token.id);
    }));
  } finally {
    closeSessions();
  }

  // A completed game's activity is over; drop every token for it.
  if (isEnd) {
    await rest('DELETE', `live_activity_tokens?game_id=eq.${encodeURIComponent(game.id)}`);
  } else if (dead.length > 0) {
    await rest('DELETE', `live_activity_tokens?id=in.(${dead.join(',')})`);
  }

  return res.status(200).json({ sent, removed: isEnd ? tokens.length : dead.length });
}
