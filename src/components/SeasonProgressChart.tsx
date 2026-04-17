import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { X, Maximize2 } from 'lucide-react';
import moment from 'moment';
import { Game } from '../types/game';
import { LeagueMember } from '../hooks/useLeagues';
import { ScoringSystem } from '../hooks/useScoringSystem';

interface SeasonProgressChartProps {
  games: Game[];
  members: LeagueMember[];
  activeSystem: ScoringSystem | null;
  seasonStartDate: string;
  isDark: boolean;
}

interface PlayerMeta {
  displayName: string;
  color: string;
}

type ScoreMode = 'total' | 'game-pts';

function buildChartData(
  games: Game[],
  members: LeagueMember[],
  activeSystem: ScoringSystem | null,
  seasonStartDate: string,
  scoreMode: ScoreMode = 'total',
): {
  chartData: Array<Record<string, number | string>>;
  players: Array<{ key: string } & PlayerMeta>;
} {
  const completed = [...games.filter(g => g.status === 'completed')].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );

  // Build an ordered registry of all players seen across all games
  const registry = new Map<string, PlayerMeta>();
  for (const game of completed) {
    for (const player of game.players) {
      const member = members.find(m => m.user_id === player.id);
      const key = member?.user_id ?? player.name;
      if (!registry.has(key)) {
        registry.set(key, {
          displayName: member
            ? (member.profile.display_name ?? member.profile.email.split('@')[0])
            : player.name,
          color: player.color ?? '#888',
        });
      }
    }
  }

  const players = Array.from(registry.entries()).map(([key, meta]) => ({ key, ...meta }));

  // Start point — every player at 0
  const startPoint: Record<string, number | string> = {
    label: moment(seasonStartDate).format('MMM D'),
    gameName: 'Season start',
  };
  players.forEach(p => { startPoint[p.key] = 0; });

  const chartData: Array<Record<string, number | string>> = [startPoint];
  const runningTotals: Record<string, number> = {};
  players.forEach(p => { runningTotals[p.key] = 0; });

  const useRankPts = scoreMode === 'total' && activeSystem != null;

  for (const game of completed) {
    const sorted = [...game.players].sort((a, b) =>
      game.ranking === 'low-wins'
        ? a.totalScore - b.totalScore
        : b.totalScore - a.totalScore,
    );

    sorted.forEach((player, posIndex) => {
      const member = members.find(m => m.user_id === player.id);
      const key = member?.user_id ?? player.name;
      const score = useRankPts
        ? (activeSystem!.rules.find(r => r.rank === posIndex + 1)?.points ?? 0)
        : player.totalScore;
      runningTotals[key] = (runningTotals[key] ?? 0) + score;
    });

    const point: Record<string, number | string> = {
      label: moment(game.updatedAt).format('MMM D'),
      gameName: game.name,
    };
    players.forEach(p => { point[p.key] = runningTotals[p.key] ?? 0; });
    chartData.push(point);
  }

  return { chartData, players };
}

const CustomTooltip = ({
  active,
  payload,
  label,
  isDark,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: Record<string, string> }>;
  label?: string;
  isDark: boolean;
}) => {
  if (!active || !payload?.length) return null;

  const bg = isDark ? '#1c1917' : '#ffffff';
  const border = isDark ? '#44403c' : '#e7e5e4';
  const text = isDark ? '#d6d3d1' : '#292524';
  const gameName = payload[0]?.payload?.gameName;
  const sorted = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '0.5rem', padding: '0.75rem', fontSize: '12px' }}>
      <p style={{ color: text, margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{gameName}</p>
      <p style={{ color: text, margin: '0 0 0.5rem 0', opacity: 0.6, borderBottom: `1px solid ${border}`, paddingBottom: '0.5rem' }}>{label}</p>
      {sorted.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '0.2rem 0' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

interface ChartContentProps {
  players: Array<{ key: string } & PlayerMeta>;
  chartData: Array<Record<string, number | string>>;
  hoveredKey: string | null;
  isDark: boolean;
  height?: number;
}

const ChartContent: React.FC<ChartContentProps> = ({ players, chartData, hoveredKey, isDark, height = 280 }) => {
  const grid = isDark ? '#292524' : '#f5f5f5';
  const textColor = isDark ? '#d6d3d1' : '#292524';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} opacity={0.5} />
        <XAxis dataKey="label" stroke={textColor} style={{ fontSize: '0.75rem' }} />
        <YAxis
          stroke={textColor}
          style={{ fontSize: '0.75rem' }}
          label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fontSize: '0.75rem', fill: textColor } }}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: textColor, strokeOpacity: 0.1 }} />
        <Legend wrapperStyle={{ paddingTop: '1rem', color: textColor, fontSize: '0.75rem' }} iconType="line" />
        {players.map(p => {
          const active = hoveredKey === null || hoveredKey === p.key;
          return (
            <Line
              key={p.key}
              type="monotone"
              dataKey={p.key}
              name={p.displayName}
              stroke={p.color}
              strokeWidth={2}
              strokeOpacity={active ? 1 : 0.15}
              dot={{ fill: p.color, r: 4, opacity: active ? 1 : 0.15 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SeasonProgressChart: React.FC<SeasonProgressChartProps> = ({
  games,
  members,
  activeSystem,
  seasonStartDate,
  isDark,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scoreMode, setScoreMode] = useState<ScoreMode>('total');

  const { chartData, players } = buildChartData(games, members, activeSystem, seasonStartDate, scoreMode);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  // Need at least one completed game beyond the start point
  if (chartData.length <= 1) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No completed games yet
      </div>
    );
  }

  const handleLegendMouseEnter = (e: { dataKey?: string }) => {
    if (e.dataKey) setHoveredKey(e.dataKey);
  };
  const handleLegendMouseLeave = () => setHoveredKey(null);

  const tabs = activeSystem ? (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs shadow-inner border border-black/5 dark:border-white/5">
      <button
        onClick={() => setScoreMode('total')}
        className={`px-2.5 py-1 rounded-md transition-colors ${scoreMode === 'total' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
      >
        Total Score
      </button>
      <button
        onClick={() => setScoreMode('game-pts')}
        className={`px-2.5 py-1 rounded-md transition-colors ${scoreMode === 'game-pts' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
      >
        Game Pts only
      </button>
    </div>
  ) : null;

  return (
    <>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          {tabs ?? <span />}
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Expand chart"
          >
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <ChartContent
          players={players}
          chartData={chartData}
          hoveredKey={hoveredKey}
          isDark={isDark}
          height={280}
        />
      </div>

      {isFullscreen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsFullscreen(false); }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full h-full max-w-full max-h-screen flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-foreground">Season Score Progression</h2>
                {activeSystem && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {scoreMode === 'total' ? 'Total Score (rank pts + game pts)' : 'Game Pts only'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {tabs}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <ChartContent
                players={players}
                chartData={chartData}
                hoveredKey={hoveredKey}
                isDark={isDark}
                height={Math.max(400, window.innerHeight - 200)}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
