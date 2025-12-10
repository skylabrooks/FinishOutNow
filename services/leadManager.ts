
import { Permit, EnrichedPermit } from '../types';
import { MOCK_PERMITS } from './mockData';
import { fetchDallasPermits } from './ingestion/dallas';
import { fetchFortWorthPermits } from './ingestion/fortWorth';
import { fetchArlingtonPermits } from './ingestion/arlington';
import { fetchPlanoPermits } from './ingestion/plano';
import { fetchIrvingPermits } from './ingestion/irving';
import { fetchUtilityConnections } from './ingestion/utilityConnections';
import { fetchZoningCases } from './ingestion/zoningCases';
import { fetchLegalVacancySignals } from './ingestion/legalVacancy';
import { fetchLicensingSignals } from './ingestion/licensingSignals';
import { fetchIncentiveSignals } from './ingestion/incentiveSignals';
import { fetchTABCLicenses } from './ingestion/tabc'; // New dedicated TABC connector
import { searchFranchiseTaxpayer } from './enrichment/comptroller';
import { geocodingService } from './geocoding/GeocodingService';
import { applyQualityFilters, evaluateHighQuality } from './qualityFilter';
import { classifyLandUse } from './normalization';
import { computeLeadScore } from '../utils/leadScoring';
import { deduplicatePermits, getDeduplicationStats } from './deduplication'; // Lead deduplication

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

/**
 * Map permit status to project stage for downstream filtering.
 */
function mapStageFromStatus(status: Permit['status']): Permit['stage'] {
  if (status === 'Issued') return 'PERMIT_ISSUED';
  if (status === 'Pending Inspection') return 'FINAL_INSPECTION';
  return 'PERMIT_APPLIED';
}

/**
 * Link creative signals to existing permits by address/geometry.
 * Per 02_creative_signals_pipeline.md: boost lead_score on matched leads,
 * create new leads only when signals are strong.
 */
function linkSignalsToLeads(leads: EnrichedPermit[], signals: Permit[]): EnrichedPermit[] {
  // Normalize addresses for matching (simple string comparison; could be improved with geocoding)
  const normalizeAddress = (addr: string): string => addr.toLowerCase().trim();
  
  const leadsByAddress = new Map<string, EnrichedPermit[]>();
  for (const lead of leads) {
    const key = normalizeAddress(lead.address);
    if (!leadsByAddress.has(key)) {
      leadsByAddress.set(key, []);
    }
    leadsByAddress.get(key)!.push(lead);
  }

  // For each signal, try to link to an existing lead
  for (const signal of signals) {
    const key = normalizeAddress(signal.address);
    const matchedLeads = leadsByAddress.get(key);

    if (matchedLeads && matchedLeads.length > 0) {
      // Boost lead_score on matched leads (secondary signals; e.g., +10 points)
      for (const lead of matchedLeads) {
        if (lead.leadScore !== undefined) {
          lead.leadScore = Math.min(100, lead.leadScore + 10);
        }
      }
    }
    // Note: Create new leads only if signal is exceptionally strong
    // For now, we don't auto-create from weak signals.
  }

  return leads;
}

// ...existing code...

// -----------------------------------------------------------------------------

export const leadManager = {
  /**
   * Aggregates leads from all live API sources and merges with mock data.
   * Handles deduplication and normalization.
   * Integrates creative signals (utility, zoning, legal, licensing, incentives).
   */
  fetchAllLeads: async (): Promise<EnrichedPermit[]> => {
    console.log('LeadManager: Starting automated sourcing (Phase 2) with creative signals...');

    // Run standard permit fetches in parallel for performance
    const [dallas, fw, arlington, plano, irving] = await Promise.all([
      fetchDallasPermits(),
      fetchFortWorthPermits(),
      fetchArlingtonPermits(),
      fetchPlanoPermits(),
      fetchIrvingPermits()
    ]);

    console.log(`LeadManager: Fetched ${dallas.length} DAL, ${fw.length} FW, ${arlington.length} ARL, ${plano.length} PLA, ${irving.length} IRV.`);

    // Fetch creative signals in parallel (including new dedicated TABC connector)
    const [utility, zoning, legal, licensing, incentive, tabc] = await Promise.all([
      fetchUtilityConnections(),
      fetchZoningCases(),
      fetchLegalVacancySignals(),
      fetchLicensingSignals(),
      fetchIncentiveSignals(),
      fetchTABCLicenses() // Dedicated TABC connector with fixed query syntax
    ]);

    console.log(`LeadManager: Fetched creative signals: ${utility.length} utility, ${zoning.length} zoning, ${legal.length} legal, ${licensing.length} licensing, ${incentive.length} incentive, ${tabc.length} TABC.`);

    // Combine all standard permit sources (excluding signals initially)
    // Note: We keep MOCK_PERMITS for demonstration purposes
    const allPermits = [
      ...dallas,
      ...fw,
      ...arlington,
      ...plano,
      ...irving,
      ...MOCK_PERMITS
    ];

    // Collect all creative signals (including TABC)
    const allSignals = [
      ...utility,
      ...zoning,
      ...legal,
      ...licensing,
      ...incentive,
      ...tabc
    ];

    // Deduplicate by ID
    const uniquePermitsMap = new Map<string, EnrichedPermit>();
    allPermits.forEach(permit => {
      if (!uniquePermitsMap.has(permit.id)) {
        uniquePermitsMap.set(permit.id, permit);
      }
    });

    // Convert back to array and enrich with stage/land use
    const sortedLeads = Array.from(uniquePermitsMap.values()).sort((a, b) => {
      return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    }).map(permit => ({
      ...permit,
      stage: mapStageFromStatus(permit.status),
      landUse: classifyLandUse(permit.permitType, permit.description)
    }));

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

    // Apply quality filters and compute lead scores
    const withQuality = sortedLeads.map(p => applyQualityFilters(p));
    const scored = withQuality.map(p => ({
      ...p,
      leadScore: computeLeadScore(p)
    }));

    // Link creative signals to leads and boost matching lead scores
    const withSignals = linkSignalsToLeads(scored, allSignals);

    // **NEW: Deduplicate leads before finalizing**
    // This identifies and merges duplicate permits from different sources
    // Multi-signal leads (permit + CO + zoning) get score boost
    const beforeDedup = withSignals.length;
    const deduped = deduplicatePermits(withSignals);
    const stats = getDeduplicationStats(withSignals, deduped);
    
    console.log(`[Deduplication] ${stats.duplicatesRemoved} duplicates removed (${stats.deduplicationRate.toFixed(1)}%)`);
    console.log(`[Deduplication] ${stats.multiSignalLeads} multi-signal leads created`);

    // Derive high-quality flags after scoring, signal boosts, and deduplication
    const finalized = deduped.map(p => evaluateHighQuality(p));

    return finalized;
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
