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
  isOpen: boolean; // Added to match App.tsx usage
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ permit, onClose, companyProfile, onRemoveClaimed, isOpen }) => {
  // Handle ESC key to close modal
  React.useEffect(() => {
    if (!isOpen || !permit) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isOpen, permit, onClose]);

  if (!isOpen || !permit || !permit.aiAnalysis) return null;

  const { aiAnalysis } = permit;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl shadow-black/50 relative overflow-hidden my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900 sticky top-0 z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {aiAnalysis.isCommercialTrigger && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                   <Zap size={10} /> Commercial Trigger
                </span>
              )}
              <CategoryBadge category={aiAnalysis.category} />
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                  {permit.permitType === 'Certificate of Occupancy' ? <FileCheck size={10} /> : <Hammer size={10} />}
                  {permit.permitType}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight mb-1">
               {aiAnalysis.extractedEntities.tenantName ? (
                   <span className="text-white">{aiAnalysis.extractedEntities.tenantName} <span className="text-slate-500 font-normal text-lg">via {permit.applicant}</span></span>
               ) : (
                   permit.applicant
               )}
            </h2>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">{permit.address}, {permit.city}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 transition-all p-2 rounded-lg"
            title="Close (ESC)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-950/30">
          
          {/* Left Column: Deep Analysis (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Reasoning Box */}
            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                    <Info size={14} className="text-indigo-400" /> AI Analysis Reasoning
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    {aiAnalysis.reasoning}
                </p>
            </div>

            {/* Trade Opportunities */}
            <TradeOpportunities tradeOpportunities={aiAnalysis.tradeOpportunities} />

            {/* Entity Verification Section */}
            <EnrichmentVerification permit={permit} />
          </div>

          {/* Right Column: Actions & Economics (5 cols) */}
          <div className="lg:col-span-5">
            <AnalysisActions 
              permit={permit} 
              companyProfile={companyProfile}
              onRemoveClaimed={onRemoveClaimed}
              onClose={onClose}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
