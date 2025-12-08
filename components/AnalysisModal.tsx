
import React from 'react';
import { X, Zap, Hammer, FileCheck, Info } from 'lucide-react';
import { EnrichedPermit, CompanyProfile } from '../types';
import { CategoryBadge } from './badges/CategoryBadge';
import { TradeOpportunities } from './analysis/TradeOpportunities';
import { EnrichmentVerification } from './analysis/EnrichmentVerification';
import { AnalysisActions } from './analysis/AnalysisActions';

interface AnalysisModalProps {
  permit: EnrichedPermit | null;
  onClose: () => void;
  companyProfile?: CompanyProfile;
  onRemoveClaimed?: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ permit, onClose, companyProfile, onRemoveClaimed }) => {
  // Handle ESC key to close modal - only when modal is visible
  // Use capture phase to ensure this runs before App.tsx handler
  React.useEffect(() => {
    if (!permit || !permit.aiAnalysis) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    // Use capture phase (third parameter = true) to run before bubble phase
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [permit, onClose]);

  if (!permit || !permit.aiAnalysis) return null;

  const { aiAnalysis } = permit;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl relative overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900 sticky top-0 z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {aiAnalysis.isCommercialTrigger && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                   <Zap size={10} /> Commercial Trigger
                </span>
              )}
              <CategoryBadge category={aiAnalysis.category} />
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
                  {permit.permitType === 'Certificate of Occupancy' ? <FileCheck size={10} /> : <Hammer size={10} />}
                  {permit.permitType}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">
               {aiAnalysis.extractedEntities.tenantName ? (
                   <span className="text-white">{aiAnalysis.extractedEntities.tenantName} <span className="text-slate-500 font-normal">via {permit.applicant}</span></span>
               ) : (
                   permit.applicant
               )}
            </h2>
            <p className="text-slate-400 text-sm mt-1">{permit.address}, {permit.city}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all bg-slate-800 border border-slate-700 p-2 rounded-lg group"
            title="Close (ESC)"
          >
            <X size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Deep Analysis */}
          <div className="space-y-6">
            
            {/* Reasoning Box */}
            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
                    <Info size={14} /> AI Analysis
                </h3>
                <p className="text-slate-200 text-sm leading-relaxed">
                    {aiAnalysis.reasoning}
                </p>
            </div>

            {/* Entity Verification Section (Phase 3) */}
            <EnrichmentVerification permit={permit} />

            {/* Trade Opportunities Checklist */}
            <TradeOpportunities tradeOpportunities={aiAnalysis.tradeOpportunities} />

          </div>

          {/* Right Column: Actionable */}
          <AnalysisActions
            permit={permit}
            companyProfile={companyProfile}
            onRemoveClaimed={onRemoveClaimed}
            onClose={onClose}
          />

        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
