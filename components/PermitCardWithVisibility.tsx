import React, { useState, useEffect } from 'react';
import { getLeadVisibility } from '../services/firebaseLeads';
import { EnrichedPermit, LeadCategory, LeadVisibility } from '../types';
import { Calendar, DollarSign, User, Shield, Monitor, PenTool, CheckCircle, PlayCircle, Loader2, Sparkles, Lock } from 'lucide-react';

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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-slate-700 rounded w-2/3"></div>
      </div>
    );
  }

  const isLocked = !visibility.isClaimed;
  const showAddress = visibility.visibleFields.includes('address');
  const showApplicant = visibility.visibleFields.includes('applicant');
  const showValuation = visibility.visibleFields.includes('valuation');

  return (
    <div
      onClick={onSelectPermit}
      className={`group bg-slate-900 border transition-all duration-300 rounded-xl overflow-hidden relative
        ${permit.aiAnalysis?.isCommercialTrigger
          ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-900/10'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-xl'
        }
        ${permit.aiAnalysis ? 'cursor-pointer' : ''}
      `}
    >
      {/* Verification Status Stripe */}
      {permit.enrichmentData?.verified && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-700"></div>
      )}

      {/* Lock Badge if Unclaimed */}
      {isLocked && (
        <div className="absolute top-3 right-3 bg-amber-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-bold">
          <Lock size={12} /> LOCKED
        </div>
      )}

      <div className="p-5 flex flex-col md:flex-row gap-6">
        {/* Left: Metadata */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                ${permit.permitType === 'Certificate of Occupancy'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }
              `}
            >
              {permit.permitType}
            </span>
            {permit.dataSource && (
              <span className="text-[10px] text-slate-600 border border-slate-800 px-1 rounded bg-slate-900">
                {permit.dataSource}
              </span>
            )}
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <Calendar size={12} /> {permit.appliedDate}
            </span>
            <span className="text-slate-500 text-xs flex items-center gap-1">
              • {permit.city}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
            {permit.description.length > 80 ? permit.description.substring(0, 80) + '...' : permit.description}
          </h3>

          {/* Conditionally Show Address */}
          {showAddress ? (
            <p className="text-slate-400 text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              {permit.address}
            </p>
          ) : (
            <p className="text-slate-500 text-sm flex items-center gap-1 italic">
              <Lock size={12} /> Address hidden until claimed
            </p>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs">
            {/* Valuation */}
            {showValuation ? (
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                <DollarSign size={12} className="text-emerald-400" />
                {permit.valuation.toLocaleString()}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                <DollarSign size={12} className="text-slate-500" />
                <span className="italic">Value hidden</span>
              </div>
            )}

            {/* Applicant */}
            {showApplicant ? (
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                <User size={12} className="text-blue-400" />
                {permit.applicant}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                <User size={12} className="text-slate-500" />
                <span className="italic">Name hidden</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Intel or Action */}
        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
          {permit.aiAnalysis ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase">Confidence</span>
                <span
                  className={`text-lg font-bold ${
                    permit.aiAnalysis.confidenceScore > 80
                      ? 'text-emerald-400'
                      : permit.aiAnalysis.confidenceScore > 50
                        ? 'text-yellow-400'
                        : 'text-slate-400'
                  }`}
                >
                  {permit.aiAnalysis.confidenceScore}%
                </span>
              </div>

              {/* Category Badge */}
              <div className="flex items-center gap-2">
                {permit.aiAnalysis.category === LeadCategory.SECURITY && (
                  <Shield size={14} className="text-red-400" />
                )}
                {permit.aiAnalysis.category === LeadCategory.LOW_VOLTAGE && (
                  <Monitor size={14} className="text-cyan-400" />
                )}
                {permit.aiAnalysis.category === LeadCategory.SIGNAGE && (
                  <PenTool size={14} className="text-amber-400" />
                )}
                <span className="text-sm font-medium text-white">{permit.aiAnalysis.category}</span>
              </div>

              {/* Verification Badge */}
              {permit.enrichmentData?.verified && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50 w-fit">
                  <CheckCircle size={10} /> Verified Entity
                </div>
              )}

              <div className="space-y-2 pt-2">
                {isLocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimLead();
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white border border-amber-600 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    🔐 Claim Lead
                  </button>
                )}
                <button className="w-full text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1">
                  View Analysis <PlayCircle size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyze();
                }}
                disabled={isAnalyzing}
                className="w-full bg-slate-800 hover:bg-blue-600 hover:text-white border border-slate-700 text-slate-400 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 group/btn"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-blue-500 group-hover/btn:text-white transition-colors" /> Run AI Analysis
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
