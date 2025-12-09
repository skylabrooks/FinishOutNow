/**
 * AI Features Integration Example
 * 
 * This file demonstrates how to integrate all AI features into your application.
 * Copy and adapt this code to your needs.
 */

import { EnrichedPermit, UserPreferences, ContractorProfile, GCSubRelationship } from './types';

// Service imports
import { processLeadsForAlerts, filterLeadsByPreferences } from './alerts/alertQueue';
import { clusterLeads, detectHotspots } from './geospatial/clusteringService';
import { processLeadsForContractors, findMatchingContractor } from './contractors/contractorService';
import { buildRelationshipGraph, generateRecommendations } from './network/relationshipGraph';
import { predictProjectProbability } from './ml/projectProbability';
import { recomputeLeadScores, getHighQualityLeads, generateScoringReport } from './jobs/scoringJob';
import { generateProspectList, generateWeeklyDigest, formatProspectListEmail } from './notifications/prospectList';

/**
 * Example 1: Process New Leads Pipeline
 * 
 * This is the main pipeline for processing new leads with all AI features.
 */
export async function processNewLeadsPipeline(
  newLeads: EnrichedPermit[],
  existingContractors: ContractorProfile[] = [],
  existingRelationships: GCSubRelationship[] = []
) {
  console.log(`Processing ${newLeads.length} new leads...`);

  // Step 1: Process contractors from leads
  console.log('Step 1: Building contractor profiles...');
  const contractors = processLeadsForContractors(newLeads, existingContractors);
  console.log(`  ✓ ${contractors.length} contractors`);

  // Step 2: Add ML predictions
  console.log('Step 2: Generating ML predictions...');
  const leadsWithPredictions = newLeads.map(lead => ({
    ...lead,
    prediction: predictProjectProbability(lead)
  }));
  console.log(`  ✓ Predictions added`);

  // Step 3: Recompute scores with contractor data
  console.log('Step 3: Recomputing lead scores...');
  const scoredLeads = await recomputeLeadScores(leadsWithPredictions, contractors);
  console.log(`  ✓ Scores updated`);

  // Step 4: Generate clusters
  console.log('Step 4: Clustering leads...');
  const clusters = clusterLeads(scoredLeads, 1.0, 3);
  console.log(`  ✓ ${clusters.length} clusters found`);

  // Step 5: Detect hotspots
  console.log('Step 5: Detecting hotspots...');
  const hotspots = detectHotspots(scoredLeads, 0.5, 30);
  console.log(`  ✓ ${hotspots.length} hotspots detected`);

  // Step 6: Assign cluster IDs to leads
  console.log('Step 6: Assigning cluster IDs...');
  for (const cluster of clusters) {
    for (const leadId of cluster.leads) {
      const lead = scoredLeads.find(l => l.id === leadId);
      if (lead) lead.clusterId = cluster.id;
    }
  }
  console.log(`  ✓ Cluster IDs assigned`);

  return {
    leads: scoredLeads,
    clusters,
    hotspots,
    contractors
  };
}

/**
 * Example 2: Send Alert Notifications
 * 
 * Process alerts for all users based on their preferences.
 */
export async function sendAlertNotifications(
  newLeads: EnrichedPermit[],
  allUserPreferences: UserPreferences[]
) {
  console.log(`Checking alerts for ${newLeads.length} leads and ${allUserPreferences.length} users...`);

  // Generate alerts
  const alerts = processLeadsForAlerts(newLeads, allUserPreferences);
  console.log(`  ✓ ${alerts.length} alerts generated`);

  // Send notifications (pseudo-code)
  for (const alert of alerts) {
    for (const channel of alert.channels) {
      switch (channel) {
        case 'email':
          await sendEmail(alert.userId, 'New Lead Alert', formatLeadEmail(alert.lead));
          break;
        case 'sms':
          await sendSMS(alert.userId, `New ${alert.lead.city} lead: $${alert.lead.valuation}`);
          break;
        case 'push':
          await sendPushNotification(alert.userId, 'New Lead', alert.lead.description);
          break;
        case 'in_app':
          await createInAppNotification(alert.userId, alert);
          break;
      }
    }
  }

  console.log(`  ✓ Notifications sent`);
  return alerts;
}

/**
 * Example 3: Generate Weekly Digest for User
 * 
 * Create and send weekly prospect list.
 */
export async function generateAndSendWeeklyDigest(
  userId: string,
  userName: string,
  userEmail: string
) {
  console.log(`Generating weekly digest for ${userName}...`);

  // Get user preferences
  const preferences = await getUserPreferences(userId);
  if (!preferences?.enabled) {
    console.log('  ⚠ Alerts disabled for user');
    return null;
  }

  // Get leads from last 7 days
  const recentLeads = await getLeadsFromLastNDays(7);
  console.log(`  ✓ ${recentLeads.length} recent leads`);

  // Get relationships
  const relationships = await getRelationships();

  // Generate prospect list
  const prospectList = generateProspectList(recentLeads, preferences, relationships, 60);
  console.log(`  ✓ ${prospectList.length} qualified prospects`);

  if (prospectList.length === 0) {
    console.log('  ⚠ No prospects this week');
    return null;
  }

  // Generate digest
  const digest = generateWeeklyDigest(prospectList, 10);
  const html = formatProspectListEmail(digest, userName);

  // Send email
  await sendEmail(userEmail, 'Your Weekly Prospect Report', html);
  console.log(`  ✓ Email sent`);

  return digest;
}

/**
 * Example 4: Get Lead Recommendations
 * 
 * Get subcontractor recommendations for a specific lead.
 */
