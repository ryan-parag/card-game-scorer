import { deliverNotification, hasSecret } from '../_lib/notify.js';
import { ApiRequest, ApiResponse, header } from '../_lib/http.js';

// Called by a Supabase Database Webhook whenever a row is inserted into
// public.notifications, so emails go out within seconds. Anything this misses
// is retried by the daily cron.
//
// Webhook setup (Supabase dashboard → Database → Webhooks):
//   table: notifications · events: Insert · type: HTTP request · method: POST
//   URL: https://<your site>/api/notifications/dispatch
//   header: Authorization: Bearer <NOTIFICATIONS_WEBHOOK_SECRET>
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasSecret(header(req, 'authorization'), process.env.NOTIFICATIONS_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as
    { type?: string; table?: string; record?: { id?: string } } | undefined;
  const id = body?.record?.id;
  if (body?.table !== 'notifications' || body?.type !== 'INSERT' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Expected a notifications INSERT webhook' });
  }

  const result = await deliverNotification(id);
  // 200 even when sending failed: the daily cron retries it, and a non-2xx
  // here would only make Supabase log noise.
  return res.status(200).json({ id, result });
}
