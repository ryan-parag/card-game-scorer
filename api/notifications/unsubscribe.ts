import { restWrite, siteUrl, escapeHtml } from '../_lib/share.js';
import { EmailCategory, SETTING_COLUMN, verifyUnsubscribe } from '../_lib/notify.js';
import { ApiRequest, ApiResponse, queryParam } from '../_lib/http.js';

const LABELS: Record<EmailCategory, string> = {
  friend: 'friend request',
  league: 'league update',
  digest: 'weekly digest',
};

const page = (title: string, body: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} · ScoreKeeper</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f4; color: #1c1917; }
      main { max-width: 400px; background: #fff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 32px; text-align: center; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      p { color: #57534e; font-size: 14px; line-height: 1.5; }
      button, .link { display: inline-block; margin-top: 8px; padding: 10px 20px; border-radius: 8px; border: 0; font-size: 14px;
                      background: #1c1917; color: #fff; text-decoration: none; cursor: pointer; }
      .secondary { background: transparent; color: #57534e; text-decoration: underline; }
    </style>
  </head>
  <body><main>${body}</main></body>
</html>`;

// One-click unsubscribe from a notification email. GET shows a confirm button
// (so link scanners that open every URL don't unsubscribe people); POST does
// it, which is also what mail apps send for the List-Unsubscribe header.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const userId = queryParam(req, 'u') ?? '';
  const category = queryParam(req, 'c') as EmailCategory | null;
  const signature = queryParam(req, 's');
  const settingsLink = `<a class="link secondary" href="${siteUrl()}/profile">Manage all email settings</a>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (!category || !(category in SETTING_COLUMN) || !(await verifyUnsubscribe(userId, category, signature))) {
    return res.status(400).send(page('Link not valid', `<h1>This link isn't valid</h1><p>You can change which emails you get from your profile.</p>${settingsLink}`));
  }
  const label = LABELS[category];

  if (req.method === 'POST') {
    const result = await restWrite(
      'POST',
      'notification_settings?on_conflict=user_id',
      { user_id: userId, [SETTING_COLUMN[category]]: false, updated_at: new Date().toISOString() },
      'resolution=merge-duplicates,return=minimal',
    );
    if (!result.ok) {
      return res.status(500).send(page('Something went wrong', `<h1>Something went wrong</h1><p>Please try again, or turn off ${label} emails from your profile.</p>${settingsLink}`));
    }
    return res.status(200).send(page('Unsubscribed', `<h1>You're unsubscribed</h1><p>You won't get ${label} emails anymore.</p>${settingsLink}`));
  }

  return res.status(200).send(page('Unsubscribe', `<h1>Stop ${label} emails?</h1>
    <form method="post"><button type="submit">Unsubscribe</button></form>
    ${settingsLink}`));
}
