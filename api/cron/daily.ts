import { rest, restWrite } from '../_lib/share.js';
import { deliverNotification, hasSecret, NotificationRow } from '../_lib/notify.js';
import { buildWeeklyDigests } from '../_lib/digest.js';
import { ApiRequest, ApiResponse, header } from '../_lib/http.js';

// Runs once a day (see "crons" in vercel.json). Vercel sends
// Authorization: Bearer <CRON_SECRET> when that env var is set.
//   1. Queue "season ended" emails for seasons that hit their end date.
//   2. On Mondays, queue each person's weekly digest.
//   3. Send anything queued that hasn't gone out yet (webhook missed it,
//      Resend was down, …).
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!hasSecret(header(req, 'authorization'), process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const summary: Record<string, unknown> = {};

  const ended = await restWrite<number>('POST', 'rpc/queue_ended_seasons', {});
  summary.endedSeasons = ended.ok ? ended.data : ended.error;

  if (now.getUTCDay() === 1) {
    const digests = await buildWeeklyDigests(now);
    if (digests.length > 0) {
      const queued = await restWrite<unknown[]>(
        'POST',
        'notifications?on_conflict=dedupe_key',
        digests.map(d => ({
          user_id: d.userId,
          type: 'weekly_digest',
          data: d.digest,
          dedupe_key: `weekly_digest:${d.userId}:${d.weekKey}`,
        })),
        'resolution=ignore-duplicates,return=minimal',
      );
      summary.digests = queued.ok ? digests.length : queued.error;
    } else {
      summary.digests = 0;
    }
  }

  // Give the webhook a few minutes before stepping in, and stop retrying old
  // ones — a three-day-old "season started" email isn't worth sending.
  const olderThan = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const newerThan = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const pending = await rest<Pick<NotificationRow, 'id'>[]>(
    `notifications?emailed_at=is.null&email_skipped=is.null&email_attempts=lt.3` +
      `&created_at=lt.${encodeURIComponent(olderThan)}&created_at=gt.${encodeURIComponent(newerThan)}` +
      `&select=id&order=created_at.asc&limit=200`,
  );

  // Digests were just queued, so include those too.
  const todaysDigests = now.getUTCDay() === 1
    ? await rest<Pick<NotificationRow, 'id'>[]>(
        `notifications?type=eq.weekly_digest&emailed_at=is.null&email_skipped=is.null` +
          `&created_at=gte.${encodeURIComponent(new Date(now.getTime() - 60 * 60 * 1000).toISOString())}&select=id&limit=1000`,
      )
    : [];

  const ids = [...new Set([...(pending ?? []), ...(todaysDigests ?? [])].map(n => n.id))];
  const results: Record<string, number> = {};
  for (const id of ids) {
    const result = await deliverNotification(id);
    results[result] = (results[result] ?? 0) + 1;
  }
  summary.delivered = results;

  return res.status(200).json(summary);
}
