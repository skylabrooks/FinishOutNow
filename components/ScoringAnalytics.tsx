import React, { useMemo } from 'react';
import { EnrichedPermit, LeadCategory } from '../types';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Zap, Award } from 'lucide-react';

interface ScoringAnalyticsProps {
  permits: EnrichedPermit[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ScoringAnalytics({ permits }: ScoringAnalyticsProps) {
  const analyzed = permits.filter(p => p.aiAnalysis);

  const scoreDistribution = useMemo(() => {
    const bins = [
      { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
      { range: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
      { range: '41-60', min: 41, max: 60, count: 0, color: '#f59e0b' },
      { range: '61-80', min: 61, max: 80, count: 0, color: '#3b82f6' },
      { range: '81-100', min: 81, max: 100, count: 0, color: '#10b981' },
    ];

    analyzed.forEach(p => {
      const score = p.aiAnalysis?.confidenceScore || 0;
      const bin = bins.find(b => score >= b.min && score <= b.max);
      if (bin) bin.count++;
    });

    return bins;
  }, [analyzed]);

  const byPermitType = useMemo(() => {
    const groups: Record<string, { scores: number[]; count: number }> = {};
    
    analyzed.forEach(p => {
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

  const byCity = useMemo(() => {
    const groups: Record<string, { scores: number[]; count: number }> = {};
    
    analyzed.forEach(p => {
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

  const byCategory = useMemo(() => {
    const groups: Record<string, { scores: number[]; count: number }> = {};
    
    analyzed.forEach(p => {
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

  const stats = useMemo(() => {
    const scores = analyzed.map(p => p.aiAnalysis?.confidenceScore || 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highConfidence = scores.filter(s => s >= 80).length;
    const lowConfidence = scores.filter(s => s < 40).length;
    
    return {
      avgScore: avg,
      highConfidenceCount: highConfidence,
      highConfidencePercent: Math.round((highConfidence / scores.length) * 100) || 0,
      lowConfidenceCount: lowConfidence,
      lowConfidencePercent: Math.round((lowConfidence / scores.length) * 100) || 0,
      totalAnalyzed: scores.length,
    };
  }, [analyzed]);

  const scoreTrend = useMemo(() => {
    return analyzed
      .sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime())
      .slice(-20)
      .map((p, i) => ({
        index: i + 1,
        score: p.aiAnalysis?.confidenceScore || 0,
        permitType: p.permitType,
      }));
  }, [analyzed]);

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
      {/* Stats Cards */}
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
            {Math.round(((analyzed.length - stats.highConfidenceCount - stats.lowConfidenceCount) / analyzed.length) * 100)}%
          </p>
          <p className="text-slate-500 text-xs mt-2">{analyzed.length - stats.highConfidenceCount - stats.lowConfidenceCount} leads</p>
        </div>

        <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Low Confidence (&lt;40)</p>
          <p className="text-3xl font-bold text-red-300">{stats.lowConfidencePercent}%</p>
          <p className="text-slate-500 text-xs mt-2">{stats.lowConfidenceCount} leads</p>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Confidence Score Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={scoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="range" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
              cursor={{ fill: '#334155', opacity: 0.4 }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {scoreDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Recent Score Trend (Last 20 Analyzed)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={scoreTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="index" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
              cursor={{ stroke: '#3b82f6', opacity: 0.5 }}
              formatter={(value) => `${value}%`}
            />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" dot={{ fill: '#3b82f6', r: 4 }} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* By Permit Type */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Average Score by Permit Type</h3>
        <div className="space-y-3">
          {byPermitType.map((type, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{type.name}</p>
                <p className="text-slate-400 text-xs">{type.count} permits</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-700 rounded h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${type.average}%` }}
                  ></div>
                </div>
                <p className="text-blue-300 font-bold w-12 text-right">{type.average}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By City */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Average Score by City</h3>
        <div className="space-y-3">
          {byCity.map((city, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{city.name}</p>
                <p className="text-slate-400 text-xs">{city.count} permits</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-700 rounded h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${city.average}%` }}
                  ></div>
                </div>
                <p className="text-emerald-300 font-bold w-12 text-right">{city.average}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Category */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Lead Distribution by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            >
              {byCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
              formatter={(value) => `${value} leads`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Key Insights
        </h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            • <span className="font-semibold">{byPermitType[0]?.name}</span> has the highest average score ({byPermitType[0]?.average}%)
          </p>
          <p>
            • <span className="font-semibold">{byCity[0]?.name}</span> leads in {byCity[0]?.name} city ({byCity[0]?.average}%)
          </p>
          <p>
            • {stats.highConfidencePercent}% of analyzed leads are high confidence - <span className="font-semibold">good lead quality</span>
          </p>
          <p>
            • {byCategory.length} different lead categories identified across {analyzed.length} analyzed permits
          </p>
        </div>
      </div>
    </div>
  );
}
