import { EnrichedPermit, UserPreferences, ContractorProfile } from '../types';
import { recomputeLeadScores } from '../jobs/scoringJob';
import { clusterLeads } from '../geospatial/clusteringService';
import { generateScoringReport } from '../jobs/scoringJob';
import { Logger } from '../logger';

// Dummy implementations for DB and notifications (to be replaced with real services)
async function getAllLeads(): Promise<EnrichedPermit[]> {
  throw new Error('getAllLeads not implemented');
}
async function getContractors(): Promise<ContractorProfile[]> {
  throw new Error('getContractors not implemented');
}
async function saveLeads(leads: EnrichedPermit[]): Promise<void> {
  throw new Error('saveLeads not implemented');
}
async function saveClusters(clusters: any[]): Promise<void> {
  throw new Error('saveClusters not implemented');
}
async function saveScoringReport(report: any): Promise<void> {
  throw new Error('saveScoringReport not implemented');
}
async function sendAlertNotifications(alertLeads: EnrichedPermit[], allUserPreferences: UserPreferences[]): Promise<void> {
  Logger.info(`Sending alert notifications for ${alertLeads.length} leads`);
}
async function getAllUserPreferences(): Promise<UserPreferences[]> {
  throw new Error('getAllUserPreferences not implemented');
}

/**
 * Run this daily to recompute all scores and update data.
 */
export async function runDailyJob() {
  Logger.info('=== Starting Daily Job ===');
  const startTime = Date.now();

  try {
    // Get all leads
    const allLeads = await getAllLeads();
    Logger.info(`Processing ${allLeads.length} leads...`);

    // Get contractors
    const contractors = await getContractors();

    // Recompute scores
    Logger.info('Recomputing scores...');
    const updatedLeads = await recomputeLeadScores(allLeads, contractors);

    // Save updated leads
    await saveLeads(updatedLeads);

    // Generate new clusters
    Logger.info('Regenerating clusters...');
    const clusters = clusterLeads(updatedLeads, 1.0, 3);
    await saveClusters(clusters);

    // Generate scoring report
    const report = generateScoringReport(updatedLeads, allLeads);
    await saveScoringReport(report);

    // Send alerts for score drops
    if (report.alerts.length > 0) {
      Logger.info(`Sending ${report.alerts.length} alert notifications...`);
      await sendAlertNotifications(report.alerts.map(a => a.lead), await getAllUserPreferences());
    }

    const duration = Date.now() - startTime;
    Logger.info(`=== Daily Job Complete (${duration}ms) ===`);

    return {
      success: true,
      duration,
      leadsProcessed: updatedLeads.length,
      clustersGenerated: clusters.length,
      alertsSent: report.alerts.length
    };
  } catch (error) {
    Logger.error('Daily job failed:', error);
    throw error;
  }
}