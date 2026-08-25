function pickWinners(players, ranking) {
  if (!players || players.length === 0) return [];
  const scores = players.map((p) => p.totalScore ?? 0);
  const best = ranking === 'low-wins' ? Math.min(...scores) : Math.max(...scores);
  return players.filter((p) => (p.totalScore ?? 0) === best);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchGame(gameId) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || !gameId) return null;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/games?id=eq.${encodeURIComponent(gameId)}&select=id,name,players,ranking,status`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

export default async function handler(req, res) {
  const { gameId } = req.query;
  const siteUrl = process.env.SITE_URL || 'https://scorekeeper.ryanparag.com';
  const gameUrl = `${siteUrl}/game/${encodeURIComponent(gameId || '')}`;

  const game = await fetchGame(Array.isArray(gameId) ? gameId[0] : gameId);

  let title = 'ScoreKeeper';
  let description = "Add players and track scores across all your favorite card games";
  const imageUrl = `${siteUrl}/api/og-game?gameId=${encodeURIComponent(gameId || '')}`;

  if (game && Array.isArray(game.players) && game.players.length > 0) {
    const ranking = game.ranking === 'low-wins' ? 'low-wins' : 'high-wins';
    const winners = pickWinners(game.players, ranking);
    const gameName = game.name || 'a game';

    title = winners.length > 1
      ? `${winners.map((w) => w.name).join(' & ')} tied in ${gameName}!`
      : `${winners[0].name} won ${gameName} with ${winners[0].totalScore} pts!`;

    const standings = [...game.players]
      .sort((a, b) => (ranking === 'low-wins' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore))
      .map((p) => `${p.name} (${p.totalScore ?? 0})`)
      .join(', ');
    description = `Final standings: ${standings}`;
  }

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeGameUrl = escapeHtml(gameUrl);
  const safeImageUrl = escapeHtml(imageUrl);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${safeGameUrl}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${safeGameUrl}" />
    <meta property="twitter:title" content="${safeTitle}" />
    <meta property="twitter:description" content="${safeDescription}" />
    <meta property="twitter:image" content="${safeImageUrl}" />
    <meta http-equiv="refresh" content="0; url=${safeGameUrl}" />
    <script>window.location.replace(${JSON.stringify(gameUrl)});</script>
  </head>
  <body>
    <p>Redirecting to <a href="${safeGameUrl}">${safeTitle}</a>&hellip;</p>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
