
import { Permit } from '../../types';

// Minimum valuation threshold per 01_data_sources_and_ingestion.md
const MIN_VALUATION = 50000;

interface FWRawPermit {
  attributes: {
    Unique_ID?: string;
    Permit_No?: string;
    Permit_Type?: string;
    Permit_SubType?: string;
    Full_Street_Address?: string;
    Zip_Code?: string;
    B1_WORK_DESC?: string;
    [key: string]: any;
  };
}

interface FWProxyResponse {
  success: boolean;
  data?: FWRawPermit[];
  error?: string;
  cached?: boolean;
}

// Use API proxy endpoint (resolves CORS issues)
// Falls back to direct API if proxy is unavailable
const PROXY_ENDPOINT = '/api/permits-fortworth';
const DIRECT_ENDPOINT = 'https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/CFW_Open_Data_Development_Permits_View/FeatureServer/0/query';

export const fetchFortWorthPermits = async (): Promise<Permit[]> => {
  try {
    // Try proxy first (production-ready)
    let response = await fetch(`${PROXY_ENDPOINT}?limit=20`).catch(() => null);
    let data: FWRawPermit[] = [];

    if (response?.ok) {
      const proxyData: FWProxyResponse = await response.json();
      if (proxyData.success && proxyData.data) {
        data = proxyData.data;
        console.log(`[Fort Worth] Fetched ${data.length} permits via proxy (${proxyData.cached ? 'cached' : 'fresh'})`);
      }
    } else {
      // Fallback to direct ArcGIS API (development/bypass)
      console.warn('[Fort Worth] Proxy unavailable, trying direct ArcGIS API...');
      const params = new URLSearchParams({
        'outFields': '*',
        'where': '1=1',
        'resultRecordCount': '20',
        'f': 'json'
      });

      response = await fetch(`${DIRECT_ENDPOINT}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Fort Worth API Error: ${response.statusText}`);
      }

      const geoJsonData = await response.json();
      data = geoJsonData.features || [];
    }

    // Map to internal format (Fort Worth sometimes omits valuation; keep only valued records >= MIN_VALUATION)
    return data
      .map(record => {
        const attrs = record.attributes || {};
        const valuation = Number(
          attrs.Valuation ?? attrs.valuation ?? attrs.BLDG_VALUATION ?? attrs.Bldg_Valuation ?? attrs.Est_Const_Cost ?? 0
        );
        return {
          id: `FW-${attrs.Unique_ID || Math.random()}`,
          permitNumber: attrs.Permit_No || 'N/A',
          permitType: (attrs.Permit_Type || '').toLowerCase().includes('co') ? 'Certificate of Occupancy' : 'Commercial Remodel',
          address: attrs.Full_Street_Address || 'Address Not Listed',
          city: 'Fort Worth',
          appliedDate: new Date().toISOString().split('T')[0],
          description: attrs.B1_WORK_DESC || attrs.Permit_Type || 'No description',
          applicant: 'Unknown',
          valuation,
          status: 'Under Review',
          dataSource: 'Fort Worth Open Data (ArcGIS)'
        } as Permit;
      })
      .filter(p => p.valuation >= MIN_VALUATION);

  } catch (error) {
    console.warn('Failed to fetch Fort Worth permits:', error);
    return [];
  }
};