/**
 * Email generation utilities for lead outreach
 */

import { EnrichedPermit, CompanyProfile } from '../types';

export const generateEmailLink = (
  permit: EnrichedPermit,
  companyProfile?: CompanyProfile
): string => {
  const recipientEmail = permit.enrichmentData?.verified 
    ? 'info@company.com' 
    : 'contact@example.com';
  
  const subject = encodeURIComponent(
    `${companyProfile?.name || 'Partnership Opportunity'} - ${permit.address}`
  );

  const body = encodeURIComponent(`Hello,

${permit.aiAnalysis?.salesPitch || 'We would like to discuss a partnership opportunity.'}

Project: ${permit.address}, ${permit.city}
Value: $${permit.valuation.toLocaleString()}
Applied: ${permit.appliedDate}

Best regards,
${companyProfile?.contactName || 'Your Name'}
${companyProfile?.name || 'Your Company'}
${companyProfile?.phone || ''}`);

  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
