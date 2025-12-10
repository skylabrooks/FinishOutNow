
import { Permit } from '../../types';

// Minimum valuation threshold per 01_data_sources_and_ingestion.md
const MIN_VALUATION = 50000;

// Use API proxy endpoint (resolves CORS issues)
const PROXY_ENDPOINT = '/api/permits-arlington';

interface ArlingtonProxyResponse {
  success: boolean;
  data?: any[];
  error?: string;
  cached?: boolean;
}

export const fetchArlingtonPermits = async (): Promise<Permit[]> => {
  try {
    // Try proxy first (production-ready)
    const response = await fetch(`${PROXY_ENDPOINT}?limit=20`).catch(() => null);

    if (response?.ok) {
      const proxyData: ArlingtonProxyResponse = await response.json();
      if (proxyData.success && proxyData.data && proxyData.data.length > 0) {
        console.log(`[Arlington] Fetched ${proxyData.data.length} permits via proxy`);
        
        return proxyData.data
          .map((feature: any) => {
            const attrs = feature.attributes || feature;
            const valuation = Number(attrs.VALUATION || attrs.valuation || attrs.EST_COST || 0);
            return {
              id: `ARL-${attrs.PERMIT_NO || attrs.OBJECTID || Math.random()}`,
              permitNumber: attrs.PERMIT_NO || attrs.PERMITNUMBER || 'N/A',
              permitType: (attrs.PERMIT_TYPE || '').includes('CO') ? 'Certificate of Occupancy' : 'Commercial Remodel',
              address: `${attrs.ADDRESS || attrs.LOCATION || 'Address Not Listed'}, ARLINGTON, TX`,
              city: 'Arlington' as const,
              appliedDate: attrs.ISSUE_DATE ? new Date(attrs.ISSUE_DATE).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              description: attrs.DESCRIPTION || attrs.WORK_DESC || attrs.PERMIT_TYPE || 'Commercial work',
              applicant: attrs.APPLICANT || attrs.CONTRACTOR || 'Unknown',
              valuation,
              status: 'Issued' as const,
              dataSource: 'Arlington Permits (Live)'
            } as Permit;
          })
          .filter(p => p.valuation >= MIN_VALUATION);
      }
    }

    // Fallback to mock data if proxy unavailable
    console.log('[Arlington] Proxy unavailable, using mock data');
    return [
      {
        id: 'ARL-2025-001',
        permitNumber: 'BP-24-00192',
        permitType: 'Commercial Remodel',
        address: '101 W ABRAM ST, ARLINGTON, TX',
        city: 'Arlington',
        appliedDate: new Date().toISOString().split('T')[0],
        description: 'Interior remodel for retail space. Demising wall demo and new electrical service.',
        applicant: 'Texas General Contractors',
        valuation: 150000,
        status: 'Under Review',
        dataSource: 'Arlington Permits (Mock)'
      }
    ];

  } catch (error) {
    console.warn('Failed to fetch Arlington permits:', error);
    return [];
  }
};