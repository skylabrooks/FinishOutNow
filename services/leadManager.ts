
import { Permit, EnrichedPermit } from '../types';
import { MOCK_PERMITS } from './mockData';
import { fetchDallasPermits } from './ingestion/dallas';
import { fetchFortWorthPermits } from './ingestion/fortWorth';
import { fetchArlingtonPermits } from './ingestion/arlington';
import { fetchPlanoPermits } from './ingestion/plano';
import { fetchIrvingPermits } from './ingestion/irving';
import { searchFranchiseTaxpayer } from './enrichment/comptroller';

// --- Geocoding helpers (client-side with localStorage cache) ------------------
const GEO_CACHE_KEY = 'finishoutnow_geocache_v1';

function readGeoCache(): Record<string, [number, number]> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    return JSON.parse(window.localStorage.getItem(GEO_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeGeoCache(cache: Record<string, [number, number]>) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(address + ' Dallas-Fort Worth, TX');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en-US' } });
    if (!res.ok) return null;
    const j = await res.json();
    if (!Array.isArray(j) || j.length === 0) return null;
    const lat = parseFloat(j[0].lat);
    const lon = parseFloat(j[0].lon);
    if (isNaN(lat) || isNaN(lon)) return null;
    return [lat, lon];
  } catch (e) {
    return null;
  }
}

async function geocodePermits(permits: EnrichedPermit[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const cache = readGeoCache();

  // Determine addresses to geocode (sequential to respect rate limits)
  const toFetch: string[] = [];
  for (const p of permits) {
    const anyP = p as any;
    // Skip if already has coordinates from ingestion
    if ((anyP.latitude !== undefined && anyP.longitude !== undefined) || (anyP.lat !== undefined && anyP.lng !== undefined)) continue;
    const key = p.address;
    if (!key) continue;
    if (!cache[key]) toFetch.push(key);
  }

  if (toFetch.length === 0) return;

  for (const addr of toFetch) {
    // polite throttle
    await new Promise(r => setTimeout(r, 900));
    try {
      const coords = await geocodeAddress(addr);
      if (coords) {
        cache[addr] = coords;
        writeGeoCache(cache);
      }
    } catch (e) {
      // continue
    }
  }

  // Apply cached coordinates back onto permits
  for (const p of permits) {
    const key = p.address;
    const anyP = p as any;
    const cached = cache[key];
    if (cached && !(anyP.latitude !== undefined && anyP.longitude !== undefined)) {
      anyP.latitude = cached[0];
      anyP.longitude = cached[1];
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
    try {
      await geocodePermits(sortedLeads);
    } catch (err) {
      console.warn('LeadManager: Geocoding step failed or was skipped', err);
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
