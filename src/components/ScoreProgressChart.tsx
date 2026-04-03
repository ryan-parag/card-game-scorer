import React, { useEffect } from 'react';
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
import { Player } from '../types/game';

interface ScoreProgressChartProps {
  players: Player[];
  isDark?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  isDark,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
  isDark: boolean;
}) => {
  if (!active || !payload) return null;

  const tooltipBg = isDark ? '#1c1917' : '#ffffff';
  const tooltipBorder = isDark ? '#44403c' : '#e7e5e4';
  const textColor = isDark ? '#d6d3d1' : '#292524';

  // Sort payload by score (descending)
  const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div
      style={{
        backgroundColor: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
        fontSize: '12px',
      }}
    >
      <p className="!rounded-none" style={{ color: textColor, margin: '0 0 0.5rem 0', fontWeight: 'bold', borderBottom: `1px solid ${tooltipBorder}`, borderRadius: '0.25rem', padding: '0.25rem' }}>
        Round {label}
      </p>
      {sortedPayload.map((entry, index) => (
        <p key={index} style={{ color: entry.color, margin: '0.25rem 0' }}>
          {entry.name}: <strong>{Math.round(entry.value)}</strong>
        </p>
      ))}
    </div>
  );
};

/**
 * Transforms player round scores into chart data format.
 * Each data point represents a round with cumulative scores for each player.
 * Starts with round 0 where all players have 0 points.
 */
const transformDataForChart = (players: Player[]) => {
  const maxRounds = Math.max(...players.map(p => p.roundScores.length), 0);
  
  const data: Array<Record<string, number | string>> = [];
  
  // Add starting point at round 0 with all players at 0
  const startData: Record<string, number | string> = {
    round: 'Start',
  };
  players.forEach(player => {
    startData[player.id] = 0;
  });
  data.push(startData);
  
  // Add actual rounds
  for (let roundIndex = 0; roundIndex < maxRounds; roundIndex++) {
    const roundData: Record<string, number> = {
      round: roundIndex + 1,
    };

    players.forEach(player => {
      // Calculate cumulative score up to this round
      let cumulativeScore = 0;
      for (let i = 0; i <= roundIndex; i++) {
        if (player.roundScores[i] !== undefined) {
          cumulativeScore += player.roundScores[i];
        }
      }
      roundData[player.id] = cumulativeScore;
    });

    data.push(roundData);
  }

  return data;
};

export const ScoreProgressChart: React.FC<ScoreProgressChartProps> = ({
  players,
  isDark = false,
}) => {
  const [hoveredPlayerId, setHoveredPlayerId] = React.useState<string | null>(null);
  const chartData = transformDataForChart(players);

  // Set up event listeners for legend items
  useEffect(() => {
    const legendItems = document.querySelectorAll('.recharts-legend-item');
    
    const handleMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const playerName = target.textContent?.trim();
      const player = players.find(p => p.name === playerName);
      if (player) {
        setHoveredPlayerId(player.id);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPlayerId(null);
    };

    legendItems.forEach(item => {
      item.addEventListener('mouseenter', handleMouseEnter as EventListener);
      item.addEventListener('mouseleave', handleMouseLeave as EventListener);
    });

    return () => {
      legendItems.forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter as EventListener);
        item.removeEventListener('mouseleave', handleMouseLeave as EventListener);
      });
    };
  }, [players]);

  // Colors for the chart background and text based on dark mode
  const gridColor = isDark ? '#292524' : '#f5f5f5';
  const textColor = isDark ? '#d6d3d1' : '#292524';

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 dark:text-stone-400">
        No scoring data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300} className="focus:outline-none">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={gridColor}
          opacity={0.5}
        />
        <XAxis
          dataKey="round"
          stroke={textColor}
          label={{ value: 'Round', position: 'insideBottomRight', offset: -5 }}
          style={{ fontSize: '0.875rem' }}
        />
        <YAxis
          stroke={textColor}
          label={{ value: 'Total Score', angle: -90, position: 'insideLeft' }}
          style={{ fontSize: '0.875rem' }}
        />
        <Tooltip
          content={<CustomTooltip isDark={isDark} />}
          cursor={{ stroke: textColor, strokeOpacity: 0.1 }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '1rem', color: textColor }}
          iconType="line"
        />
        {players.map((player) => {
          const isHovered = hoveredPlayerId === null || hoveredPlayerId === player.id;
          const opacity = isHovered ? 1 : 0.2;

          return (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.id}
              stroke={player.color}
              strokeWidth={2}
              strokeOpacity={opacity}
              dot={{ fill: player.color, r: 4, opacity }}
              activeDot={{ r: 6, opacity }}
              name={player.name}
              isAnimationActive={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};
