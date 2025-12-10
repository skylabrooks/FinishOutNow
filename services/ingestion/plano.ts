
/**
 * Plano Building Permits Connector
 * 
 * DISCOVERY STATUS: Testing Tyler EnerGov API endpoints per technical analysis
 * Reference: Permit_API_Implementation/City of Plano's Tyler EnerGov Permitting System and API Architecture.md
 * 
 * Data Sources (in priority order):
 * 1. Tyler EnerGov REST API (/api/energov/v1/permits) - OAuth 2.0 required
 * 2. ESRI ArcGIS Feature Service (GIS portal) - Often publicly accessible
 * 3. Plano Open Data Portal (Socrata) - If available
 * 4. Mock data (development fallback)
 * 
 * Current Status: Discovery phase - testing public endpoints before OAuth setup
 */

import { Permit } from '../../types';
import { normalizeDate, normalizeStatus, normalizePermitType } from '../normalization';

// Minimum valuation threshold per 01_data_sources_and_ingestion.md
const MIN_VALUATION = 50000;

// Plano permit data sources to try (per EnerGov API Architecture doc)
const PLANO_ENDPOINTS = {
  // Tyler EnerGov REST API patterns (requires OAuth 2.0)
  energovPublic: 'https://aca.planogov.org/api/public/permits',
  energovV1: 'https://aca.planogov.org/EnerGovWebApi/api/energov/v1/permits',
  
  // ESRI ArcGIS Feature Service (often public, nightly sync)
  arcgisRoot: 'https://gis.plano.gov/arcgis/rest/services',
  arcgisPermits: 'https://gis.plano.gov/arcgis/rest/services/OpenData/BuildingPermits/FeatureServer/0/query',
  arcgisAltHost: 'https://services.arcgis.com/PlanoGIS/arcgis/rest/services/Permits/FeatureServer/0/query',
  
  // Socrata Open Data Portal
  socrataMain: 'https://data.planogov.org/resource/permits.json',
  socrataAlt: 'https://plano.data.socrata.com/resource/permits.json'
};

// Track discovery results for reporting
let discoveryResults: Array<{endpoint: string; success: boolean; errorType?: string}> = [];

/**
 * Fetch Plano permits - Discovery phase implementation
 * Per EnerGov architecture: Test public endpoints first, then request OAuth if needed
 */
export const fetchPlanoPermits = async (): Promise<Permit[]> => {
  console.log('[Plano] 🔍 Starting endpoint discovery...');
  discoveryResults = []; // Reset results
  
  // Priority 1: ArcGIS Feature Service (most likely to be publicly accessible)
  const arcgisResult = await tryArcGISEndpoint();
  if (arcgisResult.length > 0) {
    console.log(`[Plano] ✅ Successfully fetched ${arcgisResult.length} permits via ArcGIS Feature Service`);
    logDiscoveryResults();
    return arcgisResult;
  }

  // Priority 2: Tyler EnerGov Public API (may require OAuth)
  const energovResult = await tryEnergovEndpoint();
  if (energovResult.length > 0) {
    console.log(`[Plano] ✅ Successfully fetched ${energovResult.length} permits via EnerGov API`);
    logDiscoveryResults();
    return energovResult;
  }

  // Priority 3: Socrata Open Data Portal
  const socrataResult = await trySocrataEndpoint();
  if (socrataResult.length > 0) {
    console.log(`[Plano] ✅ Successfully fetched ${socrataResult.length} permits via Open Data Portal`);
    logDiscoveryResults();
    return socrataResult;
  }

  // All public endpoints failed - log results for human review
  console.warn('[Plano] ⚠️  All API endpoints failed. Review discovery results below:');
  logDiscoveryResults();
  console.warn('[Plano] 📋 ACTION REQUIRED: Human must contact Plano IT for API access.');
  console.warn('[Plano] 📄 See: Permit_API_Implementation/plano_discovery_results.md for details');
  
  // Fallback to mock data
  return getMockPlanoPermits();
};

/**
 * Log discovery results for human review
 */
function logDiscoveryResults() {
  if (discoveryResults.length === 0) return;
  
  console.log('\n📊 Plano API Discovery Results:');
  console.log('═'.repeat(60));
  discoveryResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const error = result.errorType ? ` (${result.errorType})` : '';
    console.log(`${status} ${result.endpoint}${error}`);
  });
  console.log('═'.repeat(60) + '\n');
}

/**
 * Try fetching from ArcGIS REST endpoint (ESRI Feature Service)
 * Per EnerGov docs: Often publicly accessible, nightly sync, optimized for spatial queries
 */
