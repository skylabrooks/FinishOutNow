import React from 'react';
import { Award } from 'lucide-react';
import { PermitTypeData, CityData, CategoryData, AnalyticsStats } from '../../hooks/useScoringAnalytics';

interface KeyInsightsProps {
  byPermitType: PermitTypeData[];
  byCity: CityData[];
  byCategory: CategoryData[];
  stats: AnalyticsStats;
  analyzed: any[];
}

export const KeyInsights: React.FC<KeyInsightsProps> = ({
  byPermitType,
  byCity,
  byCategory,
  stats,
  analyzed,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-400" />
        Key Insights
      </h3>
      <div className="space-y-2 text-sm text-slate-300">
        <p>
          • <span className="font-semibold">{byPermitType[0]?.name}</span> has the highest average score (
          {byPermitType[0]?.average}%)
        </p>
        <p>
          • <span className="font-semibold">{byCity[0]?.name}</span> leads in {byCity[0]?.name} city (
          {byCity[0]?.average}%)
        </p>
        <p>
          • {stats.highConfidencePercent}% of analyzed leads are high confidence -{' '}
          <span className="font-semibold">good lead quality</span>
        </p>
        <p>
          • {byCategory.length} different lead categories identified across {analyzed.length} analyzed permits
        </p>
      </div>
    </div>
  );
};
