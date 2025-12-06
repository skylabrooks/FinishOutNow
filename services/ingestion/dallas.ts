
import { Permit } from '../../types';

interface DallasRawPermit {
  permit_type: string;
  permit_no: string;
  address: string;
  issue_date: string;
  valuation: string;
  applicant_name: string;
  work_description: string;
  status: string;
}

interface DallasProxyResponse {
  success: boolean;
  data?: DallasRawPermit[];
  error?: string;
  cached?: boolean;
}

// Use API proxy endpoint (resolves CORS issues)
// Falls back to direct API if proxy is unavailable
const PROXY_ENDPOINT = '/api/permits-dallas';
const DIRECT_ENDPOINT = 'https://www.dallasopendata.com/resource/e7gq-4sah.json';

export const fetchDallasPermits = async (): Promise<Permit[]> => {
  try {
    // Try proxy first (production-ready)
    let response = await fetch(`${PROXY_ENDPOINT}?limit=20`).catch(() => null);
    let data: DallasRawPermit[] = [];

    if (response?.ok) {
      const proxyData: DallasProxyResponse = await response.json();
      if (proxyData.success && proxyData.data) {
        data = proxyData.data;
        console.log(`[Dallas] Fetched ${data.length} permits via proxy (${proxyData.cached ? 'cached' : 'fresh'})`);
      }
    } else {
      // Fallback to direct API (development/bypass)
      console.warn('[Dallas] Proxy unavailable, trying direct API...');
      const params = new URLSearchParams({
        '$limit': '20',
        '$order': 'issue_date DESC'
      });

      response = await fetch(`${DIRECT_ENDPOINT}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Dallas API Error: ${response.statusText}`);
      }

      data = await response.json();
    }

    return data.map(record => ({
      id: `DAL-${record.permit_no || Math.random()}`,
      permitNumber: record.permit_no || 'N/A',
      permitType: (record.permit_type || '').includes('Occupancy') ? 'Certificate of Occupancy' : 'Commercial Remodel',
      address: (record.address || 'Address Not Listed').toUpperCase(),
      city: 'Dallas',
      appliedDate: record.issue_date ? record.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
      description: record.work_description || `Commercial work at ${record.address || 'location'}`,
      applicant: (record.applicant_name && record.applicant_name !== 'null' && record.applicant_name.trim()) ? record.applicant_name.trim() : 'Unknown Applicant',
      valuation: parseFloat(record.valuation) || 0,
      status: 'Issued',
      dataSource: 'Dallas Open Data'
    }));

  } catch (error) {
    console.warn('Failed to fetch Dallas permits:', error);
    return [];
  }
};