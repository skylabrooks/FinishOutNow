
import React from 'react';
import { X, CheckCircle, AlertCircle, DollarSign, Zap, Hammer, FileCheck, Building, User, Info, Shield, Monitor, PenTool, MapPin, BadgeCheck, HelpCircle, Mail, Calendar } from 'lucide-react';
import { EnrichedPermit, LeadCategory, CompanyProfile } from '../types';
import { 
  composeColdOutreachEmail, 
  sendEmailViaBackend, 
  generateMailtoFallback 
} from '../services/firebaseEmail';

interface AnalysisModalProps {
  permit: EnrichedPermit | null;
  onClose: () => void;
  companyProfile?: CompanyProfile;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ permit, onClose, companyProfile }) => {
  // Handle ESC key to close modal - only when modal is visible
  // Use capture phase to ensure this runs before App.tsx handler
  React.useEffect(() => {
    if (!permit || !permit.aiAnalysis) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    // Use capture phase (third parameter = true) to run before bubble phase
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [permit, onClose]);

  if (!permit || !permit.aiAnalysis) return null;

  const { aiAnalysis, enrichmentData } = permit;

  // Generate mailto link for cold outreach (shortened + URL encoded)
  const generateEmailLink = () => {
    const recipientEmail = enrichmentData?.verified ? 'info@company.com' : 'contact@example.com';
    const subject = encodeURIComponent(`${companyProfile?.name || 'Partnership Opportunity'} - ${permit.address}`);
    
    // Shortened body to avoid mailto length limits
    const body = encodeURIComponent(`Hello,

  ${aiAnalysis.salesPitch}

  Project: ${permit.address}, ${permit.city}
  Value: $${permit.valuation.toLocaleString()}
  Applied: ${permit.appliedDate}

  Best regards,
  ${companyProfile?.contactName || 'Your Name'}
  ${companyProfile?.name || 'Your Company'}
  ${companyProfile?.phone || ''}`);

    // subject/body already encoded above; do not double-encode
    return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  };

  // Generate .ics file for calendar export
  const exportToCalendar = () => {
    const startDate = new Date(permit.appliedDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FinishOutNow//Lead Tracking//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${permit.id}@finishoutnow.app`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:Follow up: ${aiAnalysis.extractedEntities.tenantName || permit.applicant}`,
      `DESCRIPTION:Commercial lead opportunity\\n\\n${aiAnalysis.salesPitch}\\n\\nProject: ${permit.description}\\nValue: $${permit.valuation.toLocaleString()}\\nConfidence: ${aiAnalysis.confidenceScore}%`,
      `LOCATION:${permit.address}, ${permit.city}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      `CATEGORIES:${aiAnalysis.category},Commercial Lead`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lead-${permit.permitNumber}-${permit.appliedDate}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const getCategoryColor = (cat: LeadCategory) => {
    switch (cat) {
      case LeadCategory.SECURITY: return 'text-red-400 border-red-400 bg-red-900/20';
      case LeadCategory.SIGNAGE: return 'text-amber-400 border-amber-400 bg-amber-900/20';
      case LeadCategory.LOW_VOLTAGE: return 'text-cyan-400 border-cyan-400 bg-cyan-900/20';
      default: return 'text-gray-400 border-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl relative overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
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
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all bg-slate-800 border border-slate-700 p-2 rounded-lg group"
            title="Close (ESC)"
          >
            <X size={20} className="group-hover:scale-110 transition-transform" />
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

            {/* Entity Verification Section (Phase 3) */}
            <div className={`p-4 rounded-lg border ${enrichmentData?.verified ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
                        <Building size={14} /> Corporate Verification
                    </h3>
                    {enrichmentData?.verified ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <BadgeCheck size={12} /> VERIFIED ENTITY
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            <HelpCircle size={12} /> UNVERIFIED
                        </span>
                    )}
                </div>

                {enrichmentData?.verified ? (
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
                             <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><MapPin size={10}/> Official Mailing Address</p>
                             <p className="text-xs text-slate-300 leading-relaxed">{enrichmentData.officialMailingAddress}</p>
                        </div>
                        {enrichmentData.rightToTransactBusiness && (
                             <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1">
                                <CheckCircle size={10} /> Right to Transact Business Active
                             </p>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <p className="text-xs text-slate-500 italic">No exact match found in Texas Comptroller database for "{aiAnalysis.extractedEntities.tenantName || permit.applicant}".</p>
                    </div>
                )}
            </div>

            {/* Trade Opportunities Checklist */}
            <div>
              <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">Trade Opportunities</h3>
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-lg border ${aiAnalysis.tradeOpportunities.security ? 'bg-red-900/10 border-red-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${aiAnalysis.tradeOpportunities.security ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500'}`}>
                            <Shield size={16} />
                        </div>
                        <span className={aiAnalysis.tradeOpportunities.security ? 'text-white font-medium' : 'text-slate-500'}>Security & Access</span>
                    </div>
                    {aiAnalysis.tradeOpportunities.security && <CheckCircle size={16} className="text-emerald-400" />}
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg border ${aiAnalysis.tradeOpportunities.lowVoltage ? 'bg-cyan-900/10 border-cyan-900/50' : 'bg-slate-800/50 border-slate-700 opacity-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${aiAnalysis.tradeOpportunities.lowVoltage ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-500'}`}>
                            <Monitor size={16} />
                        </div>
                        <span className={aiAnalysis.tradeOpportunities.lowVoltage ? 'text-white font-medium' : 'text-slate-500'}>Low Voltage / IT</span>
                    </div>
                    {aiAnalysis.tradeOpportunities.lowVoltage && <CheckCircle size={16} className="text-emerald-400" />}
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
                    <span className="text-3xl font-bold text-white">${aiAnalysis.estimatedOpportunityValue.toLocaleString()}</span>
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
                <div className="space-y-2">
                  <button
                      onClick={async () => {
                        try {
                          // Compose email using Firebase email service
                          const emailPayload = composeColdOutreachEmail({
                            recipientEmail: (enrichmentData as any)?.verified ? (enrichmentData as any).officialMailingAddress.split('\n')[0] : 'contact@example.com',
                            companyName: companyProfile?.name || 'Your Company',
                            contactName: companyProfile?.contactName || 'Sales Team',
                            contactEmail: companyProfile?.email || 'noreply@finishoutnow.app', // Use company's business email
                            contactPhone: companyProfile?.phone,
                            permitAddress: permit.address,
                            permitCity: permit.city,
                            salesPitch: aiAnalysis.salesPitch,
                            projectValue: aiAnalysis.estimatedOpportunityValue,
                            appliedDate: permit.appliedDate
                          });

                          // Attempt Firebase backend email delivery
                          const result = await sendEmailViaBackend(emailPayload);

                          if (result.success) {
                            alert(`Email sent successfully from ${companyProfile?.email}! (Message ID: ${result.messageId})`);
                            // Copy pitch for reference
                            navigator.clipboard.writeText(aiAnalysis.salesPitch).catch(() => {});
                          } else {
                            console.warn('Firebase email failed, falling back to mailto:', result.error);
                            // Fallback: open mailto link
                            const mailtoLink = generateMailtoFallback(emailPayload);
                            const anchor = document.createElement('a');
                            anchor.href = mailtoLink;
                            anchor.target = '_self';
                            anchor.style.display = 'none';
                            document.body.appendChild(anchor);
                            anchor.click();
                            document.body.removeChild(anchor);

                            // Also try location.assign as backup
                            setTimeout(() => {
                              window.location.assign(mailtoLink);
                            }, 100);
                          }
                        } catch (error) {
                          console.error('Failed to send email:', error);
                          alert('Unable to send email. Please try again or copy the pitch manually.');
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-blue-900/30 flex items-center justify-center gap-2"
                  >
                      <Mail size={18} />
                      Claim & Contact
                  </button>
                  <button
                      onClick={exportToCalendar}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                      <Calendar size={16} />
                      Add to Calendar
                  </button>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