async function tryArcGISEndpoint(): Promise<Permit[]> {
  const endpointsToTry = [
    PLANO_ENDPOINTS.arcgisPermits,
    PLANO_ENDPOINTS.arcgisAltHost
  ];

  for (const baseUrl of endpointsToTry) {
    try {
      console.log(`[Plano ArcGIS] Testing: ${baseUrl.substring(0, 50)}...`);
      
      // Per EnerGov docs: Use OData filtering, pagination
      const params = new URLSearchParams({
        where: "1=1", // Get all records
        outFields: "*", // All fields
        returnGeometry: "false", // We'll geocode separately
        f: "json",
        resultRecordCount: "50", // Respect pagination (50-100 per docs)
        orderByFields: "ISSUE_DATE DESC" // Most recent first
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FinishOutNow/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          console.log(`[Plano ArcGIS] ✅ Found ${data.features.length} features`);
          console.log(`[Plano ArcGIS] Sample fields: ${Object.keys(data.features[0].attributes).slice(0, 10).join(', ')}`);
          
          discoveryResults.push({ endpoint: baseUrl, success: true });
          return parseArcGISPermits(data.features);
        } else {
          console.log(`[Plano ArcGIS] Response OK but no features found`);
          discoveryResults.push({ endpoint: baseUrl, success: false, errorType: 'empty_response' });
        }
      } else if (response.status === 401 || response.status === 403) {
        console.log(`[Plano ArcGIS] 🔒 Authentication required (${response.status})`);
        discoveryResults.push({ endpoint: baseUrl, success: false, errorType: 'auth_required' });
      } else if (response.status === 404) {
        console.log(`[Plano ArcGIS] ❌ Not found (404)`);
        discoveryResults.push({ endpoint: baseUrl, success: false, errorType: 'not_found' });
      } else {
        console.log(`[Plano ArcGIS] ⚠️  HTTP ${response.status}`);
        discoveryResults.push({ endpoint: baseUrl, success: false, errorType: `http_${response.status}` });
      }
    } catch (error: any) {
      const errorType = error.message?.includes('CORS') ? 'cors_error' : 'network_error';
      console.log(`[Plano ArcGIS] ❌ ${errorType}: ${error.message}`);
      discoveryResults.push({ endpoint: baseUrl, success: false, errorType });
    }
  }
  
  return [];
}

/**
 * Try fetching from Tyler EnerGov API
 * Per EnerGov docs: Requires OAuth 2.0 for most endpoints, but testing public paths first
 */
async function tryEnergovEndpoint(): Promise<Permit[]> {
  const endpointsToTry = [
    PLANO_ENDPOINTS.energovPublic,
    PLANO_ENDPOINTS.energovV1
  ];

  for (const baseUrl of endpointsToTry) {
    try {
      console.log(`[Plano EnerGov] Testing: ${baseUrl}`);
      
      const response = await fetch(baseUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FinishOutNow/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`[Plano EnerGov] ✅ Found ${data.length} permits (no auth required!)`);
          discoveryResults.push({ endpoint: baseUrl, success: true });
          return parseEnergovPermits(data);
        } else {
          console.log(`[Plano EnerGov] Response OK but empty data`);
          discoveryResults.push({ endpoint: baseUrl, success: false, errorType: 'empty_response' });
        }
      } else if (response.status === 401 || response.status === 403) {
        console.log(`[Plano EnerGov] 🔒 OAuth 2.0 required (${response.status}) - Expected per docs`);
        discoveryResults.push({ endpoint: baseUrl, success: false, errorType: 'oauth_required' });
      } else if (response.status === 404) {
        console.log(`[Plano EnerGov] ❌ Endpoint not found (404)`);
        discoveryResults.push({ endpoint: baseUrl, success: false, errorType: 'not_found' });
      } else {
        console.log(`[Plano EnerGov] ⚠️  HTTP ${response.status}`);
        discoveryResults.push({ endpoint: baseUrl, success: false, errorType: `http_${response.status}` });
      }
    } catch (error: any) {
      const errorType = error.message?.includes('CORS') ? 'cors_error' : 'network_error';
      console.log(`[Plano EnerGov] ❌ ${errorType}: ${error.message}`);
      discoveryResults.push({ endpoint: baseUrl, success: false, errorType });
    }
  }
  
  return [];
}

/**
 * Try fetching from Socrata Open Data portal
 */
async function trySocrataEndpoint(): Promise<Permit[]> {
  try {
    // Check if Plano has open data portal
    const possibleUrls = [
      'https://data.planogov.org/resource/permits.json',
      'https://plano.data.socrata.com/resource/permits.json'
    ];

    for (const url of possibleUrls) {
      const params = new URLSearchParams({
        '$limit': '50',
        '$order': 'issued_date DESC'
      });

      const response = await fetch(`${url}?${params.toString()}`).catch(() => null);
      
      if (response?.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return parseSocrataPermits(data);
        }
      }
    }
  } catch (error) {
    console.log('[Plano Socrata] Open data portal not found');
  }
  return [];
}

/**
 * Parse ArcGIS FeatureServer response
 */
