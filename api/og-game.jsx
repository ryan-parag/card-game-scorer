import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const WIDTH = 1200;
const HEIGHT = 630;

function pickWinners(players, ranking) {
  if (!players || players.length === 0) return [];
  const scores = players.map((p) => p.totalScore ?? 0);
  const best = ranking === 'low-wins' ? Math.min(...scores) : Math.max(...scores);
  return players.filter((p) => (p.totalScore ?? 0) === best);
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

function FallbackCard() {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1c1917 0%, #451a03 100%)',
        color: '#fde68a',
        fontSize: 56,
        fontWeight: 700,
      }}
    >
      🏆 ScoreKeeper
    </div>
  );
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');

  const game = await fetchGame(gameId);
  if (!game || !Array.isArray(game.players) || game.players.length === 0) {
    return new ImageResponse(<FallbackCard />, { width: WIDTH, height: HEIGHT });
  }

  const ranking = game.ranking === 'low-wins' ? 'low-wins' : 'high-wins';
  const winners = pickWinners(game.players, ranking);
  const standings = [...game.players]
    .sort((a, b) => (ranking === 'low-wins' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore))
    .slice(0, 5);

  const headline = winners.length > 1
    ? `${winners.map((w) => w.name).join(' & ')} tied!`
    : `${winners[0].name} wins!`;

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', color: '#a8a29e', fontSize: 28, marginBottom: 8 }}>
          🃏 ScoreKeeper
        </div>
        <div style={{ display: 'flex', color: '#78716c', fontSize: 30, marginBottom: 24 }}>
          {game.name || 'Game results'}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 20,
            color: '#fde68a',
            fontSize: 64,
            fontWeight: 800,
            marginBottom: 40,
          }}
        >
          🏆 {headline}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          {standings.map((player, i) => (
            <div key={player.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  color: '#ffffff',
                  fontSize: 24,
                  fontWeight: 700,
                  backgroundColor: player.color || '#57534e',
                }}
              >
                {i + 1}
              </div>
              <div style={{ display: 'flex', flex: 1, color: '#e7e5e4', fontSize: 34, fontWeight: 600 }}>
                {player.name}
              </div>
              <div style={{ display: 'flex', color: '#fde68a', fontSize: 34, fontWeight: 700 }}>
                {player.totalScore ?? 0} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
