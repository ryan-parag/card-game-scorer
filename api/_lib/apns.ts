import { createPrivateKey, sign } from 'node:crypto';
import http2 from 'node:http2';

// Minimal APNs client for Live Activity pushes (token-based auth, HTTP/2).
//
// Env:
//   APNS_KEY_ID       10-char Key ID of the .p8 key (Apple Developer → Keys)
//   APNS_TEAM_ID      10-char Team ID
//   APNS_PRIVATE_KEY  contents of the .p8 file (newlines may be literal "\n")
//   APNS_BUNDLE_ID    iOS app bundle id (com.ryanparag.scorekeeper)

export type ApnsEnvironment = 'production' | 'sandbox';

const HOSTS: Record<ApnsEnvironment, string> = {
  production: 'https://api.push.apple.com',
  sandbox: 'https://api.sandbox.push.apple.com',
};

export const apnsConfigured = () =>
  !!(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_PRIVATE_KEY && process.env.APNS_BUNDLE_ID);

const base64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

// APNs provider tokens are valid for an hour and must not be refreshed more
// than every 20 minutes, so reuse one across warm invocations.
let cachedJwt: { token: string; issuedAt: number } | null = null;

function providerToken(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.issuedAt < 50 * 60) return cachedJwt.token;

  const header = base64url(JSON.stringify({ alg: 'ES256', kid: process.env.APNS_KEY_ID }));
  const claims = base64url(JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: now }));
  const key = createPrivateKey(process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, '\n'));
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), { key, dsaEncoding: 'ieee-p1363' });
  const token = `${header}.${claims}.${base64url(signature)}`;
  cachedJwt = { token, issuedAt: now };
  return token;
}

export interface ApnsResult {
  status: number;
  // APNs error reason, e.g. "BadDeviceToken", "Unregistered".
  reason?: string;
}

// One HTTP/2 session per environment per invocation; call closeSessions()
// when done so the function can exit.
const sessions = new Map<ApnsEnvironment, http2.ClientHttp2Session>();

function session(env: ApnsEnvironment): http2.ClientHttp2Session {
  const existing = sessions.get(env);
  if (existing && !existing.closed && !existing.destroyed) return existing;
  const created = http2.connect(HOSTS[env]);
  created.on('error', () => sessions.delete(env));
  sessions.set(env, created);
  return created;
}

export function closeSessions() {
  for (const s of sessions.values()) s.close();
  sessions.clear();
}

export function sendLiveActivityPush(
  env: ApnsEnvironment,
  deviceToken: string,
  payload: unknown,
  priority: 5 | 10,
): Promise<ApnsResult> {
  return new Promise(resolve => {
    let req: http2.ClientHttp2Stream;
    try {
      req = session(env).request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        authorization: `bearer ${providerToken()}`,
        'apns-topic': `${process.env.APNS_BUNDLE_ID}.push-type.liveactivity`,
        'apns-push-type': 'liveactivity',
        'apns-priority': String(priority),
        'content-type': 'application/json',
      });
    } catch (error) {
      resolve({ status: 0, reason: String(error) });
      return;
    }

    let status = 0;
    let body = '';
    req.setEncoding('utf8');
    req.on('response', headers => {
      status = Number(headers[':status'] ?? 0);
    });
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      let reason: string | undefined;
      try {
        reason = body ? (JSON.parse(body) as { reason?: string }).reason : undefined;
      } catch {
        reason = body || undefined;
      }
      resolve({ status, reason });
    });
    req.on('error', error => resolve({ status: 0, reason: String(error) }));
    req.setTimeout(10_000, () => {
      req.close();
      resolve({ status: 0, reason: 'timeout' });
    });
    req.end(JSON.stringify(payload));
  });
}
