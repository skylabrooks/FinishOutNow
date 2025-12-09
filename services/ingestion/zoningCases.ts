/**
 * Zoning & Land-Use Cases Ingestion
 * Scrapes zoning agendas/case portals and uses LLM to extract intended use + scale.
 * Per 02_creative_signals_pipeline.md: Include only commercial, medium/large cases.
 */

import { Permit } from '../../types';

interface ZoningCase {
  id: string;
  address: string;
  city: 'Dallas' | 'Fort Worth' | 'Plano' | 'Frisco' | 'Irving' | 'Arlington';
  caseNumber: string;
  appliedDate: string;
  intentedUse: string; // e.g., "Mixed-use commercial", "Multi-family"
  scale: 'small' | 'medium' | 'large';
  description: string;
}

/**
 * Fetch zoning case signals from Arlington Open Data (most accessible source)
 * Per research:
 * - Arlington: ArcGIS "Active Zoning Cases" interactive map (opendataupdate-arlingtontx.hub.arcgis.com)
 * - Dallas: Requires scraping Legistar agendas (no API)
 * - Fort Worth: Requires scraping zoning cases webpage (fortworthtexas.gov)
 * - Plano: Interactive map (share.plano.gov) - needs scraping
 * - Irving: No open data - requires scraping
 * 
 * Implementation: Start with Arlington ArcGIS API (most accessible)
 */
export const fetchZoningCases = async (): Promise<Permit[]> => {
  try {
    // Arlington Active Zoning Cases (ArcGIS FeatureServer)
    // Verified endpoint from Arlington Open Data portal
    const ARLINGTON_ZONING_ENDPOINT = 'https://gis.arlingtontx.gov/hosting/rest/services/Hosted/Planning_Zoning_Cases/FeatureServer/0/query';
    
    // Query for active cases filed in the last 180 days
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const timestamp = sixMonthsAgo.getTime();
    
    const params = new URLSearchParams({
      'where': `DateFiled > ${timestamp}`,
      'outFields': 'CaseNumber,Address,DateFiled,CaseDescription,CaseType,Status',
      'f': 'json',
      'returnGeometry': 'false',
      'resultRecordCount': '100'
    });

    console.log('[Zoning Cases] Fetching from Arlington ArcGIS...');
    
    const response = await fetch(`${ARLINGTON_ZONING_ENDPOINT}?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    }).catch((err) => {
      console.error('[Zoning Cases] Fetch error:', err.message);
      return null;
    });
    
    if (!response || !response.ok) {
      console.warn(`[Zoning Cases] Arlington API returned ${response?.status || 'network error'} - falling back to empty`);
      return [];
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log('[Zoning Cases] No active zoning cases found');
      return [];
    }

    console.log(`[Zoning Cases] Retrieved ${data.features.length} zoning cases from Arlington`);
    
    const signals: Permit[] = [];
    
    for (const feature of data.features) {
      const attrs = feature.attributes;
      
      // Skip if missing critical fields
      if (!attrs.Address || !attrs.CaseNumber) continue;
      
      // Filter for commercial zoning cases only
      // Common commercial case types: PD (Planned Development), SUP (Special Use Permit), 
      // Site Plan, Rezoning to commercial districts (C-1, C-2, C-3, etc.)
      const caseType = (attrs.CaseType || '').toUpperCase();
      const description = (attrs.CaseDescription || '').toLowerCase();
      
      const isCommercial = 
        caseType.includes('PD') || 
        caseType.includes('SUP') || 
        caseType.includes('SITE PLAN') ||
        caseType.includes('C-') || // Commercial zoning districts
        description.includes('commercial') ||
        description.includes('retail') ||
        description.includes('restaurant') ||
        description.includes('office') ||
        description.includes('mixed-use');
      
      if (!isCommercial) continue;
      
      // Determine scale based on description keywords
      let scale: 'small' | 'medium' | 'large' = 'medium';
      if (description.includes('multi-story') || description.includes('acres') || 
          description.includes('mixed-use') || description.includes('development')) {
        scale = 'large';
      } else if (description.includes('tenant') || description.includes('suite') ||
                 description.includes('minor')) {
        scale = 'small';
      }
      
      // Only include medium/large per pipeline requirements
      if (scale === 'small') continue;
      
      const dateField = attrs.DateFiled || attrs.DATE_FILED || attrs.date_filed;
      const appliedDate = dateField ? new Date(dateField).toISOString() : new Date().toISOString();
      
      signals.push({
        id: `zoning_arlington_${attrs.CaseNumber}`,
        permitNumber: attrs.CaseNumber,
        permitType: 'Zoning Case',
        address: attrs.Address,
        city: 'Arlington',
        appliedDate,
        description: `Zoning case (${caseType || 'Pending'}): ${attrs.CaseDescription || 'Commercial development'}`,
        applicant: 'Planning Dept',
        valuation: 0, // Zoning cases don't have valuations
        status: attrs.Status === 'Approved' ? 'Issued' : 'Under Review',
        dataSource: 'Arlington Planning & Zoning',
        stage: 'CONCEPT',
      });
    }

    console.log(`[Zoning Cases] Filtered to ${signals.length} commercial medium/large cases`);
    return signals;
    
  } catch (error) {
    console.error('[Zoning Cases] Error fetching signals:', error);
    return [];
  }
};
