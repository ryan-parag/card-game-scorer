import { supabase } from '../lib/supabase';

// Share cards (season standings, league invites, Wrapped, rivalries) live at
// signed links that only someone the card is about can create — see
// api/share-link.ts.
export type ShareCardRequest =
  | { kind: 'season'; id: string }
  | { kind: 'league'; id: string }
  | { kind: 'wrapped'; extra: string }
  | { kind: 'rivalry'; extra: string };

export const shareRequestKey = (request: ShareCardRequest) =>
  `${request.kind}:${'id' in request ? request.id : ''}:${'extra' in request ? request.extra : ''}`;

export async function requestShareLink(request: ShareCardRequest): Promise<string> {
  if (!supabase) throw new Error('Sharing needs an online account.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to share.');

  const res = await fetch('/api/share-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(request),
  });
  // The Vite dev server has no /api routes; they only run under `vercel dev` or a deploy.
  if (res.status === 404) throw new Error('Sharing is unavailable here. Run the app with `npm run dev:api` to use it locally.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.url !== 'string') throw new Error(data.error ?? 'Could not create a share link.');
  return data.url;
}

// Opens the share sheet where there is one, otherwise copies the link.
export async function shareOrCopy(url: string, title: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
      // Fall through to copying, e.g. when the browser blocks the share sheet.
    }
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}
