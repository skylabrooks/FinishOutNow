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
    const DALLAS_CO_ENDPOINT = 'https://www.dallasopendata.com/resource/9qet-qt9e.json';
    
    // Fetch recent COs (last 30 days) for commercial properties
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
    
    const params = new URLSearchParams({
      '$limit': '50',
      '$where': `issued_date > '${dateFilter}' AND (land_use = 'OFFICE' OR land_use = 'RETAIL' OR land_use = 'RESTAURANT')`,
      '$order': 'issued_date DESC'
    });

    const response = await fetch(`${DALLAS_CO_ENDPOINT}?${params}`).catch(() => null);
    
    if (!response?.ok) {
      console.warn('[Utility Connections] Dallas CO API unavailable');
      return [];
    }

    const data = await response.json();
    
    // Map COs to utility hookup signals
    return data
      .filter((co: any) => co.type_of_co === 'CO-New Building' || co.type_of_co === 'CO-Change of Tenant')
      .map((co: any) => ({
        id: `utility_co_${co.co_number || co.id}`,
        permitNumber: `CO_${co.co_number || co.id}`,
        permitType: 'Utility Hookup' as const,
        address: co.address || 'Unknown',
        city: 'Dallas' as const,
        appliedDate: co.issued_date || new Date().toISOString(),
        description: `New ${co.land_use || 'commercial'} occupancy: ${co.type_of_co} - indicates new utility service`,
        applicant: co.applicant_name || 'CO Holder',
        valuation: 0, // COs don't have valuations
        status: 'Issued' as const,
        dataSource: 'Dallas CO (Utility Signal)',
        stage: 'OCCUPANCY_PENDING',
      }));
  } catch (error) {
    console.error('[Utility Connections] Error fetching signals:', error);
    return [];
  }
};
