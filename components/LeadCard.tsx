import React, { useState, useEffect } from 'react';
import { Lock, Eye, Zap, MapPin, DollarSign, Calendar } from 'lucide-react';
import { EnrichedPermit, LeadVisibility } from '../types';
import { getLeadVisibility } from '../services/firebaseLeads';

interface LeadCardProps {
  permit: EnrichedPermit;
  onViewDetails: () => void;
  onClaim: () => void;
}

export default function LeadCard({ permit, onViewDetails, onClaim }: LeadCardProps) {
  const [visibility, setVisibility] = useState<LeadVisibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVisibility = async () => {
      try {
        const vis = await getLeadVisibility(permit.id);
        setVisibility(vis);
      } finally {
        setLoading(false);
      }
    };
    checkVisibility();
  }, [permit.id]);

  if (loading || !visibility) {
    return (
      <div className="bg-slate-900 rounded-xl shadow-lg p-5 border border-slate-800 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-slate-800 rounded w-1/2"></div>
      </div>
    );
  }

  const isLocked = !visibility.isClaimed;

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg p-5 border border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-900/20 transition-all group relative overflow-hidden">
      {/* Status Badge */}
      <div className="absolute top-0 right-0 p-3">
        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
            permit.permitType === 'Commercial' 
            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
            {permit.permitType}
        </span>
      </div>

      <div className="mb-4 pr-16">
        <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-slate-500" />
            <span className="text-sm font-bold text-white">{permit.city}</span>
            {isLocked && <Lock size={14} className="text-amber-500" />}
        </div>
        <div className="text-xs text-slate-400 line-clamp-2 h-8">
            {permit.projectDescription}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 flex items-center gap-1">
                <DollarSign size={10} /> Value
            </div>
            <div className="text-sm font-bold text-emerald-400">
                ${(permit.valuation || 0).toLocaleString()}
            </div>
        </div>
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 flex items-center gap-1">
                <Calendar size={10} /> Date
            </div>
            <div className="text-sm font-bold text-slate-300">
                {new Date(permit.appliedDate).toLocaleDateString()}
            </div>
        </div>
      </div>

      {isLocked ? (
        <button
          onClick={onClaim}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20 border border-amber-500/50"
        >
          <Lock size={16} />
          Unlock Lead
        </button>
      ) : (
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 border border-indigo-500/50"
        >
          <Eye size={16} />
          View Details
        </button>
      )}
    </div>
  );
}
