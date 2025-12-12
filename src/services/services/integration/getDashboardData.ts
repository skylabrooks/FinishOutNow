import { EnrichedPermit, UserPreferences } from '../types';
import { filterLeadsByPreferences } from '../alerts/alertQueue';
import { getHighQualityLeads } from '../jobs/scoringJob';
import { clusterLeads, detectHotspots } from '../geospatial/clusteringService';
import { generateScoringReport } from '../jobs/scoringJob';
import { Logger } from '../logger';

// Dummy implementations for DB (to be replaced with real services)
async function getUserPreferences(userId: string): Promise<UserPreferences> {
  throw new Error('getUserPreferences not implemented');
}
async function getAllLeads(): Promise<EnrichedPermit[]> {
  throw new Error('getAllLeads not implemented');
}
async function getContractors(): Promise<any[]> {
  throw new Error('getContractors not implemented');
}

/**
 * Get all data needed for the AI-powered dashboard.
 */
export async function getDashboardData(userId: string) {
  Logger.info(`Loading dashboard data for user ${userId}...`);

  // Get user preferences
  const preferences = await getUserPreferences(userId);

  // Get all leads
  const allLeads = await getAllLeads();

  // Filter by preferences
  const filteredLeads = preferences 
    ? filterLeadsByPreferences(allLeads, preferences)
    : allLeads;

  // Get high-quality leads
  const highQualityLeads = getHighQualityLeads(filteredLeads, 70);

  // Get clusters and hotspots
  const clusters = clusterLeads(filteredLeads, 1.0, 3);
  const hotspots = detectHotspots(filteredLeads, 0.5, 30);

  // Get contractors
  const contractors = await getContractors();

  // Get scoring report
  const scoringReport = generateScoringReport(filteredLeads);

  Logger.info(`  ✓ Dashboard data loaded`);

  return {
    summary: {
      totalLeads: filteredLeads.length,
      highQualityCount: highQualityLeads.length,
      avgScore: scoringReport.avgScore,
      totalValuation: filteredLeads.reduce((sum, l) => sum + l.valuation, 0),
      clusterCount: clusters.length,
      hotspotCount: hotspots.length
    },
    leads: {
      all: filteredLeads.slice(0, 50), // Paginated
      highQuality: highQualityLeads.slice(0, 20)
    },
    geospatial: {
      clusters,
      hotspots
    },
    contractors: contractors.slice(0, 10),
    scoringReport
  };
}