function parseArcGISPermits(features: any[]): Permit[] {
  return features
    .map(feature => {
      const attrs = feature.attributes;
      const valuation = parseFloat(attrs.VALUATION || attrs.PROJECT_VALUE || '0');
      
      if (valuation < MIN_VALUATION) return null;

      return {
        id: `PLA-${attrs.PERMIT_NUMBER || attrs.OBJECTID}`,
        permitNumber: attrs.PERMIT_NUMBER || attrs.PERMIT_NO || 'N/A',
        permitType: normalizePermitType(attrs.PERMIT_TYPE || '', attrs.DESCRIPTION || ''),
        address: attrs.ADDRESS || attrs.SITE_ADDRESS || 'Address Not Listed',
        city: 'Plano' as const,
        appliedDate: normalizeDate(attrs.ISSUE_DATE || attrs.APPLIED_DATE),
        description: attrs.DESCRIPTION || attrs.WORK_DESCRIPTION || 'Commercial work',
        applicant: attrs.CONTRACTOR_NAME || attrs.APPLICANT || 'Unknown Applicant',
        valuation,
        status: 'Issued' as const,
        dataSource: 'Plano GIS'
      } as Permit;
    })
    .filter((p): p is Permit => p !== null);
}

/**
 * Parse Tyler Energov API response
 */
function parseEnergovPermits(data: any[]): Permit[] {
  return data
    .map(permit => {
      const valuation = parseFloat(permit.estimatedValue || permit.valuation || '0');
      
      if (valuation < MIN_VALUATION) return null;

      return {
        id: `PLA-${permit.permitNumber || permit.id}`,
        permitNumber: permit.permitNumber || 'N/A',
        permitType: normalizePermitType(permit.permitType || '', permit.description || ''),
        address: permit.address || 'Address Not Listed',
        city: 'Plano' as const,
        appliedDate: normalizeDate(permit.issuedDate || permit.appliedDate),
        description: permit.description || 'Commercial work',
        applicant: permit.contractorName || permit.applicant || 'Unknown Applicant',
        valuation,
        status: 'Issued' as const,
        dataSource: 'Plano Energov'
      } as Permit;
    })
    .filter((p): p is Permit => p !== null);
}

/**
 * Parse Socrata Open Data response
 */
function parseSocrataPermits(data: any[]): Permit[] {
  return data
    .map(record => {
      const valuation = parseFloat(record.valuation || record.project_value || '0');
      
      if (valuation < MIN_VALUATION) return null;

      return {
        id: `PLA-${record.permit_number || record.permit_no}`,
        permitNumber: record.permit_number || record.permit_no || 'N/A',
        permitType: normalizePermitType(record.permit_type || '', record.description || ''),
        address: record.address || record.site_address || 'Address Not Listed',
        city: 'Plano' as const,
        appliedDate: normalizeDate(record.issue_date || record.applied_date),
        description: record.description || record.work_description || 'Commercial work',
        applicant: record.contractor || record.applicant || 'Unknown Applicant',
        valuation,
        status: 'Issued' as const,
        dataSource: 'Plano Open Data'
      } as Permit;
    })
    .filter((p): p is Permit => p !== null);
}

/**
 * Fallback mock data (temporary until real API is discovered)
 * TODO: Human needs to provide correct Plano permit portal URL
 */
function getMockPlanoPermits(): Permit[] {
  const mockPlanoData = [
    {
      "PERMIT_NO": "BLD2025-0042",
      "ADDRESS": "5700 LEGACY DR",
      "TYPE": "Commercial Interior Finish Out",
      "VALUATION": 450000,
      "APPLICANT": "Highland Builders",
      "DATE": "2025-05-14",
      "DESC": "Interior office remodel for Toyota North America expansion. New partitions and breakroom."
    },
    {
      "PERMIT_NO": "BLD2025-0089",
      "ADDRESS": "6121 W PARK BLVD",
      "TYPE": "Commercial Alteration",
      "VALUATION": 85000,
      "APPLICANT": "Signs by Tomorrow",
      "DATE": "2025-05-13",
      "DESC": "Installation of new illuminated wall sign for 'The Shops at Willow Bend' new tenant."
    }
  ];

  return mockPlanoData
    .filter(record => record.VALUATION >= MIN_VALUATION)
    .map(record => ({
      id: `PLA-MOCK-${record.PERMIT_NO}`,
      permitNumber: record.PERMIT_NO,
      permitType: normalizePermitType(record.TYPE, record.DESC),
      address: record.ADDRESS,
      city: 'Plano' as const,
      appliedDate: normalizeDate(record.DATE),
      description: `[MOCK] ${record.DESC}`,
      applicant: record.APPLICANT,
      valuation: record.VALUATION,
      status: 'Issued' as const,
      dataSource: 'Plano Mock Data (awaiting real API)'
    }));
}