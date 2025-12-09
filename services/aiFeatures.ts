/**
 * AI Features Index
 * 
 * Central export point for all AI features.
 * Import everything you need from this single file.
 */

// ==========================================
// ALERTS
// ==========================================
export {
  matchesPreferences,
  createAlertQueueItem,
  processLeadsForAlerts,
  filterLeadsByPreferences,
  generateAlertSummary
} from './alerts/alertQueue';

export type { AlertSummary } from './alerts/alertQueue';

// ==========================================
// GEOSPATIAL
// ==========================================
export {
  clusterLeads,
  detectHotspots,
  calculateDistance,
  filterClusters,
  getClusterLeads
} from './geospatial/clusteringService';

export {
  leadsToHeatmapPoints,
  getHeatmapConfig,
  generateHotspotSummary,
  filterHotspotsByArea
} from './geospatial/heatmapService';

export type {
  HeatmapPoint,
  HeatmapConfig,
  HotspotSummary
} from './geospatial/heatmapService';

// ==========================================
// CONTRACTORS
// ==========================================
export {
  findMatchingContractor,
  createContractorProfile,
  updateContractorProfile,
  processLeadsForContractors,
  calculatePerformance,
  rankContractors,
  filterContractors,
  mergeContractorProfiles
} from './contractors/contractorService';

// ==========================================
// NETWORK / RECOMMENDATIONS
// ==========================================
export {
  buildRelationshipGraph,
  getSubcontractorsForGC,
  getGCsForSubcontractor,
  findSubcontractorsByCategory,
  generateRecommendations,
  getNetworkStats,
  findSimilarGCs
} from './network/relationshipGraph';

export type { NetworkStats } from './network/relationshipGraph';

// ==========================================
// ML / PREDICTIONS
// ==========================================
export {
  predictProjectProbability,
  batchPredictProbability,
  filterByProbability,
  sortByProbability
} from './ml/projectProbability';

// ==========================================
// SCORING / JOBS
// ==========================================
import {
  recomputeLeadScores,
  getHighQualityLeads as importedGetHighQualityLeads,
  detectLeadAlerts,
  generateScoringReport,
  createScoringJobSchedule
} from './jobs/scoringJob';

export {
  recomputeLeadScores,
  importedGetHighQualityLeads as getHighQualityLeads,
  detectLeadAlerts,
  generateScoringReport,
  createScoringJobSchedule
};

export type {
  LeadAlert,
  ScoringReport,
  JobSchedule
} from './jobs/scoringJob';

// ==========================================
// NOTIFICATIONS
// ==========================================
export {
  generateProspectList,
  generateWeeklyDigest,
  formatProspectListEmail,
  formatProspectListText
} from './notifications/prospectList';

export type { WeeklyDigest } from './notifications/prospectList';

// ==========================================
// LEAD SCORING
// ==========================================
export {
  computeLeadScore,
  computeLeadScoreCustom
} from '../utils/leadScoring';

// ==========================================
// GEOCODING
// ==========================================
export {
  geocodingService,
  GeocodingService
} from './geocoding/GeocodingService';

export type { Coordinates } from './geocoding/GeocodingService';

// ==========================================
// CONVENIENCE BUNDLES
// ==========================================

/**
 * Complete pipeline bundle
 */
export const AIFeatures = {
  // Alerts
  alerts: {
    matchesPreferences,
    processLeadsForAlerts,
    filterLeadsByPreferences,
    generateAlertSummary
  },
  
  // Geospatial
  geospatial: {
    clusterLeads,
    detectHotspots,
    leadsToHeatmapPoints
  },
  
  // Contractors
  contractors: {
    findMatchingContractor,
    processLeadsForContractors,
    calculatePerformance
  },
  
  // Network
  network: {
    buildRelationshipGraph,
    generateRecommendations,
    getNetworkStats
  },
  
  // Scoring
  scoring: {
    recomputeLeadScores,
    getHighQualityLeads: importedGetHighQualityLeads,
    computeLeadScore
  },
  
  // Notifications
  notifications: {
    generateProspectList,
    generateWeeklyDigest,
    formatProspectListEmail
  }
};

/**
 * Quick access to most commonly used functions
 */
export const AIQuick = {
  // Check if lead matches user preferences
  matchLead: matchesPreferences,
  
  // Cluster leads geographically
  cluster: clusterLeads,
  
  // Find contractor by name
  findContractor: findMatchingContractor,
  
  // Get subcontractor recommendations
  // Get high-quality leads
  topLeads: importedGetHighQualityLeads
  // Find contractor by name
  findContractor: findMatchingContractor,
  
  // Predict project probability
  predict: predictProjectProbability,
  
  // Compute lead score
  score: computeLeadScore,
  
  // Get high-quality leads
  topLeads: importedGetHighQualityLeads
};
  AlertQueueItem,
  LeadCluster,
  Hotspot,
  ContractorProfile,
  ContractorPerformance,
  GCSubRelationship,
  SubcontractorRecommendation,
  ProspectListItem,
  ProjectProbability,
  
  // Support types
  GeoFilter,
  ScoringThresholds,
  NotificationChannel,
  GeoPoint,
  GeoPolygon,
  LeadCategory
} from '../types';
