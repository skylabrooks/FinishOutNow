import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CHART_TOOLTIP_STYLE, CHART_THEME } from '../../utils/chartConfig';
import { CHART_COLORS } from '../../utils/colorMappings';
import { CategoryData } from '../../hooks/useScoringAnalytics';

interface CategoryPieChartProps {
  data: CategoryData[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Lead Distribution by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data as any}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
            ))}
          </Pie>
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value) => `${value} leads`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
