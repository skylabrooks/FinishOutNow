
import { Permit, EnrichedPermit } from '../types';
import { MOCK_PERMITS } from './mockData';
import { fetchDallasPermits } from './ingestion/dallas';
import { fetchFortWorthPermits } from './ingestion/fortWorth';
import { fetchArlingtonPermits } from './ingestion/arlington';
import { fetchPlanoPermits } from './ingestion/plano';
import { fetchIrvingPermits } from './ingestion/irving';
import { searchFranchiseTaxpayer } from './enrichment/comptroller';

export const leadManager = {
  /**
   * Aggregates leads from all live API sources and merges with mock data.
   * Handles deduplication and normalization.
   */
  fetchAllLeads: async (): Promise<EnrichedPermit[]> => {
    console.log('LeadManager: Starting automated sourcing (Phase 2)...');

    // Run fetches in parallel for performance
    const [dallas, fw, arlington, plano, irving] = await Promise.all([
      fetchDallasPermits(),
      fetchFortWorthPermits(),
      fetchArlingtonPermits(),
      fetchPlanoPermits(),
      fetchIrvingPermits()
    ]);

    console.log(`LeadManager: Fetched ${dallas.length} DAL, ${fw.length} FW, ${arlington.length} ARL, ${plano.length} PLA, ${irving.length} IRV.`);

    // Combine all sources
    // Note: We keep MOCK_PERMITS for demonstration purposes
    const allPermits = [
      ...dallas,
      ...fw,
      ...arlington,
      ...plano,
      ...irving,
      ...MOCK_PERMITS
    ];

    // Deduplicate by ID
    const uniquePermitsMap = new Map<string, EnrichedPermit>();
    allPermits.forEach(permit => {
      if (!uniquePermitsMap.has(permit.id)) {
        uniquePermitsMap.set(permit.id, permit);
      }
    });

    // Convert back to array
    const sortedLeads = Array.from(uniquePermitsMap.values()).sort((a, b) => {
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    });

    return sortedLeads;
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

    console.log(`LeadManager: Enriching entity "${searchName}"...`);
    const data = await searchFranchiseTaxpayer(searchName);

    return {
        ...permit,
        enrichmentData: data || { verified: false }
    };
  }
};
