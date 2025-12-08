import React from 'react';
import { CheckCircle, Shield, Cable, PenTool } from 'lucide-react';
import { AIAnalysisResult } from '../../types';

interface TradeOpportunitiesProps {
  tradeOpportunities: AIAnalysisResult['tradeOpportunities'];
}

export const TradeOpportunities: React.FC<TradeOpportunitiesProps> = ({ tradeOpportunities }) => {
  return (
    <div>
      <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">
        Trade Opportunities
      </h3>
      <div className="space-y-2">
        <TradeItem
          active={tradeOpportunities.securityIntegrator}
          icon={<Shield size={18} />}
          label="Security & Access"
          colorScheme="red"
        />
        <TradeItem
          active={tradeOpportunities.lowVoltageIT}
          icon={<Cable size={18} />}
          label="Low Voltage / IT"
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
  colorScheme: 'red' | 'cyan' | 'amber';
}

const TradeItem: React.FC<TradeItemProps> = ({ active, icon, label, colorScheme }) => {
  const colors = {
    red: {
      container: active ? 'bg-red-900/10 border-red-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50',
      icon: active ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500',
    },
    cyan: {
      container: active ? 'bg-cyan-900/10 border-cyan-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50',
      icon: active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-500',
    },
    amber: {
      container: active ? 'bg-amber-900/10 border-amber-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50',
      icon: active ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500',
    },
  };

  const theme = colors[colorScheme];

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${theme.container}`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${theme.icon}`}>
          {icon}
        </div>
        <span className={active ? 'text-white font-medium' : 'text-slate-500'}>
          {label}
        </span>
      </div>
      {active && <CheckCircle size={16} className="text-emerald-400" />}
    </div>
  );
};
