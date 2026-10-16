import { parseTarget, verifyTarget, targetQuery, destinationPath, siteUrl, escapeHtml } from './_lib/share';
import { loadCard, cardText } from './_lib/cardData';

export const config = { runtime: 'edge' };

// Link preview page for /share/<kind>/<id>: serves the card's title and image
// to chat apps, then sends people on to the matching page in the app.
export default async function handler(req: Request) {
  const params = new URL(req.url).searchParams;
  const target = parseTarget(params);
  const signature = params.get('s');
  const valid = !!target && (await verifyTarget(target, signature));
  const card = valid && target ? await loadCard(target) : null;

  const destination = `${siteUrl()}${
    target ? destinationPath(target, card?.kind === 'season' ? card.leagueId : null) : '/'
  }`;
  const { title, description } = card
    ? cardText(card)
    : { title: 'ScoreKeeper', description: 'Add players and track scores across all your favorite card games' };
  const imageUrl = card && target && signature
    ? `${siteUrl()}/api/og-card?${targetQuery(target, signature)}`
    : `${siteUrl()}/api/og-game`;

  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(destination);
  const i = escapeHtml(imageUrl);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${u}" />
    <meta property="twitter:title" content="${t}" />
    <meta property="twitter:description" content="${d}" />
    <meta property="twitter:image" content="${i}" />
    <meta http-equiv="refresh" content="0; url=${u}" />
    <script>window.location.replace(${JSON.stringify(destination).replace(/</g, '\\u003c')});</script>
  </head>
  <body>
    <p>Redirecting to <a href="${u}">${t}</a>&hellip;</p>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}
