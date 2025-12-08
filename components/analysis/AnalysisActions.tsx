import React from 'react';
import { Mail, Calendar, X } from 'lucide-react';
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
      alert('Sales pitch copied to clipboard!');
    }
  };

  const handleExportToCalendar = () => {
    exportLeadToCalendar(permit);
  };

  const handleRemoveAndClose = () => {
    if (onRemoveClaimed) {
      onRemoveClaimed();
      onClose();
    }
  };

  return (
    <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700 flex flex-col h-full">
      {/* Deal Economics */}
      <div className="mb-6">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
          Deal Economics
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">
            ${(aiAnalysis.estimatedValue || 0).toLocaleString()}
          </span>
          <span className="text-sm text-slate-500">est. contract value</span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
            style={{ width: `${aiAnalysis.confidenceScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">
            Confidence: {aiAnalysis.confidenceScore}%
          </span>
          <span className="text-xs text-slate-400">
            Total Project: ${permit.valuation.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Sales Pitch */}
      <div className="flex-grow">
        <h3 className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Generated Outreach Pitch
        </h3>

        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 relative group">
          <p className="text-slate-300 text-sm italic leading-relaxed select-all">
            "{aiAnalysis.salesPitch}"
          </p>
          <button
            onClick={handleCopyPitch}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-400">Urgency Level</span>
          <UrgencyBadge urgency={aiAnalysis.urgency} />
        </div>
        <div className="space-y-2">
          <button
            onClick={handleCopyPitch}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Copy Pitch
          </button>
          <button
            onClick={handleExportToCalendar}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <Calendar size={16} />
            Add to Calendar
          </button>
          {onRemoveClaimed && (
            <button
              onClick={handleRemoveAndClose}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              title="Remove this claimed lead from the board"
            >
              <X size={16} />
              Remove from Board
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
