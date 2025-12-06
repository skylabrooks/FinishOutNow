import React, { useState } from 'react';
import { Lock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { claimLead, canClaimLead } from '../services/firebaseLeads';
import { EnrichedPermit } from '../types';

interface LeadClaimModalProps {
  permit: EnrichedPermit;
  businessName: string;
  userEmail: string;
  businessId: string;
  onClaimed: () => void;
  onClose: () => void;
}

export default function LeadClaimModal({
  permit,
  businessName,
  userEmail,
  businessId,
  onClaimed,
  onClose,
}: LeadClaimModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setError(err instanceof Error ? err.message : 'Failed to claim lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Claim This Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!success ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Protected Lead:</strong> Claim this lead to unlock full details and contact information.
              </p>
            </div>

            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Permit Type</p>
                <p className="text-sm font-medium text-gray-900">{permit.permitType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Location</p>
                <p className="text-sm font-medium text-gray-900">{permit.city}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Est. Value</p>
                <p className="text-sm font-medium text-gray-900">${permit.valuation.toLocaleString()}</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Claiming...' : 'Claim Lead'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-900 mb-1">Lead Claimed!</p>
            <p className="text-sm text-gray-600">Full details are now unlocked.</p>
          </div>
        )}
      </div>
    </div>
  );
}
