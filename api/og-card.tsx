import type { ReactNode } from 'react';
import { ImageResponse } from '@vercel/og';
import { parseTarget, verifyTarget } from './_lib/share.js';
import { loadCard, CardData, SeasonCard, LeagueCard, WrappedCard, RivalryCard } from './_lib/cardData.js';

export const config = { runtime: 'edge' };

const WIDTH = 1200;
const HEIGHT = 630;

const C = {
  text: '#e7e5e4',
  muted: '#a8a29e',
  faint: '#78716c',
  tile: 'rgba(255,255,255,0.06)',
  tileBorder: 'rgba(255,255,255,0.08)',
};

const ACCENTS: Record<CardData['kind'], { color: string; background: string }> = {
  season: { color: '#fde68a', background: 'linear-gradient(135deg, #1c1917 0%, #292524 60%, #422006 100%)' },
  league: { color: '#c7d2fe', background: 'linear-gradient(135deg, #1c1917 0%, #1e1b4b 100%)' },
  wrapped: { color: '#a7f3d0', background: 'linear-gradient(135deg, #1c1917 0%, #022c22 100%)' },
  rivalry: { color: '#fecaca', background: 'linear-gradient(135deg, #172554 0%, #1c1917 50%, #450a0a 100%)' },
};

const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?';

function Frame({ kind, eyebrow, children }: { kind: CardData['kind']; eyebrow: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 64px',
        background: ACCENTS[kind].background,
        fontFamily: 'sans-serif',
        color: C.text,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', color: C.muted, fontSize: 28 }}>🃏 ScoreKeeper</div>
        <div style={{ display: 'flex', color: ACCENTS[kind].color, fontSize: 24, fontWeight: 600, letterSpacing: 1 }}>
          {eyebrow.toUpperCase()}
        </div>
      </div>
      {children}
    </div>
  );
}

