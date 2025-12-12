/**
 * CSV export utilities for lead data
 */

import { EnrichedPermit } from '../types';

interface ClaimedLeadWithPermit {
  id: string;
  leadId: string;
  claimedAt: string;
  expiresAt: string;
  status: string;
  permit?: EnrichedPermit;
}

export const exportAcquiredLeadsCSV = (leads: ClaimedLeadWithPermit[]): void => {
  const headers = [
    'Lead ID',
    'Address',
    'City',
    'Est. Value',
    'Confidence',
    'Urgency',
    'Claimed Date',
    'Status',
    'Project Type',
  ];

  const rows = leads.map(lead => [
    lead.leadId,
    lead.permit?.address || 'N/A',
    lead.permit?.city || 'N/A',
    `$${(lead.permit?.aiAnalysis?.estimatedValue || 0).toLocaleString()}`,
    `${lead.permit?.aiAnalysis?.confidenceScore || 0}%`,
    lead.permit?.aiAnalysis?.urgency || 'N/A',
    new Date(lead.claimedAt).toLocaleDateString(),
    lead.status,
    lead.permit?.permitType || 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadCSV(csvContent, `acquired_leads_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportPermitsCSV = (permits: EnrichedPermit[]): void => {
  const headers = [
    'Permit Number',
    'Address',
    'City',
    'Applicant',
    'Permit Type',
    'Applied Date',
    'Valuation',
    'Description',
    'Confidence Score',
    'Category',
    'Est. Value',
    'Urgency',
  ];

  const rows = permits.map(permit => [
    permit.permitNumber,
    permit.address,
    permit.city,
    permit.applicant,
    permit.permitType,
    permit.appliedDate,
    `$${permit.valuation.toLocaleString()}`,
    permit.description,
    permit.aiAnalysis?.confidenceScore ? `${permit.aiAnalysis.confidenceScore}%` : 'N/A',
    permit.aiAnalysis?.category || 'N/A',
    permit.aiAnalysis?.estimatedValue ? `$${permit.aiAnalysis.estimatedValue.toLocaleString()}` : 'N/A',
    permit.aiAnalysis?.urgency || 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadCSV(csvContent, `permits_export_${new Date().toISOString().split('T')[0]}.csv`);
};

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
