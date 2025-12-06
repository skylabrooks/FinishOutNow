import React, { useState, useEffect } from 'react';
import { Lock, Eye, Zap } from 'lucide-react';
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
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const isLocked = !visibility.isClaimed;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600 uppercase">{permit.permitType}</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-2">
            {permit.city}
            {isLocked && <Lock className="w-4 h-4 text-amber-600" />}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            permit.status === 'Issued' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {permit.status}
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        {visibility.visibleFields.includes('applicant') && permit.applicant ? (
          <p className="text-gray-700">
            <span className="font-medium">Applicant:</span> {permit.applicant}
          </p>
        ) : isLocked ? (
          <p className="text-gray-500 italic flex items-center gap-1">
            <Lock className="w-3 h-3" /> Applicant hidden until claimed
          </p>
        ) : null}

        <p className="text-lg font-semibold text-green-700">${permit.valuation.toLocaleString()}</p>

        {permit.aiAnalysis && (
          <div className="flex items-center gap-1 pt-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">
              {permit.aiAnalysis.confidenceScore}% commercial match
            </p>
          </div>
        )}

        {visibility.claimedBy && (
          <p className="text-xs text-gray-500 border-t pt-2 mt-2">Claimed by {visibility.claimedBy}</p>
        )}
      </div>

      <div className="flex gap-2">
        {isLocked ? (
          <button
            onClick={onClaim}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition"
          >
            <Lock className="w-4 h-4" />
            Claim Lead
          </button>
        ) : (
          <button
            onClick={onViewDetails}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
