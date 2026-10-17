// Shared helpers for share cards. Files in api/_lib aren't deployed as routes.
//
// Card data is read with the service role key, so it includes members-only
// league games. To keep that from becoming a way to read anyone's results,
// every card link is signed: only a participant can mint one (see
// api/share-link.ts), and the card endpoints refuse links without a valid
// signature.

export type ShareKind = 'season' | 'league' | 'wrapped' | 'rivalry';

export interface ShareTarget {
  kind: ShareKind;
  // season: season id · league: league id · wrapped/rivalry: the sharer's user id
  id: string;
  // league: inviter's user id · wrapped: year · rivalry: the other player's user id
  extra: string;
}

export const SHARE_KINDS: ShareKind[] = ['season', 'league', 'wrapped', 'rivalry'];

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const siteUrl = () => process.env.SITE_URL || 'https://scorekeeper.ryanparag.com';

// ── Signing ──────────────────────────────────────────────────────────────────

const signingSecret = () => process.env.SHARE_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const base64Url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

// Signs a message for use in a URL. Callers prefix messages with what they're
// for (e.g. "scorekeeper-share-v1|…") so one signature can't stand in for another.
export async function signMessage(message: string): Promise<string> {
  const secret = signingSecret();
  if (!secret) throw new Error('Missing share signing secret');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  // 128 bits is plenty for an unguessable link and keeps URLs short.
  return base64Url(mac).slice(0, 22);
}

export async function verifyMessage(message: string, signature: string | null): Promise<boolean> {
  if (!signature || !signingSecret()) return false;
  const expected = await signMessage(message);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

const targetMessage = (target: ShareTarget) =>
  `scorekeeper-share-v1|${target.kind}|${target.id}|${target.extra}`;

export const signTarget = (target: ShareTarget) => signMessage(targetMessage(target));

export const verifyTarget = (target: ShareTarget, signature: string | null) =>
  verifyMessage(targetMessage(target), signature);

export function parseTarget(params: URLSearchParams): ShareTarget | null {
  const kind = params.get('kind') as ShareKind | null;
  const id = params.get('id') ?? '';
  const extra = params.get('x') ?? '';
  if (!kind || !SHARE_KINDS.includes(kind) || !UUID_PATTERN.test(id)) return null;
  if ((kind === 'league' || kind === 'rivalry') && !UUID_PATTERN.test(extra)) return null;
  if (kind === 'wrapped' && !/^\d{4}$/.test(extra)) return null;
  return { kind, id, extra };
}

export function targetQuery(target: ShareTarget, signature: string): string {
  const params = new URLSearchParams({ kind: target.kind, id: target.id, s: signature });
  if (target.extra) params.set('x', target.extra);
  return params.toString();
}

// Public link: /share/<kind>/<id>?x=…&s=… (rewritten to api/share-card).
export function shareUrl(target: ShareTarget, signature: string): string {
  const params = new URLSearchParams();
  if (target.extra) params.set('x', target.extra);
  params.set('s', signature);
  return `${siteUrl()}/share/${target.kind}/${target.id}?${params.toString()}`;
}

// Where the link takes people in the app.
export function destinationPath(target: ShareTarget, leagueId?: string | null): string {
  switch (target.kind) {
    case 'season':
      return leagueId ? `/leagues/${leagueId}/seasons/${target.id}` : '/leagues';
    case 'league':
      return `/leagues/${target.id}`;
    case 'wrapped':
    case 'rivalry':
      return `/u/${target.id}`;
  }
}

// ── Supabase REST ────────────────────────────────────────────────────────────

const supabaseUrl = () => process.env.VITE_SUPABASE_URL || '';
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function rest<T>(path: string): Promise<T | null> {
  if (!supabaseUrl() || !serviceKey()) return null;
  const res = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    headers: { apikey: serviceKey(), Authorization: `Bearer ${serviceKey()}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

// Writes with the service role key. Returns the response body (if any).
export async function restWrite<T>(
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  prefer = 'return=representation',
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  if (!supabaseUrl() || !serviceKey()) return { ok: false, data: null, error: 'Missing Supabase credentials' };
  const res = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceKey(),
      Authorization: `Bearer ${serviceKey()}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : null;
  return { ok: res.ok, data: res.ok ? data : null, error: res.ok ? null : text };
}

export async function countRows(table: string, filter: string): Promise<number> {
  if (!supabaseUrl() || !serviceKey()) return 0;
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}?${filter}&select=id`, {
    headers: {
      apikey: serviceKey(),
      Authorization: `Bearer ${serviceKey()}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  const total = res.headers.get('content-range')?.split('/')[1];
  return total && total !== '*' ? Number(total) : 0;
}

// The signed-in user behind a Supabase access token, or null.
export async function userFromToken(token: string | null): Promise<string | null> {
  if (!token || !supabaseUrl()) return null;
  const res = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY || serviceKey(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

export const bearerToken = (req: Request) =>
  req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1] ?? null;

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
