import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, HardHat, DollarSign, Activity } from 'lucide-react';
import { LeadCategory } from '../types';

interface DashboardProps {
  stats: {
    totalValue: number;
    activeLeads: number;
    highPriority: number;
    avgConfidence: number;
  };
}

const data = [
  { name: 'Security', value: 120000 },
  { name: 'Signage', value: 85000 },
  { name: 'Low Voltage', value: 180000 },
  { name: 'General', value: 45000 },
];

const COLORS = ['#F87171', '#FBBF24', '#22D3EE', '#94A3B8'];

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Stat Cards */}
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-xs font-semibold uppercase">Pipeline Value</h3>
          <DollarSign className="text-emerald-400" size={18} />
        </div>
        <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
        <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
          <span className="bg-emerald-400/10 px-1 rounded">+12%</span> vs last week
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-xs font-semibold uppercase">Active Leads</h3>
          <Users className="text-blue-400" size={18} />
        </div>
        <p className="text-2xl font-bold text-white">{stats.activeLeads}</p>
        <p className="text-blue-400 text-xs mt-1">
          {stats.highPriority} High Urgency
        </p>
      </div>

       <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-xs font-semibold uppercase">AI Confidence</h3>
          <Activity className="text-purple-400" size={18} />
        </div>
        <p className="text-2xl font-bold text-white">{stats.avgConfidence}%</p>
        <p className="text-slate-500 text-xs mt-1">
          Across {stats.activeLeads} processed permits
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-sm md:col-span-1 flex flex-col h-[200px]">
        <div className="flex-1 w-full" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={0}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" hide />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
            <span>Sec</span>
            <span>Sign</span>
            <span>IT</span>
            <span>Gen</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;