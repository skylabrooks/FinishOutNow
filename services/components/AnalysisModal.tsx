
import React from 'react';
import { X, CheckCircle, AlertCircle, DollarSign, Zap, Hammer, FileCheck, Building, User, Info, Shield, Monitor, PenTool } from 'lucide-react';
import { EnrichedPermit, LeadCategory } from '../types';

interface AnalysisModalProps {
  permit: EnrichedPermit | null;
  onClose: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ permit, onClose }) => {
  if (!permit || !permit.aiAnalysis) return null;

  const { aiAnalysis } = permit;

  const getCategoryColor = (cat: LeadCategory) => {
    switch (cat) {
      case LeadCategory.SECURITY: return 'text-red-400 border-red-400 bg-red-900/20';
      case LeadCategory.SIGNAGE: return 'text-amber-400 border-amber-400 bg-amber-900/20';
      case LeadCategory.LOW_VOLTAGE: return 'text-cyan-400 border-cyan-400 bg-cyan-900/20';
      default: return 'text-gray-400 border-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl relative overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900 sticky top-0 z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {aiAnalysis.isCommercialTrigger && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                   <Zap size={10} /> Commercial Trigger
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getCategoryColor(aiAnalysis.category)}`}>
                {aiAnalysis.category}
              </span>
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
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg">
            <X size={20} />
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

            {/* Extracted Entities */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <h4 className="text-slate-500 text-xs font-medium mb-1">Tenant Name</h4>
                    <p className="text-white font-medium text-sm truncate">{aiAnalysis.extractedEntities.tenantName || "Unknown"}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <h4 className="text-slate-500 text-xs font-medium mb-1">General Contractor</h4>
                    <p className="text-white font-medium text-sm truncate">{aiAnalysis.extractedEntities.generalContractor || permit.applicant}</p>
                </div>
            </div>

            {/* Trade Opportunities Checklist */}
            <div>
              <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">Trade Opportunities</h3>
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-lg border ${aiAnalysis.tradeOpportunities.securityIntegrator ? 'bg-red-900/10 border-red-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${aiAnalysis.tradeOpportunities.securityIntegrator ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500'}`}>
                            <Shield size={16} />
                        </div>
                        <span className={aiAnalysis.tradeOpportunities.securityIntegrator ? 'text-white font-medium' : 'text-slate-500'}>Security & Access</span>
                    </div>
                    {aiAnalysis.tradeOpportunities.securityIntegrator && <CheckCircle size={16} className="text-emerald-400" />}
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg border ${aiAnalysis.tradeOpportunities.lowVoltageIT ? 'bg-cyan-900/10 border-cyan-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${aiAnalysis.tradeOpportunities.lowVoltageIT ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-500'}`}>
                            <Monitor size={16} />
                        </div>
                        <span className={aiAnalysis.tradeOpportunities.lowVoltageIT ? 'text-white font-medium' : 'text-slate-500'}>Low Voltage / IT</span>
                    </div>
                    {aiAnalysis.tradeOpportunities.lowVoltageIT && <CheckCircle size={16} className="text-emerald-400" />}
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg border ${aiAnalysis.tradeOpportunities.signage ? 'bg-amber-900/10 border-amber-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${aiAnalysis.tradeOpportunities.signage ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500'}`}>
                            <PenTool size={16} />
                        </div>
                        <span className={aiAnalysis.tradeOpportunities.signage ? 'text-white font-medium' : 'text-slate-500'}>Signage & Branding</span>
                    </div>
                    {aiAnalysis.tradeOpportunities.signage && <CheckCircle size={16} className="text-emerald-400" />}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Actionable */}
          <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700 flex flex-col h-full">
            
             <div className="mb-6">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Deal Economics</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">${aiAnalysis.estimatedValue.toLocaleString()}</span>
                    <span className="text-sm text-slate-500">est. contract value</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${aiAnalysis.confidenceScore}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">Confidence: {aiAnalysis.confidenceScore}%</span>
                    <span className="text-xs text-slate-400">Total Project: ${(permit.valuation).toLocaleString()}</span>
                </div>
             </div>

            <div className="flex-grow">
                <h3 className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Generated Outreach Pitch
                </h3>
                
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 relative group">
                <p className="text-slate-300 text-sm italic leading-relaxed select-all">"{aiAnalysis.salesPitch}"</p>
                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">Copy</button>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-400">Urgency Level</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        aiAnalysis.urgency === 'High' ? 'bg-red-500/20 text-red-400' : 
                        aiAnalysis.urgency === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                        {aiAnalysis.urgency} Priority
                    </span>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-blue-900/30 flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Claim & Contact
                </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
