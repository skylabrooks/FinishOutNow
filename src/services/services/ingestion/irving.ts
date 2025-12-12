
import { Permit } from '../../types';
import { normalizeDate, normalizeStatus, normalizePermitType } from '../normalization';

// Minimum valuation threshold per 01_data_sources_and_ingestion.md
const MIN_VALUATION = 50000;

// Use API proxy endpoint (resolves CORS issues)
const PROXY_ENDPOINT = '/api/permits-irving';

interface IrvingProxyResponse {
  success: boolean;
  data?: any[];
  error?: string;
  cached?: boolean;
}

export const fetchIrvingPermits = async (): Promise<Permit[]> => {
  try {
    // Try proxy first (production-ready)
    const response = await fetch(`${PROXY_ENDPOINT}?limit=20`).catch(() => null);

    if (response?.ok) {
      const proxyData: IrvingProxyResponse = await response.json();
      if (proxyData.success && proxyData.data && proxyData.data.length > 0) {
        console.log(`[Irving] Fetched ${proxyData.data.length} permits via proxy`);
        
        return proxyData.data
          .map((feature: any) => {
            const attrs = feature.attributes || feature;
            const valuation = Number(attrs.VALUATION || attrs.valuation || 0);
            return {
              id: `IRV-${attrs.PERMITNUMBER || attrs.OBJECTID || Math.random()}`,
              permitNumber: attrs.PERMITNUMBER || String(attrs.OBJECTID) || 'N/A',
              permitType: normalizePermitType(attrs.PERMITTYPE, attrs.DESCRIPTION),
              address: attrs.ADDRESS || attrs.LOCATION || 'Address Not Listed',
              city: 'Irving' as const,
              appliedDate: normalizeDate(attrs.ISSUEDDATE || attrs.APPLIEDDATE),
              description: attrs.DESCRIPTION || attrs.PROJECTNAME || 'Commercial Project',
              applicant: attrs.APPLICANT || attrs.CONTRACTOR || 'Unknown',
              valuation,
              status: normalizeStatus(attrs.STATUS),
              dataSource: 'Irving Open Data (Live)'
            } as Permit;
          })
          .filter(p => p.valuation >= MIN_VALUATION);
      }
    }

    // Fallback to mock data if proxy unavailable
    console.log('[Irving] Proxy unavailable, using mock data');
    return [
      {
        id: 'IRV-24-9921',
        permitNumber: '24-9921',
        permitType: 'Commercial Remodel',
        address: '500 W LAS COLINAS BLVD',
        city: 'Irving',
        appliedDate: new Date().toISOString().split('T')[0],
        description: 'Remodel of Suite 200. New lighting and data cabling.',
        applicant: 'Las Colinas Construction',
        valuation: 225000,
        status: 'Issued',
        dataSource: 'Irving Open Data (Mock)'
      }
    ] as Permit[];

  } catch (error) {
    console.warn('Failed to fetch Irving permits:', error);
    return [];
  }
};