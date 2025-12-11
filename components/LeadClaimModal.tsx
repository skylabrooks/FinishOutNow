import React, { useState } from 'react';
import { Lock, CheckCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { claimLead, canClaimLead } from '../services/firebaseLeads';
import { EnrichedPermit } from '../types';

interface LeadClaimModalProps {
  permit: EnrichedPermit;
  businessName: string;
  userEmail: string;
  businessId: string;
  onClaimed: () => void;
  onClose: () => void;
  isOpen: boolean; // Added to match App.tsx usage
}

export default function LeadClaimModal({
  permit,
  businessName,
  userEmail,
  businessId,
  onClaimed,
  onClose,
  isOpen,
}: LeadClaimModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      const canClaim = await canClaimLead(userEmail, businessId);
      if (!canClaim) {
        throw new Error('You do not have permission to claim leads. Check your subscription.');
      }

      await claimLead(permit.id, businessId, businessName, userEmail, 'free');
      setSuccess(true);
      setTimeout(() => {
        onClaimed();
        onClose();
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to claim lead';
      
      if (errorMsg.includes('offline') || errorMsg.includes('permission') || errorMsg.includes('Failed to get')) {
        setError(`${errorMsg}. If this persists, check Firebase Firestore Rules.`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[200]" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Unlock Lead Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!success ? (
          <>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-200 leading-relaxed">
                <strong className="text-amber-400 block mb-1">Protected Intelligence</strong> 
                Claiming this lead will reveal the full address, applicant details, and unlock the AI-generated outreach pitch.
              </p>
            </div>

            <div className="space-y-4 mb-8 bg-slate-950/50 p-5 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Permit Type</span>
                <span className="text-sm font-medium text-white">{permit.permitType}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Location</span>
                <span className="text-sm font-medium text-white">{permit.city}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Est. Value</span>
                <span className="text-sm font-bold text-emerald-400">${permit.valuation.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20 border border-amber-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-pulse">Unlocking...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Claim Lead
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Lead Unlocked!</h3>
            <p className="text-slate-400">Redirecting to full details...</p>
          </div>
        )}
      </div>
    </div>
  );
}
