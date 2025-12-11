import React, { useState, useEffect } from 'react';
import { getLeadVisibility } from '../services/firebaseLeads';
import { EnrichedPermit, LeadVisibility } from '../types';
import { Calendar, DollarSign, MapPin, Lock, CheckCircle, Zap, ChevronRight, Building } from 'lucide-react';

interface PermitCardWithVisibilityProps {
  permit: EnrichedPermit;
  onSelectPermit: () => void;
  onClaimLead: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export default function PermitCardWithVisibility({
  permit,
  onSelectPermit,
  onClaimLead,
  onAnalyze,
  isAnalyzing,
}: PermitCardWithVisibilityProps) {
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
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-pulse flex gap-4">
        <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-3 bg-slate-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const isLocked = !visibility.isClaimed;
  const isCommercial = permit.aiAnalysis?.isCommercialTrigger;
  const confidence = permit.aiAnalysis?.confidenceScore || 0;

  return (
    <div
      onClick={onSelectPermit}
      className={`group relative bg-slate-900/80 border transition-all duration-200 rounded-xl overflow-hidden hover:bg-slate-900
        ${isCommercial
          ? 'border-indigo-500/30 hover:border-indigo-500/60 shadow-lg shadow-indigo-900/10'
          : 'border-slate-800 hover:border-slate-700'
        }
        ${permit.aiAnalysis ? 'cursor-pointer' : ''}
      `}
    >
      {/* Status Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        isLocked ? 'bg-slate-700' : 'bg-emerald-500'
      }`}></div>

      <div className="p-4 pl-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        
        {/* Icon / Score */}
        <div className="flex-shrink-0">
          {isCommercial ? (
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-400">
              <span className="text-sm font-bold">{confidence}%</span>
              <span className="text-[8px] uppercase tracking-wider">Match</span>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
              <Building size={20} />
            </div>
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
              {permit.permitType}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Calendar size={10} /> {permit.appliedDate}
            </span>
          </div>
          
          <h3 className="text-base font-semibold text-slate-200 truncate pr-8">
            {isLocked && !visibility.visibleFields.includes('address') 
              ? 'Address Hidden (Locked Lead)' 
              : permit.address}
          </h3>
          
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {permit.city}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <DollarSign size={12} /> {permit.valuation.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions / Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 mt-2 md:mt-0">
          {isLocked ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClaimLead();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-600/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Lock size={12} />
              Unlock Lead
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <CheckCircle size={14} />
              <span className="text-xs font-bold">Claimed</span>
            </div>
          )}

          <div className="text-slate-600">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
