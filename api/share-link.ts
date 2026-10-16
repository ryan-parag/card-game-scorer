import { bearerToken, rest, shareUrl, signTarget, userFromToken, ShareTarget, UUID_PATTERN } from './_lib/share.js';

export const config = { runtime: 'edge' };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function isLeagueMember(leagueId: string, userId: string) {
  const rows = await rest<{ user_id: string }[]>(
    `league_members?league_id=eq.${leagueId}&user_id=eq.${userId}&select=user_id`,
  );
  return (rows?.length ?? 0) > 0;
}

// Mints a signed share-card link. Only someone the card is about can make
// one: a league member for season and invite cards, and the player themselves
// for Wrapped and rivalry cards.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const userId = await userFromToken(bearerToken(req));
  if (!userId) return json(401, { error: 'Sign in to share.' });

  let body: { kind?: string; id?: string; extra?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request' });
  }

  let target: ShareTarget;
  switch (body.kind) {
    case 'season': {
      if (!body.id || !UUID_PATTERN.test(body.id)) return json(400, { error: 'Invalid season' });
      const seasons = await rest<{ league_id: string }[]>(`league_seasons?id=eq.${body.id}&select=league_id`);
      const leagueId = seasons?.[0]?.league_id;
      if (!leagueId || !(await isLeagueMember(leagueId, userId))) return json(403, { error: 'Only league members can share this season.' });
      target = { kind: 'season', id: body.id, extra: '' };
      break;
    }
    case 'league': {
      if (!body.id || !UUID_PATTERN.test(body.id)) return json(400, { error: 'Invalid league' });
      if (!(await isLeagueMember(body.id, userId))) return json(403, { error: 'Only league members can invite people.' });
      target = { kind: 'league', id: body.id, extra: userId };
      break;
    }
    case 'wrapped': {
      const year = Number(body.extra ?? new Date().getUTCFullYear());
      if (!Number.isInteger(year) || year < 2020 || year > new Date().getUTCFullYear()) return json(400, { error: 'Invalid year' });
      target = { kind: 'wrapped', id: userId, extra: String(year) };
      break;
    }
    case 'rivalry': {
      if (!body.extra || !UUID_PATTERN.test(body.extra) || body.extra === userId) return json(400, { error: 'Invalid opponent' });
      target = { kind: 'rivalry', id: userId, extra: body.extra };
      break;
    }
    default:
      return json(400, { error: 'Unknown card' });
  }

  return json(200, { url: shareUrl(target, await signTarget(target)) });
}
