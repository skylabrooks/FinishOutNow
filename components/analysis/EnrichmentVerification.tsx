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
      className={`p-3 rounded-lg border ${
        isVerified
          ? 'bg-emerald-900/10 border-emerald-900/50'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Building size={12} /> Corporate Verification
        </h3>
        {isVerified ? (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
            <BadgeCheck size={10} /> VERIFIED
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
            <HelpCircle size={10} /> UNVERIFIED
          </span>
        )}
      </div>

      {isVerified ? (
        <div className="space-y-2">
          <div>
            <p className="text-[9px] text-slate-500 uppercase">Legal Taxpayer Name</p>
            <p className="text-xs font-medium text-white">{enrichmentData.taxpayerName}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase">Taxpayer ID</p>
            <p className="text-xs font-mono text-slate-300">{enrichmentData.taxpayerNumber}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase flex items-center gap-0.5">
              <MapPin size={9} /> Official Mailing Address
            </p>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {enrichmentData.officialMailingAddress}
            </p>
          </div>
          {enrichmentData.rightToTransactBusiness && (
            <p className="text-[9px] text-emerald-500 flex items-center gap-0.5 mt-0.5">
              <CheckCircle size={9} /> Right to Transact Business Active
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-1.5">
          <p className="text-[10px] text-slate-500 italic">
            No exact match found in Texas Comptroller database for "
            {aiAnalysis?.extractedEntities.tenantName || applicant}".
          </p>
        </div>
      )}
    </div>
  );
};
