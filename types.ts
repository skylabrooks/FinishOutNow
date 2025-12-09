

export type PermitType = 'Commercial Remodel' | 'Certificate of Occupancy' | 'New Construction' | 'Utility Hookup' | 'Zoning Case' | 'Eviction Notice' | 'Health Permit' | 'Food Service Permit' | 'Liquor License' | 'Fire Alarm' | 'Incentive Announcement';

export type ProjectStage = 'PRE_PERMIT' | 'PERMIT_APPLIED' | 'PERMIT_ISSUED' | 'UNDER_CONSTRUCTION' | 'FINAL_INSPECTION' | 'COMPLETE' | 'OCCUPANCY_PENDING' | 'CONCEPT' | 'PRE_OPENING';

export type LandUse = 'COMMERCIAL' | 'RESIDENTIAL' | 'MIXED' | 'UNKNOWN';

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
  
  // Quality filter fields (01_data_sources_and_ingestion.md)
  stage?: ProjectStage;
  landUse?: LandUse;
  isActionable?: boolean;   // Meets all minimum quality filters
  isRecent?: boolean;        // Within stage-specific recency window (default 30 days)
  leadScore?: number;        // 0-100 composite quality score
  geocoded?: boolean;
  valueAboveThreshold?: boolean;
  typeSupported?: boolean;
  landUseSupported?: boolean;
  businessVerified?: boolean;
  withinRegion?: boolean;
  addressValid?: boolean;
  recencyWindowDays?: number;
  highQualityCandidate?: boolean; // Actionable + score ≥ threshold
  isHighQuality?: boolean;        // Actionable + recent + score ≥ threshold
  
  // Geospatial fields (Phase 2)
  geometry?: GeoPoint | GeoPolygon;
  clusterId?: string;
  hotspotId?: string;
  
  // Contractor fields (Phase 3)
  contractorId?: string;
  contractorQualityScore?: number;
  
  // ML predictions (Phase 5)
  prediction?: ProjectProbability;
}

export enum LeadCategory {
  SECURITY = 'Security & Access Control',
  SIGNAGE = 'Signage & Branding',
  LOW_VOLTAGE = 'IT & Low Voltage',
  GENERAL = 'General Remodel',
  UNKNOWN = 'Uncategorized'
}

export interface TradeOpportunities {
  securityIntegrator: boolean;
  signage: boolean;
  lowVoltageIT: boolean;
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
  naicsCode?: string;
  naicsDescription?: string;
  isCommercialNaics?: boolean;
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
  estimatedValue: number;
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
  phone: string;
  website: string;
  valueProp: string;
}

export interface LeadClaim {
  id: string;
  leadId: string;
  businessId: string;
  businessName: string;
  claimedAt: string;
  claimedBy: string;
  paymentStatus: 'pending' | 'paid' | 'free';
  expiresAt?: string;
  notes?: string;
}

export interface LeadVisibility {
  leadId: string;
  isClaimed: boolean;
  claimedBy?: string;
  hiddenFields: ('applicant' | 'address' | 'valuation' | 'description')[];
  visibleFields: ('permitType' | 'city' | 'status' | 'appliedDate' | 'applicant' | 'address' | 'valuation' | 'description')[];
}

// ========================================
// PHASE 1: PREDICTIVE ALERTS
// ========================================

export interface GeoFilter {
  cities?: string[];
  radiusMiles?: number;
  centerLat?: number;
  centerLng?: number;
  excludeZipCodes?: string[];
}

export interface ScoringThresholds {
  minLeadScore?: number;
  minValuation?: number;
  maxValuation?: number;
  minConfidenceScore?: number;
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface UserPreferences {
  userId: string;
  geoFilters?: GeoFilter;
  scoringThresholds?: ScoringThresholds;
  notificationChannels: NotificationChannel[];
  categories?: LeadCategory[];
  permitTypes?: PermitType[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertQueueItem {
  id: string;
  userId: string;
  leadId: string;
  lead: EnrichedPermit;
  channels: NotificationChannel[];
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

// ========================================
// PHASE 2: GEOSPATIAL CLUSTERING
// ========================================

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of rings
}

export interface LeadCluster {
  id: string;
  centroid: GeoPoint;
  leads: string[]; // Array of lead IDs
  averageScore: number;
  totalValuation: number;
  radiusMiles: number;
  density: number; // leads per square mile
  topCategories: LeadCategory[];
  createdAt: string;
}

export interface Hotspot {
  id: string;
  center: GeoPoint;
  intensity: number; // 0-100
  leadCount: number;
  avgValuation: number;
  radiusMiles: number;
}

// ========================================
// PHASE 3: CONTRACTOR BENCHMARKING
// ========================================

export interface ContractorProfile {
  id: string;
  name: string;
  aliases: string[]; // For fuzzy matching
  projectCount: number;
  totalValuation: number;
  avgProjectSize: number;
  categories: LeadCategory[];
  cities: string[];
  qualityScore: number; // 0-100
  reliability: number; // 0-100 based on project completion
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractorPerformance {
  contractorId: string;
  successfulProjects: number;
  failedProjects: number;
  avgTimeToComplete: number; // days
  avgValuation: number;
  topCategories: LeadCategory[];
}

// ========================================
// PHASE 4: SUBCONTRACTOR RECOMMENDATIONS
// ========================================

export interface GCSubRelationship {
  gcId: string;
  gcName: string;
  subId: string;
  subName: string;
  projectCount: number;
  categories: LeadCategory[];
  lastWorkedTogether: string;
  relationshipStrength: number; // 0-100
}

export interface SubcontractorRecommendation {
  subId: string;
  subName: string;
  relevanceScore: number; // 0-100
  reason: string;
  pastProjectsWithGC: number;
  categories: LeadCategory[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface ProspectListItem {
  leadId: string;
  lead: EnrichedPermit;
  recommendations: SubcontractorRecommendation[];
  generatedAt: string;
}

// ========================================
// PHASE 5: ML PREDICTIONS
// ========================================

export interface ProjectProbability {
  leadId: string;
  probabilityScore: number; // 0-100
  estimatedStartDate?: string;
  estimatedDuration?: number; // days
  confidence: number; // 0-100
  factors: {
    historicalPattern: number;
    seasonality: number;
    marketConditions: number;
    contractorActivity: number;
  };
  lastUpdated: string;
}