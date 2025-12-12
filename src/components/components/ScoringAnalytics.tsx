import React from 'react';
import { EnrichedPermit } from '../types';
import { Zap } from 'lucide-react';
import { useScoringAnalytics } from '../hooks/useScoringAnalytics';
import { StatsCards } from './charts/StatsCards';
import { ScoreDistributionChart } from './charts/ScoreDistributionChart';
import { ScoreTrendChart } from './charts/ScoreTrendChart';
import { ScoreByGroup } from './charts/ScoreByGroup';
import { CategoryPieChart } from './charts/CategoryPieChart';
import { KeyInsights } from './charts/KeyInsights';

interface ScoringAnalyticsProps {
  permits: EnrichedPermit[];
}

export default function ScoringAnalytics({ permits }: ScoringAnalyticsProps) {
  const {
    analyzed,
    scoreDistribution,
    byPermitType,
    byCity,
    byCategory,
    stats,
    scoreTrend,
  } = useScoringAnalytics(permits);

  if (analyzed.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 text-center text-slate-400">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Run AI analysis on permits to see scoring patterns</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} analyzed={analyzed} />
      <ScoreDistributionChart data={scoreDistribution} />
      <ScoreTrendChart data={scoreTrend} />
      <ScoreByGroup
        title="Average Score by Permit Type"
        data={byPermitType}
        barColor="bg-blue-500"
        textColor="text-blue-300"
      />
      <ScoreByGroup
        title="Average Score by City"
        data={byCity}
        barColor="bg-emerald-500"
        textColor="text-emerald-300"
      />
      <CategoryPieChart data={byCategory} />
      <KeyInsights
        byPermitType={byPermitType}
        byCity={byCity}
        byCategory={byCategory}
        stats={stats}
        analyzed={analyzed}
      />
    </div>
  );
}
