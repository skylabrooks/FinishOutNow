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
    // Arlington ArcGIS endpoint is CORS-blocked from browser
    // This requires a server-side proxy like the Dallas/Fort Worth endpoints
    // For now, returning empty with informative log
    
    console.log('[Zoning Cases] Arlington ArcGIS requires server-side proxy (CORS blocked)');
    console.log('[Zoning Cases] To enable: Add /api/zoning-arlington proxy to api/dev-server.ts');
    
    // Return empty until server proxy is implemented
    return [];
    
  } catch (error) {
    console.error('[Zoning Cases] Error fetching signals:', error);
    return [];
  }
};
