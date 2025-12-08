
import { Permit, EnrichedPermit } from '../types';
import { MOCK_PERMITS } from './mockData';
import { fetchDallasPermits } from './ingestion/dallas';
import { fetchFortWorthPermits } from './ingestion/fortWorth';
import { fetchArlingtonPermits } from './ingestion/arlington';
import { fetchPlanoPermits } from './ingestion/plano';
import { fetchIrvingPermits } from './ingestion/irving';
import { searchFranchiseTaxpayer } from './enrichment/comptroller';
import { geocodingService } from './geocoding/GeocodingService';

/**
 * Geocode permits that don't already have coordinates.
 * Uses the shared geocoding service with caching.
 */
async function geocodePermits(permits: EnrichedPermit[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  // Collect addresses that need geocoding
  const toGeocode: string[] = [];
  for (const permit of permits) {
    // Skip if already has coordinates from ingestion
    const existingCoords = geocodingService.extractCoordinates(permit, permit.address);
    if (existingCoords) continue;

    if (permit.address && !geocodingService.isCached(permit.address)) {
      toGeocode.push(permit.address);
    }
  }

  if (toGeocode.length === 0) return;

  // Geocode addresses with rate limiting
  await geocodingService.geocodeBatch(toGeocode, 900);

  // Apply coordinates back to permits
  for (const permit of permits) {
    const anyP = permit as any;
    const coords = geocodingService.extractCoordinates(permit, permit.address);
    
    if (coords && !(anyP.latitude !== undefined && anyP.longitude !== undefined)) {
      anyP.latitude = coords[0];
      anyP.longitude = coords[1];
    }
  }
}

// -----------------------------------------------------------------------------

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

    // Attempt to geocode any permits that don't already include coordinates.
    // This runs in the client (leadManager is used by the browser app). We cache results
    // in `localStorage` under `finishoutnow_geocache_v1` to avoid repeated network calls.
    // Skip geocoding in test environments (NODE_ENV=test) to speed up tests
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (!isTestEnv) {
      try {
        await geocodePermits(sortedLeads);
      } catch (err) {
        console.warn('LeadManager: Geocoding step failed or was skipped', err);
      }
    }

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