export async function getLeadRecommendations(leadId: string) {
  console.log(`Getting recommendations for lead ${leadId}...`);

  // Get lead
  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error('Lead not found');
  }

  // Get relationships
  const relationships = await getRelationships();

  // Generate recommendations
  const recommendations = generateRecommendations(lead, relationships, 30);
  console.log(`  ✓ ${recommendations.length} recommendations`);

  // Return formatted response
  return {
    leadId,
    lead: {
      city: lead.city,
      permitType: lead.permitType,
      valuation: lead.valuation,
      category: lead.aiAnalysis?.category,
      generalContractor: lead.aiAnalysis?.extractedEntities?.generalContractor
    },
    recommendations: recommendations.map(rec => ({
      name: rec.subName,
      score: rec.relevanceScore,
      reason: rec.reason,
      pastProjects: rec.pastProjectsWithGC,
      categories: rec.categories
    }))
  };
}

/**
 * Example 5: Dashboard Data Aggregation
 * 
 * Get all data needed for the AI-powered dashboard.
 */
export async function getDashboardData(userId: string) {
  console.log(`Loading dashboard data for user ${userId}...`);

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

  console.log(`  ✓ Dashboard data loaded`);

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

/**
 * Example 6: Scheduled Daily Job
 * 
 * Run this daily to recompute all scores and update data.
 */
export async function runDailyJob() {
  console.log('=== Starting Daily Job ===');
  const startTime = Date.now();

  try {
    // Get all leads
    const allLeads = await getAllLeads();
    console.log(`Processing ${allLeads.length} leads...`);

    // Get contractors
    const contractors = await getContractors();

    // Recompute scores
    console.log('Recomputing scores...');
    const updatedLeads = await recomputeLeadScores(allLeads, contractors);

    // Save updated leads
    await saveLeads(updatedLeads);

    // Generate new clusters
    console.log('Regenerating clusters...');
    const clusters = clusterLeads(updatedLeads, 1.0, 3);
    await saveClusters(clusters);

    // Generate scoring report
    const report = generateScoringReport(updatedLeads, allLeads);
    await saveScoringReport(report);

    // Send alerts for score drops
    if (report.alerts.length > 0) {
      console.log(`Sending ${report.alerts.length} alert notifications...`);
      await sendAlertNotifications(report.alerts.map(a => a.lead), await getAllUserPreferences());
    }

    const duration = Date.now() - startTime;
    console.log(`=== Daily Job Complete (${duration}ms) ===`);

    return {
      success: true,
      duration,
      leadsProcessed: updatedLeads.length,
      clustersGenerated: clusters.length,
      alertsSent: report.alerts.length
    };
  } catch (error) {
    console.error('Daily job failed:', error);
    throw error;
  }
}

// ==========================================
// Helper Functions (implement these based on your database)
// ==========================================

async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // TODO: Fetch from database
  throw new Error('Not implemented');
}

async function getAllUserPreferences(): Promise<UserPreferences[]> {
  // TODO: Fetch from database
  throw new Error('Not implemented');
}

async function getLeadsFromLastNDays(days: number): Promise<EnrichedPermit[]> {
  // TODO: Fetch from database with date filter
  throw new Error('Not implemented');
}

async function getAllLeads(): Promise<EnrichedPermit[]> {
  // TODO: Fetch from database
  throw new Error('Not implemented');
}

async function getLead(leadId: string): Promise<EnrichedPermit | null> {
  // TODO: Fetch from database
  throw new Error('Not implemented');
}

async function getRelationships(): Promise<GCSubRelationship[]> {
  // TODO: Fetch from database
  throw new Error('Not implemented');
}

async function getContractors(): Promise<ContractorProfile[]> {
  // TODO: Fetch from database
  throw new Error('Not implemented');
}

async function saveLeads(leads: EnrichedPermit[]): Promise<void> {
  // TODO: Save to database
  throw new Error('Not implemented');
}

async function saveClusters(clusters: any[]): Promise<void> {
  // TODO: Save to database
  throw new Error('Not implemented');
}

async function saveScoringReport(report: any): Promise<void> {
  // TODO: Save to database
  throw new Error('Not implemented');
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // TODO: Implement email sending
  console.log(`📧 Email to ${to}: ${subject}`);
}

async function sendSMS(userId: string, message: string): Promise<void> {
  // TODO: Implement SMS sending
  console.log(`📱 SMS: ${message}`);
}

async function sendPushNotification(userId: string, title: string, body: string): Promise<void> {
  // TODO: Implement push notifications
  console.log(`🔔 Push: ${title} - ${body}`);
}

async function createInAppNotification(userId: string, alert: any): Promise<void> {
  // TODO: Create in-app notification
  console.log(`📬 In-app notification for user ${userId}`);
}

function formatLeadEmail(lead: EnrichedPermit): string {
  // TODO: Format lead as HTML email
  return `<h1>${lead.city} - ${lead.permitType}</h1>`;
}

// ==========================================
// Usage Examples
// ==========================================

/**
 * Example: Process new batch of leads
 */
export async function exampleProcessNewLeads() {
  const newLeads: EnrichedPermit[] = []; // Your new leads
  const result = await processNewLeadsPipeline(newLeads);
  
  console.log('Pipeline complete:', {
    leads: result.leads.length,
    clusters: result.clusters.length,
    hotspots: result.hotspots.length,
    contractors: result.contractors.length
  });
}

/**
 * Example: Setup cron jobs
 */
export function setupCronJobs() {
  // Daily at 2 AM
  // cron.schedule('0 2 * * *', () => runDailyJob());
  
  // Weekly on Monday at 8 AM
  // cron.schedule('0 8 * * 1', () => sendWeeklyDigests());
  
  console.log('Cron jobs configured');
}
