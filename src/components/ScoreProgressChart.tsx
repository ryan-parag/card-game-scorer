import React from 'react';
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

/**
 * Transforms player round scores into chart data format.
 * Each data point represents a round with cumulative scores for each player.
 */
const transformDataForChart = (players: Player[]) => {
  const maxRounds = Math.max(...players.map(p => p.roundScores.length), 0);
  
  const data: Array<Record<string, number>> = [];
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
  const chartData = transformDataForChart(players);

  // Colors for the chart background and text based on dark mode
  const gridColor = isDark ? '#292524' : '#f5f5f5';
  const textColor = isDark ? '#d6d3d1' : '#292524';
  const tooltipBg = isDark ? '#1c1917' : '#ffffff';
  const tooltipBorder = isDark ? '#44403c' : '#e7e5e4';

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 dark:text-stone-400">
        No scoring data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize:'12px'
          }}
          labelStyle={{ color: textColor }}
          cursor={{ stroke: textColor, strokeOpacity: 0.1 }}
          formatter={(value, player) => {
            return [typeof value === 'number' ? Math.round(value) : value, players.find(p => p.id === player)?.name || player];
          }}
          labelFormatter={(label) => `Round ${label}`}
        />
        <Legend
          wrapperStyle={{ paddingTop: '1rem', color: textColor }}
          iconType="line"
        />
        {players.map((player) => (
          <Line
            key={player.id}
            type="monotone"
            dataKey={player.id}
            stroke={player.color}
            strokeWidth={2}
            dot={{ fill: player.color, r: 4 }}
            activeDot={{ r: 6 }}
            name={player.name}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
