

export type PermitType = 'Commercial Remodel' | 'Certificate of Occupancy' | 'New Construction';

export interface Permit {
  id: string;
  permitNumber: string;
  permitType: PermitType;
  address: string;
  city: 'Dallas' | 'Fort Worth' | 'Plano' | 'Frisco' | 'Irving' | 'Arlington';
  appliedDate: string;
  description: string;
  applicant: string;
  valuation: number;
  status: 'Issued' | 'Under Review' | 'Pending Inspection';
  dataSource?: string;
}

export enum LeadCategory {
  SECURITY = 'Security & Access Control',
  SIGNAGE = 'Signage & Branding',
  LOW_VOLTAGE = 'IT & Low Voltage',
  GENERAL = 'General Remodel',
  UNKNOWN = 'Uncategorized'
}

export interface TradeOpportunities {
  security: boolean;
  signage: boolean;
  lowVoltage: boolean;
}

export interface ExtractedEntities {
  tenantName?: string;
  generalContractor?: string;
}

export interface EnrichmentData {
  verified: boolean;
  taxpayerNumber?: string;
  taxpayerName?: string;
  officialMailingAddress?: string;
  rightToTransactBusiness?: boolean;
  source?: 'TX Comptroller' | 'Mock';
}

export interface AIAnalysisResult {
  // Core "Commercial Trigger" fields
  isCommercialTrigger: boolean;
  confidenceScore: number;
  projectType: 'Tenant Improvement' | 'New Construction' | 'Maintenance/Repair' | 'Certificate of Occupancy';
  tradeOpportunities: TradeOpportunities;
  extractedEntities: ExtractedEntities;
  reasoning: string;
  
  // UI Support fields
  category: LeadCategory; // Primary category for sorting/display
  salesPitch: string;
  urgency: 'High' | 'Medium' | 'Low';
  estimatedOpportunityValue: number;
}

export interface EnrichedPermit extends Permit {
  aiAnalysis?: AIAnalysisResult;
  enrichmentData?: EnrichmentData;
  isAnalyzing?: boolean;
}

export interface CompanyProfile {
  name: string;
  industry: LeadCategory;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  valueProp: string;
}