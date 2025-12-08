import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { CHART_GRID_PROPS, CHART_AXIS_PROPS, CHART_TOOLTIP_STYLE, CHART_BAR_RADIUS } from '../../utils/chartConfig';
import { ScoreDistributionData } from '../../hooks/useScoringAnalytics';

interface ScoreDistributionChartProps {
  data: ScoreDistributionData[];
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Confidence Score Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid {...CHART_GRID_PROPS} />
          <XAxis dataKey="range" {...CHART_AXIS_PROPS} />
          <YAxis {...CHART_AXIS_PROPS} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            cursor={{ fill: '#334155', opacity: 0.4 }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={CHART_BAR_RADIUS}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
