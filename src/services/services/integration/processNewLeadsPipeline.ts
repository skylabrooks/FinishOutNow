import { EnrichedPermit, ContractorProfile, GCSubRelationship } from '../types';
import { processLeadsForContractors } from '../contractors/contractorService';
import { predictProjectProbability } from '../ml/projectProbability';
import { recomputeLeadScores } from '../jobs/scoringJob';
import { clusterLeads, detectHotspots } from '../geospatial/clusteringService';
import { Logger } from '../logger';

/**
 * Main pipeline for processing new leads with all AI features.
 */
export async function processNewLeadsPipeline(
  newLeads: EnrichedPermit[],
  existingContractors: ContractorProfile[] = [],
  existingRelationships: GCSubRelationship[] = []
) {
  Logger.info(`Processing ${newLeads.length} new leads...`);

  // Step 1: Process contractors from leads
  Logger.info('Step 1: Building contractor profiles...');
  const contractors = processLeadsForContractors(newLeads, existingContractors);
  Logger.info(`  ✓ ${contractors.length} contractors`);

  // Step 2: Add ML predictions
  Logger.info('Step 2: Generating ML predictions...');
  const leadsWithPredictions = newLeads.map(lead => ({
    ...lead,
    prediction: predictProjectProbability(lead)
  }));
  Logger.info(`  ✓ Predictions added`);

  // Step 3: Recompute scores with contractor data
  Logger.info('Step 3: Recomputing lead scores...');
  const scoredLeads = await recomputeLeadScores(leadsWithPredictions, contractors);
  Logger.info(`  ✓ Scores updated`);

  // Step 4: Generate clusters
  Logger.info('Step 4: Clustering leads...');
  const clusters = clusterLeads(scoredLeads, 1.0, 3);
  Logger.info(`  ✓ ${clusters.length} clusters found`);

  // Step 5: Detect hotspots
  Logger.info('Step 5: Detecting hotspots...');
  const hotspots = detectHotspots(scoredLeads, 0.5, 30);
  Logger.info(`  ✓ ${hotspots.length} hotspots detected`);

  // Step 6: Assign cluster IDs to leads
  Logger.info('Step 6: Assigning cluster IDs...');
  for (const cluster of clusters) {
    for (const leadId of cluster.leads) {
      const lead = scoredLeads.find(l => l.id === leadId);
      if (lead) lead.clusterId = cluster.id;
    }
  }
  Logger.info(`  ✓ Cluster IDs assigned`);

  return {
    leads: scoredLeads,
    clusters,
    hotspots,
    contractors
  };
}