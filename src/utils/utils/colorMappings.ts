/**
 * Shared color mappings for consistent styling across components
 */

import { LeadCategory } from '../types';

export const getCategoryColor = (category: LeadCategory): string => {
  switch (category) {
    case LeadCategory.SECURITY:
      return 'text-red-400 border-red-400 bg-red-900/20';
    case LeadCategory.SIGNAGE:
      return 'text-amber-400 border-amber-400 bg-amber-900/20';
    case LeadCategory.LOW_VOLTAGE:
      return 'text-cyan-400 border-cyan-400 bg-cyan-900/20';
    default:
      return 'text-gray-400 border-gray-400 bg-gray-900/20';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'contacted':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'qualified':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'won':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'lost':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

export const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'High':
      return 'text-red-400';
    case 'Medium':
      return 'text-yellow-400';
    case 'Low':
      return 'text-slate-400';
    default:
      return 'text-slate-400';
  }
};

export const getConfidenceScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // emerald-500
  if (score >= 60) return '#3b82f6'; // blue-500
  if (score >= 40) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

export const CHART_COLORS = {
  primary: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  scoreDistribution: {
    low: '#ef4444',      // 0-20
    lowMid: '#f97316',   // 21-40
    mid: '#f59e0b',      // 41-60
    midHigh: '#3b82f6',  // 61-80
    high: '#10b981',     // 81-100
  },
};
