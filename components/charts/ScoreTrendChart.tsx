import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CHART_GRID_PROPS, CHART_AXIS_PROPS, CHART_TOOLTIP_STYLE } from '../../utils/chartConfig';
import { ScoreTrendData } from '../../hooks/useScoringAnalytics';

interface ScoreTrendChartProps {
  data: ScoreTrendData[];
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Recent Score Trend (Last 20 Analyzed)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid {...CHART_GRID_PROPS} />
          <XAxis dataKey="index" {...CHART_AXIS_PROPS} />
          <YAxis {...CHART_AXIS_PROPS} domain={[0, 100]} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            cursor={{ stroke: '#3b82f6', opacity: 0.5 }}
            formatter={(value) => `${value}%`}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            dot={{ fill: '#3b82f6', r: 4 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
