import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AnalyticsStats } from '../../hooks/useScoringAnalytics';

interface StatsCardsProps {
  stats: AnalyticsStats;
  analyzed: any[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, analyzed }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4">
        <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Average Score</p>
        <p className="text-3xl font-bold text-blue-300">{stats.avgScore}%</p>
        <p className="text-slate-500 text-xs mt-2">{stats.totalAnalyzed} permits analyzed</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-lg p-4">
        <p className="text-slate-400 text-xs uppercase font-semibold mb-1">High Confidence (80+)</p>
        <p className="text-3xl font-bold text-emerald-300">{stats.highConfidencePercent}%</p>
        <p className="text-slate-500 text-xs mt-2">{stats.highConfidenceCount} leads</p>
      </div>

      <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-lg p-4">
        <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Medium Confidence (40-79)</p>
        <p className="text-3xl font-bold text-yellow-300">
          {Math.round(
            ((analyzed.length - stats.highConfidenceCount - stats.lowConfidenceCount) / analyzed.length) * 100
          )}
          %
        </p>
        <p className="text-slate-500 text-xs mt-2">
          {analyzed.length - stats.highConfidenceCount - stats.lowConfidenceCount} leads
        </p>
      </div>

      <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-lg p-4">
        <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Low Confidence (&lt;40)</p>
        <p className="text-3xl font-bold text-red-300">{stats.lowConfidencePercent}%</p>
        <p className="text-slate-500 text-xs mt-2">{stats.lowConfidenceCount} leads</p>
      </div>
    </div>
  );
};