function Tile({ label, value, accent, flex = 1 }: { label: string; value: string; accent: string; flex?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex,
        padding: '22px 26px',
        borderRadius: 20,
        background: C.tile,
        border: `1px solid ${C.tileBorder}`,
      }}
    >
      <div style={{ display: 'flex', color: C.muted, fontSize: 22, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', color: accent, fontSize: 44, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function SeasonCardView({ card }: { card: SeasonCard }) {
  const accent = ACCENTS.season.color;
  const started = card.gamesPlayed > 0 && card.leaders.length > 0;
  const leaders = card.leaders.join(' & ');
  const headline = !started
    ? `${card.seasonName} is starting`
    : card.status === 'completed'
      ? `🏆 ${leaders} ${card.leaders.length > 1 ? 'shared' : 'won'} ${card.seasonName}`
      : `👑 ${leaders} ${card.leaders.length > 1 ? 'are tied for the lead' : 'leads'}`;

  return (
    <Frame kind="season" eyebrow={card.status === 'completed' ? 'Season final' : 'Season standings'}>
      <div style={{ display: 'flex', color: C.faint, fontSize: 30, marginBottom: 8 }}>
        {truncate(`${card.leagueName} · ${card.seasonName}`, 60)}
      </div>
      <div style={{ display: 'flex', color: accent, fontSize: 58, fontWeight: 800, marginBottom: 30 }}>
        {truncate(headline, 40)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {card.standings.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 46,
                height: 46,
                borderRadius: 999,
                backgroundColor: row.color || '#57534e',
                color: '#ffffff',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {row.rank}
            </div>
            <div style={{ display: 'flex', flex: 1, fontSize: 32, fontWeight: 600 }}>{truncate(row.name, 28)}</div>
            <div style={{ display: 'flex', color: C.muted, fontSize: 26, marginRight: 28 }}>
              {row.wins} {row.wins === 1 ? 'win' : 'wins'}
            </div>
            <div style={{ display: 'flex', color: accent, fontSize: 32, fontWeight: 700 }}>{row.score} pts</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', color: C.faint, fontSize: 24 }}>
        {card.gamesPlayed} {card.gamesPlayed === 1 ? 'game' : 'games'} played
      </div>
    </Frame>
  );
}

function LeagueCardView({ card }: { card: LeagueCard }) {
  const accent = ACCENTS.league.color;
  const shown = card.memberNames.slice(0, 7);
  const extra = card.memberCount - shown.length;
  return (
    <Frame kind="league" eyebrow="League invite">
      <div style={{ display: 'flex', color: C.muted, fontSize: 32, marginBottom: 6 }}>
        {card.inviterName ? `${truncate(card.inviterName, 24)} invited you to join` : "You're invited to join"}
      </div>
      <div style={{ display: 'flex', color: accent, fontSize: 76, fontWeight: 800, marginBottom: 10 }}>
        {truncate(card.leagueName, 26)}
      </div>
      <div style={{ display: 'flex', color: C.faint, fontSize: 28, marginBottom: 30, height: 36 }}>
        {card.description ? truncate(card.description, 70) : ''}
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 34 }}>
        <Tile label="Members" value={String(card.memberCount)} accent={accent} />
        <Tile label="Seasons" value={String(card.seasonCount)} accent={accent} />
        <Tile label="Games played" value={String(card.gamesPlayed)} accent={accent} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {shown.map((name, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: 999,
              background: '#312e81',
              border: '3px solid #1e1b4b',
              color: '#e0e7ff',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {initials(name)}
          </div>
        ))}
        {extra > 0 && <div style={{ display: 'flex', color: C.muted, fontSize: 26, marginLeft: 8 }}>+{extra} more</div>}
      </div>
    </Frame>
  );
}

function WrappedCardView({ card }: { card: WrappedCard }) {
  const accent = ACCENTS.wrapped.color;
  const rival = card.topRival;
  return (
    <Frame kind="wrapped" eyebrow={card.yearInProgress ? `${card.year} so far` : `${card.year} wrapped`}>
      <div style={{ display: 'flex', color: accent, fontSize: 68, fontWeight: 800, marginBottom: 30 }}>
        {truncate(`${card.playerName}'s ${card.year}`, 28)}
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <Tile label="Games" value={String(card.gamesPlayed)} accent={accent} />
        <Tile label="Wins" value={String(card.wins)} accent={accent} />
        <Tile label="Win rate" value={`${Math.round(card.winRate * 100)}%`} accent={accent} />
        <Tile label="Best streak" value={String(card.longestWinStreak)} accent={accent} />
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <Tile
          label={card.favoriteGame ? `Most played · ${card.favoriteGameCount} games` : 'Most played'}
          value={truncate(card.favoriteGame ?? '—', 18)}
          accent={C.text}
        />
        <Tile
          label={rival ? `Top rival · ${rival.wins}–${rival.losses} in ${rival.gamesTogether} games` : 'Top rival'}
          value={truncate(rival?.name ?? '—', 18)}
          accent={C.text}
        />
      </div>
    </Frame>
  );
}

function RivalryCardView({ card }: { card: RivalryCard }) {
  const leader = card.wins === card.losses ? null : card.wins > card.losses ? card.playerName : card.opponentName;
  const name = (value: string, color: string, align: 'flex-start' | 'flex-end') => (
    <div style={{ display: 'flex', flex: 1, justifyContent: align, color, fontSize: 52, fontWeight: 800 }}>
      {truncate(value, 14)}
    </div>
  );
  return (
    <Frame kind="rivalry" eyebrow="Head-to-head">
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 20, marginBottom: 12 }}>
        {name(card.playerName, '#bfdbfe', 'flex-start')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 112, fontWeight: 800, color: '#ffffff' }}>
          <div style={{ display: 'flex', color: '#93c5fd' }}>{card.wins}</div>
          <div style={{ display: 'flex', color: C.faint, fontSize: 72 }}>–</div>
          <div style={{ display: 'flex', color: '#fca5a5' }}>{card.losses}</div>
        </div>
        {name(card.opponentName, '#fecaca', 'flex-end')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', color: C.muted, fontSize: 32, marginBottom: 44 }}>
        {leader ? `${truncate(leader, 20)} leads the rivalry` : 'All square'}
        {card.ties > 0 ? ` · ${card.ties} ${card.ties === 1 ? 'tie' : 'ties'}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <Tile label="Games together" value={String(card.gamesPlayed)} accent={C.text} />
        <Tile label="Most played" value={truncate(card.favoriteGame ?? '—', 14)} accent={C.text} flex={1.4} />
        <Tile
          label={card.lastResult ? `Last game · ${truncate(card.lastResult.gameName, 16)}` : 'Last game'}
          value={card.lastResult ? (card.lastResult.winnerName ? `${truncate(card.lastResult.winnerName, 10)} won` : 'Tie') : '—'}
          accent={C.text}
          flex={1.4}
        />
      </div>
    </Frame>
  );
}

function FallbackCard() {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
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

function CardView({ card }: { card: CardData }) {
  switch (card.kind) {
    case 'season': return <SeasonCardView card={card} />;
    case 'league': return <LeagueCardView card={card} />;
    case 'wrapped': return <WrappedCardView card={card} />;
    case 'rivalry': return <RivalryCardView card={card} />;
  }
}

export default async function handler(req: Request) {
  const params = new URL(req.url).searchParams;
  const target = parseTarget(params);
  const card = target && (await verifyTarget(target, params.get('s'))) ? await loadCard(target) : null;

  return new ImageResponse(card ? <CardView card={card} /> : <FallbackCard />, {
    width: WIDTH,
    height: HEIGHT,
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400' },
  });
}
