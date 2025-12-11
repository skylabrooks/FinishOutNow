import React from 'react';
import { CheckCircle, Shield, Cable, PenTool } from 'lucide-react';
import { AIAnalysisResult } from '../../types';

interface TradeOpportunitiesProps {
  tradeOpportunities: AIAnalysisResult['tradeOpportunities'];
}

export const TradeOpportunities: React.FC<TradeOpportunitiesProps> = ({ tradeOpportunities }) => {
  return (
    <div>
      <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-3">
        Identified Opportunities
      </h3>
      <div className="grid gap-3">
        <TradeItem
          active={tradeOpportunities.securityIntegrator}
          icon={<Shield size={18} />}
          label="Security & Access Control"
          colorScheme="indigo"
        />
        <TradeItem
          active={tradeOpportunities.lowVoltageIT}
          icon={<Cable size={18} />}
          label="Low Voltage / IT Infrastructure"
          colorScheme="cyan"
        />
        <TradeItem
          active={tradeOpportunities.signage}
          icon={<PenTool size={16} />}
          label="Signage & Branding"
          colorScheme="amber"
        />
      </div>
    </div>
  );
};

interface TradeItemProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  colorScheme: 'indigo' | 'cyan' | 'amber';
}

const TradeItem: React.FC<TradeItemProps> = ({ active, icon, label, colorScheme }) => {
  const colors = {
    indigo: {
      container: active ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900/30 border-slate-800 opacity-40',
      icon: active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600',
      text: active ? 'text-indigo-100' : 'text-slate-500',
    },
    cyan: {
      container: active ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-900/30 border-slate-800 opacity-40',
      icon: active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-600',
      text: active ? 'text-cyan-100' : 'text-slate-500',
    },
    amber: {
      container: active ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900/30 border-slate-800 opacity-40',
      icon: active ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-600',
      text: active ? 'text-amber-100' : 'text-slate-500',
    },
  };

  const theme = colors[colorScheme];

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${theme.container}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${theme.icon}`}>
          {icon}
        </div>
        <span className={`font-medium text-sm ${theme.text}`}>
          {label}
        </span>
      </div>
      {active && <CheckCircle size={18} className="text-emerald-500" />}
    </div>
  );
};
