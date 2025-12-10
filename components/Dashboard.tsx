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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-slide-in">
      {/* Stat Cards */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-5 rounded-xl shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pipeline Value</h3>
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <DollarSign className="text-emerald-400" size={18} />
          </div>
        </div>
        <p className="text-3xl font-bold text-white mb-2">${stats.totalValue.toLocaleString()}</p>
        <p className="text-emerald-400 text-xs font-medium flex items-center gap-1.5">
          <span className="bg-emerald-400/20 px-2 py-0.5 rounded-md font-semibold">+12%</span> vs last week
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-5 rounded-xl shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Leads</h3>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Users className="text-blue-400" size={18} />
          </div>
        </div>
        <p className="text-3xl font-bold text-white mb-2">{stats.activeLeads}</p>
        <p className="text-blue-400 text-xs font-medium">
          {stats.highPriority} High Urgency
        </p>
      </div>

       <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-5 rounded-xl shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">AI Confidence</h3>
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Activity className="text-purple-400" size={18} />
          </div>
        </div>
        <p className="text-3xl font-bold text-white mb-2">{stats.avgConfidence}%</p>
        <p className="text-slate-400 text-xs font-medium">
          Across {stats.activeLeads} processed permits
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-5 rounded-xl shadow-lg hover:shadow-cyan-500/10 hover:border-slate-700/70 transition-all duration-300 md:col-span-1 flex flex-col">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Category Mix</h3>
        <div className="flex-1 w-full" style={{ minWidth: 0, minHeight: 140, maxHeight: 140, display: 'flex' }}>
            <ResponsiveContainer width="100%" height={140} debounce={0}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" hide />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{fill: '#1e293b', opacity: 0.5}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-medium mt-3 px-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>Sec</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Sign</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span>IT</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span>Gen</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;