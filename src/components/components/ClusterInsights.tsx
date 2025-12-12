/**
 * Cluster Insights Component
 * Dashboard widget showing cluster analysis and statistics
 */

import React from 'react';
import { LeadCluster, Hotspot } from '../types';
import { HotspotSummary } from '../services/geospatial/heatmapService';
import { Target, Flame, BarChart3, Star, MapPin, DollarSign, Activity } from 'lucide-react';

interface ClusterInsightsProps {
  clusters: LeadCluster[];
  hotspots?: Hotspot[];
  hotspotSummary?: HotspotSummary;
}

export const ClusterInsights: React.FC<ClusterInsightsProps> = ({
  clusters,
  hotspots,
  hotspotSummary
}) => {
  const topClusters = clusters.slice(0, 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Activity className="text-indigo-400" size={24} />
        Cluster Insights
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Clusters"
          value={clusters.length}
          icon={<Target size={24} className="text-blue-400" />}
          color="blue"
        />
        <StatCard
          label="Total Hotspots"
          value={hotspotSummary?.totalHotspots ?? hotspots?.length ?? 0}
          icon={<Flame size={24} className="text-orange-400" />}
          color="orange"
        />
        <StatCard
          label="Total Leads"
          value={clusters.reduce((sum, c) => sum + c.leads.length, 0)}
          icon={<BarChart3 size={24} className="text-purple-400" />}
          color="purple"
        />
        <StatCard
          label="Avg Score"
          value={
            clusters.length > 0
              ? (clusters.reduce((sum, c) => sum + c.averageScore, 0) / clusters.length).toFixed(1)
              : '0'
          }
          icon={<Star size={24} className="text-yellow-400" />}
          color="yellow"
        />
      </div>

      {/* Top Clusters Table */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target size={16} /> Top Performing Clusters
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Avg Score</th>
                <th className="px-4 py-3">Valuation</th>
                <th className="px-4 py-3">Radius (mi)</th>
                <th className="px-4 py-3">Density</th>
                <th className="px-4 py-3">Top Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {topClusters.map((cluster, index) => (
                <tr key={cluster.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-300">#{index + 1}</td>
                  <td className="px-4 py-3 text-white font-bold">{cluster.leads.length}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getScoreColorClass(cluster.averageScore)}`}>
                      {cluster.averageScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">
                    ${(cluster.totalValuation / 1000).toFixed(0)}k
                  </td>
                  <td className="px-4 py-3 text-slate-400">{cluster.radiusMiles.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400">{cluster.density.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {cluster.topCategories[0] ?? 'N/A'}
                  </td>
                </tr>
              ))}
              {topClusters.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No clusters identified yet. Run analysis to generate insights.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hotspot Summary if available */}
      {hotspotSummary && hotspotSummary.totalHotspots > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flame size={16} /> Hotspot Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              label="Avg Intensity"
              value={hotspotSummary.avgIntensity.toFixed(1)}
              icon={<Activity size={18} className="text-indigo-400" />}
            />
            <InfoCard
              label="Total Leads in Hotspots"
              value={hotspotSummary.totalLeads.toString()}
              icon={<MapPin size={18} className="text-indigo-400" />}
            />
            <InfoCard
              label="Total Hotspot Valuation"
              value={`$${(hotspotSummary.totalValuation / 1000000).toFixed(1)}M`}
              icon={<DollarSign size={18} className="text-indigo-400" />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({
  label,
  value,
  icon,
  color
}) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 border-blue-500/20',
        orange: 'bg-orange-500/10 border-orange-500/20',
        purple: 'bg-purple-500/10 border-purple-500/20',
        yellow: 'bg-yellow-500/10 border-yellow-500/20',
    }[color] || 'bg-slate-800 border-slate-700';

    return (
        <div className={`p-4 rounded-xl border ${colorClasses} flex flex-col items-center justify-center text-center`}>
            <div className="mb-2 p-2 bg-slate-950/50 rounded-full">{icon}</div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        </div>
    );
};

const InfoCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
    <div>
        <div className="text-xs text-slate-500 uppercase font-bold mb-1">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
    </div>
    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
        {icon}
    </div>
  </div>
);

// Helper functions
function getScoreColorClass(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  if (score >= 40) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
  return 'bg-red-500/20 text-red-400 border border-red-500/30';
}
