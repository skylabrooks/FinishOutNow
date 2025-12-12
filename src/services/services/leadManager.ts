import { Logger } from './logger';

import { Permit, EnrichedPermit } from '../types';
import { MOCK_PERMITS } from './mockData';
import { fetchAllPermitsAndSignals } from './ingestionOrchestrator';
import { searchFranchiseTaxpayer } from './enrichment/comptroller';
import { geocodePermits } from './geocodingManager';
import { applyFiltersAndScore, isHighQuality } from './scoringManager';
import { deduplicateAllPermits, getDedupStats } from './deduplicationManager';

// All logic is now orchestrated via dedicated modules for ingestion, deduplication, geocoding, and scoring.
// leadManager is now a thin orchestrator for legacy compatibility.

export async function orchestrateLeadPipeline() {
  // 1. Ingest all permits and signals
  const allPermits = await fetchAllPermitsAndSignals();
  // 2. Deduplicate
  const deduped = deduplicateAllPermits(allPermits);
  // 3. Geocode
  await geocodePermits(deduped);
  // 4. Score and filter
  const scored = applyFiltersAndScore(deduped);
  // 5. Return high quality
  return scored.filter(isHighQuality);
}
export const leadManager = {
  /**
   * Aggregates leads from all live API sources and merges with mock data.
   * Handles deduplication and normalization.
   * Integrates creative signals (utility, zoning, legal, licensing, incentives).
   */
  fetchAllLeads: async (): Promise<EnrichedPermit[]> => {
    // Legacy compatibility: just run the orchestrated pipeline
    return orchestrateLeadPipeline();
  },

  /**
   * Enriches a specific permit with Texas Comptroller entity data.
   * Prioritizes Tenant Name (if extracted by AI), otherwise uses Applicant.
   */
  enrichPermit: async (permit: EnrichedPermit): Promise<EnrichedPermit> => {
    // 1. Determine best name to search
    const tenant = permit.aiAnalysis?.extractedEntities?.tenantName;
    const applicant = permit.applicant;
    
    // Prefer tenant name if it looks valid, otherwise applicant
    const searchName = (tenant && tenant.length > 2) ? tenant : applicant;

    if (!searchName || searchName === 'Unknown') {
        return { ...permit, enrichmentData: { verified: false } };
    }

    Logger.info(`LeadManager: Enriching entity "${searchName}"...`);
    const data = await searchFranchiseTaxpayer(searchName);

    return {
        ...permit,
        enrichmentData: data || { verified: false }
    };
  },

  /**
   * Enriches multiple permits with Texas Comptroller entity data.
   * Used by tests and batch operations.
   */
  enrichLeads: async (permits: EnrichedPermit[]): Promise<EnrichedPermit[]> => {
    const enriched = await Promise.all(
      permits.map(permit => leadManager.enrichPermit(permit))
    );
    return enriched;
  }
};
