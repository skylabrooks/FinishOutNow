import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Users, HardHat, DollarSign, Activity, TrendingUp, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  stats: {
    totalValue: number;
    activeLeads: number;
    highPriority: number;
    avgConfidence: number;
  };
}

const data = [
  { name: 'Mon', value: 40000 },
  { name: 'Tue', value: 30000 },
  { name: 'Wed', value: 60000 },
  { name: 'Thu', value: 45000 },
  { name: 'Fri', value: 80000 },
  { name: 'Sat', value: 20000 },
  { name: 'Sun', value: 10000 },
];

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Pipeline Value Card */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <DollarSign size={48} className="text-emerald-500" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pipeline Value</h3>
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <TrendingUp size={10} /> +12.5%
          </span>
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">${(stats.totalValue / 1000000).toFixed(1)}M</p>
        <p className="text-slate-500 text-xs mt-1">Total estimated project value</p>
        
        {/* Mini Chart */}
        <div className="mt-4 -mx-2" style={{ width: '100%', height: '40px', minHeight: '40px' }}>
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Leads Card */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Users size={48} className="text-blue-500" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Leads</h3>
          <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20">
            Live
          </span>
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">{stats.activeLeads}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-slate-400">High Priority:</span>
          <span className="text-xs font-bold text-blue-400">{stats.highPriority}</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(stats.highPriority / stats.activeLeads) * 100}%` }}></div>
        </div>
      </div>

      {/* AI Confidence Card */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity size={48} className="text-purple-500" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">AI Confidence</h3>
          <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/20">
            Avg
          </span>
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">{stats.avgConfidence}%</p>
        <p className="text-slate-500 text-xs mt-1">Match accuracy across leads</p>
        
        <div className="flex items-end gap-1 h-8 mt-4">
          {[40, 60, 45, 70, 85, 65, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-purple-500/20 rounded-sm hover:bg-purple-500 transition-colors" style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>

      {/* Conversion Rate (Mock) */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ArrowUpRight size={48} className="text-amber-500" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Conversion</h3>
          <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/20">
            Est
          </span>
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">4.2%</p>
        <p className="text-slate-500 text-xs mt-1">Lead to Opportunity rate</p>
        
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-[42%]"></div>
          </div>
          <span className="text-[10px] text-amber-500 font-bold">Target: 5%</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
