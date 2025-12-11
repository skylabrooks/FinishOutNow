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
      className={`p-5 rounded-xl border ${
        isVerified
          ? 'bg-emerald-900/10 border-emerald-500/20'
          : 'bg-slate-900/50 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
          <Building size={14} /> Corporate Verification
        </h3>
        {isVerified ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <BadgeCheck size={12} /> VERIFIED ENTITY
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            <HelpCircle size={12} /> UNVERIFIED
          </span>
        )}
      </div>

      {isVerified ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Legal Taxpayer Name</p>
              <p className="text-sm font-medium text-white">{enrichmentData.taxpayerName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Taxpayer ID</p>
              <p className="text-sm font-mono text-slate-300 bg-slate-900/50 px-2 py-1 rounded inline-block border border-slate-800">
                {enrichmentData.taxpayerNumber}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
              <MapPin size={10} /> Official Mailing Address
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {enrichmentData.officialMailingAddress}
            </p>
          </div>
          {enrichmentData.rightToTransactBusiness && (
            <div className="pt-2 border-t border-emerald-500/10">
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle size={12} /> Right to Transact Business Active
                </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 italic">
            No exact match found in Texas Comptroller database for "
            {aiAnalysis?.extractedEntities.tenantName || applicant}".
          </p>
        </div>
      )}
    </div>
  );
};
