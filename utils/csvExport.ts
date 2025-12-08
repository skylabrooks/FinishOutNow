import { EnrichedPermit } from '../types';

export function exportPermitsToCSV(permits: EnrichedPermit[]): void {
  const headers = [
    "ID",
    "City",
    "Date Applied",
    "Permit Type",
    "Description",
    "Address",
    "Valuation",
    "Applicant",
    "Tenant Name",
    "Category",
    "Is Commercial",
    "Confidence %",
    "Urgency",
    "Est. Opportunity Value",
    "Sales Pitch",
    "Verified Entity",
    "Entity Name",
    "Taxpayer ID",
    "Mailing Address"
  ];

  const rows = permits.map(p => [
    p.id,
    p.city,
    p.appliedDate,
    p.permitType,
    p.description.substring(0, 100), // Truncate for readability
    p.address,
    p.valuation,
    p.applicant,
    p.aiAnalysis?.extractedEntities.tenantName || "N/A",
    p.aiAnalysis?.category || "Uncategorized",
    p.aiAnalysis?.isCommercialTrigger ? "Yes" : "No",
    p.aiAnalysis?.confidenceScore || 0,
    p.aiAnalysis?.urgency || "Unknown",
    p.aiAnalysis?.estimatedValue || 0,
    `"${p.aiAnalysis?.salesPitch?.replace(/"/g, '""') || ''}"`, // Escape quotes
    p.enrichmentData?.verified ? "Yes" : "No",
    p.enrichmentData?.taxpayerName || "N/A",
    p.enrichmentData?.taxpayerNumber || "N/A",
    `"${p.enrichmentData?.officialMailingAddress?.replace(/"/g, '""') || 'N/A'}"` // Escape quotes
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `finishout_leads_${new Date().toISOString().split('T')[0]}.csv`);
  
  try {
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    // In test environment or if DOM manipulation fails, just trigger click
    link.click();
  }
}
