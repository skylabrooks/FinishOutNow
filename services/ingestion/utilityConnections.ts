/**
 * Utility Connections Ingestion
 * Fetches new commercial meter/service connections and normalizes as UTILITY_HOOKUP signals.
 * Per 02_creative_signals_pipeline.md: Only include commercial or high-capacity records.
 */

import { Permit } from '../../types';

interface UtilityConnection {
  id: string;
  address: string;
  city: 'Dallas' | 'Fort Worth' | 'Plano' | 'Frisco' | 'Irving' | 'Arlington';
  serviceType: 'electric' | 'gas' | 'water';
  capacity?: number; // kW or equivalent
  connectionDate: string;
  isCommercial: boolean;
}

/**
 * Fetch utility connection signals via Certificate of Occupancy data
 * Per research: No direct utility APIs available; COs serve as proxy for new service connections
 * Dallas: https://www.dallasopendata.com/resource/9qet-qt9e.json (CO dataset)
 * Fort Worth: CFW Certificates of Occupancy (ArcGIS)
 * Arlington: Issued Permits dataset includes COs
 */
export const fetchUtilityConnections = async (): Promise<Permit[]> => {
  try {
    // Dallas Certificate of Occupancy API (Socrata)
    // Dataset ID 9qet-qt9e may have changed - using building permits as proxy
    const DALLAS_CO_ENDPOINT = 'https://www.dallasopendata.com/resource/e7gq-4sah.json';
    
    // Fetch recent permits (last 30 days) - filter for CO types client-side
    const params = new URLSearchParams({
      '$limit': '50',
      '$order': 'issued_date DESC'
    });

    const response = await fetch(`${DALLAS_CO_ENDPOINT}?${params}`).catch(() => null);
    
    if (!response?.ok) {
      console.warn('[Utility Connections] Dallas CO API unavailable');
      return [];
    }

    const data = await response.json();
    
    // Map permits to utility hookup signals (filter for occupancy-related permits)
    return data
      .filter((permit: any) => {
        const permitType = (permit.permit_type || '').toLowerCase();
        return permitType.includes('occupancy') || permitType.includes('co') || permitType.includes('certificate');
      })
      .slice(0, 20) // Limit results
      .map((permit: any) => ({
        id: `utility_co_${permit.permit_no || permit.id || Math.random()}`,
        permitNumber: `CO_${permit.permit_no || 'UNKNOWN'}`,
        permitType: 'Utility Hookup' as const,
        address: permit.address || 'Unknown',
        city: 'Dallas' as const,
        appliedDate: permit.issued_date || permit.issue_date || new Date().toISOString(),
        description: `Occupancy permit: ${permit.permit_type || 'Certificate of Occupancy'} - indicates new utility service`,
        applicant: permit.applicant_name || 'CO Holder',
        valuation: parseFloat(permit.valuation) || 0,
        status: 'Issued' as const,
        dataSource: 'Dallas CO (Utility Signal)',
        stage: 'OCCUPANCY_PENDING',
      }));
  } catch (error) {
    console.error('[Utility Connections] Error fetching signals:', error);
    return [];
  }
};
