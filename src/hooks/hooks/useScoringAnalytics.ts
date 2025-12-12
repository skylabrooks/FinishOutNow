import { useMemo } from 'react';
import { EnrichedPermit } from '../types';

export interface ScoreDistributionData {
  range: string;
  min: number;
  max: number;
  count: number;
  color: string;
}

export interface PermitTypeData {
  name: string;
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface CityData {
  name: string;
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface CategoryData {
  name: string;
  value: number;
  average: number;
}

export interface ScoreTrendData {
  index: number;
  score: number;
  permitType: string;
}

export interface AnalyticsStats {
  avgScore: number;
  highConfidenceCount: number;
  highConfidencePercent: number;
  lowConfidenceCount: number;
  lowConfidencePercent: number;
  totalAnalyzed: number;
}

export const useScoringAnalytics = (permits: EnrichedPermit[]) => {
  const analyzed = permits.filter((p) => p.aiAnalysis);

  const scoreDistribution = useMemo((): ScoreDistributionData[] => {
    const bins: ScoreDistributionData[] = [
      { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
      { range: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
      { range: '41-60', min: 41, max: 60, count: 0, color: '#f59e0b' },
      { range: '61-80', min: 61, max: 80, count: 0, color: '#3b82f6' },
      { range: '81-100', min: 81, max: 100, count: 0, color: '#10b981' },
    ];

    analyzed.forEach((p) => {
      const score = p.aiAnalysis?.confidenceScore || 0;
      const bin = bins.find((b) => score >= b.min && score <= b.max);
      if (bin) bin.count++;
    });

    return bins;
  }, [analyzed]);

  const byPermitType = useMemo((): PermitTypeData[] => {
    const groups: Record<string, { scores: number[]; count: number }> = {};

    analyzed.forEach((p) => {
      const type = p.permitType;
      if (!groups[type]) {
        groups[type] = { scores: [], count: 0 };
      }
      groups[type].scores.push(p.aiAnalysis?.confidenceScore || 0);
      groups[type].count++;
    });

    return Object.entries(groups).map(([type, data]) => ({
      name: type,
      average: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      min: Math.min(...data.scores),
      max: Math.max(...data.scores),
      count: data.count,
    }));
  }, [analyzed]);

  const byCity = useMemo((): CityData[] => {
    const groups: Record<string, { scores: number[]; count: number }> = {};

    analyzed.forEach((p) => {
      const city = p.city;
      if (!groups[city]) {
        groups[city] = { scores: [], count: 0 };
      }
      groups[city].scores.push(p.aiAnalysis?.confidenceScore || 0);
      groups[city].count++;
    });

    return Object.entries(groups).map(([city, data]) => ({
      name: city,
      average: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      min: Math.min(...data.scores),
      max: Math.max(...data.scores),
      count: data.count,
    }));
  }, [analyzed]);

  const byCategory = useMemo((): CategoryData[] => {
    const groups: Record<string, { scores: number[]; count: number }> = {};

    analyzed.forEach((p) => {
      const cat = p.aiAnalysis?.category || 'Unknown';
      if (!groups[cat]) {
        groups[cat] = { scores: [], count: 0 };
      }
      groups[cat].scores.push(p.aiAnalysis?.confidenceScore || 0);
      groups[cat].count++;
    });

    return Object.entries(groups).map(([cat, data]) => ({
      name: cat,
      value: data.count,
      average: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    }));
  }, [analyzed]);

  const stats = useMemo((): AnalyticsStats => {
    const scores = analyzed.map((p) => p.aiAnalysis?.confidenceScore || 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highConfidence = scores.filter((s) => s >= 80).length;
    const lowConfidence = scores.filter((s) => s < 40).length;

    return {
      avgScore: avg,
      highConfidenceCount: highConfidence,
      highConfidencePercent: Math.round((highConfidence / scores.length) * 100) || 0,
      lowConfidenceCount: lowConfidence,
      lowConfidencePercent: Math.round((lowConfidence / scores.length) * 100) || 0,
      totalAnalyzed: scores.length,
    };
  }, [analyzed]);

  const scoreTrend = useMemo((): ScoreTrendData[] => {
    return analyzed
      .sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime())
      .slice(-20)
      .map((p, i) => ({
        index: i + 1,
        score: p.aiAnalysis?.confidenceScore || 0,
        permitType: p.permitType,
      }));
  }, [analyzed]);

  return {
    analyzed,
    scoreDistribution,
    byPermitType,
    byCity,
    byCategory,
    stats,
    scoreTrend,
  };
};
