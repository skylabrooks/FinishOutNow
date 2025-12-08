import React from 'react';
import { Building, BadgeCheck, HelpCircle, MapPin, CheckCircle } from 'lucide-react';
import { EnrichedPermit } from '../../types';

interface EnrichmentVerificationProps {
  permit: EnrichedPermit;
}

export const EnrichmentVerification: React.FC<EnrichmentVerificationProps> = ({ permit }) => {
  const { enrichmentData, aiAnalysis, applicant } = permit;
  const isVerified = enrichmentData?.verified;

  return (
    <div
      className={`p-4 rounded-lg border ${
        isVerified
          ? 'bg-emerald-900/10 border-emerald-900/50'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
          <Building size={14} /> Corporate Verification
        </h3>
        {isVerified ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <BadgeCheck size={12} /> VERIFIED ENTITY
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            <HelpCircle size={12} /> UNVERIFIED
          </span>
        )}
      </div>

      {isVerified ? (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Legal Taxpayer Name</p>
            <p className="text-sm font-medium text-white">{enrichmentData.taxpayerName}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Taxpayer ID</p>
            <p className="text-sm font-mono text-slate-300">{enrichmentData.taxpayerNumber}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <MapPin size={10} /> Official Mailing Address
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {enrichmentData.officialMailingAddress}
            </p>
          </div>
          {enrichmentData.rightToTransactBusiness && (
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1">
              <CheckCircle size={10} /> Right to Transact Business Active
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-slate-500 italic">
            No exact match found in Texas Comptroller database for "
            {aiAnalysis?.extractedEntities.tenantName || applicant}".
          </p>
        </div>
      )}
    </div>
  );
};
