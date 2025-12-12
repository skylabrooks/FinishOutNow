import React from 'react';
import { Mail, Calendar, X, Copy, ArrowRight } from 'lucide-react';
import { EnrichedPermit, CompanyProfile } from '../../types';
import { exportLeadToCalendar } from '../../utils/calendarHelpers';
import { copyToClipboard } from '../../utils/emailHelpers';
import { UrgencyBadge } from '../badges/UrgencyBadge';

interface AnalysisActionsProps {
  permit: EnrichedPermit;
  companyProfile?: CompanyProfile;
  onRemoveClaimed?: () => void;
  onClose: () => void;
}

export const AnalysisActions: React.FC<AnalysisActionsProps> = ({
  permit,
  companyProfile,
  onRemoveClaimed,
  onClose,
}) => {
  const { aiAnalysis } = permit;
  if (!aiAnalysis) return null;

  const handleCopyPitch = async () => {
    const success = await copyToClipboard(aiAnalysis.salesPitch);
    if (success) {
      // Could add toast here
    }
  };

  const handleExportToCalendar = () => {
    exportLeadToCalendar(permit);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col shadow-inner shadow-black/20">
      {/* Deal Economics */}
      <div className="mb-8">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-4">
          Deal Economics
        </h3>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold text-white tracking-tight">
            ${(aiAnalysis.estimatedValue || 0).toLocaleString()}
          </span>
          <span className="text-sm text-slate-500 font-medium">est. value</span>
        </div>
        
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
                <span className="text-indigo-400">Match Confidence</span>
                <span className="text-white">{aiAnalysis.confidenceScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${aiAnalysis.confidenceScore}%` }}
            ></div>
            </div>
        </div>
      </div>

      {/* Sales Pitch */}
      <div className="flex-grow flex flex-col min-h-0">
        <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
          AI Generated Pitch
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <p className="text-slate-300 text-sm leading-relaxed select-all whitespace-pre-wrap font-sans">
            "{aiAnalysis.salesPitch}"
          </p>
          <button
            onClick={handleCopyPitch}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 hover:bg-slate-700 text-white text-xs px-2.5 py-1.5 rounded-md border border-slate-700 flex items-center gap-1.5 shadow-lg"
          >
            <Copy size={12} /> Copy
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency</span>
          <UrgencyBadge urgency={aiAnalysis.urgency} />
        </div>
        
        <button
            onClick={handleCopyPitch}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 border border-indigo-500/50 flex items-center justify-center gap-2 group"
        >
            <Mail size={18} />
            Copy Outreach Email
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
        
        <button
            onClick={handleExportToCalendar}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
        >
            <Calendar size={18} />
            Add Reminder
        </button>
      </div>
    </div>
  );
};
