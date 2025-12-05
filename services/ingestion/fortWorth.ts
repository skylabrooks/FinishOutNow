
import { Permit } from '../../types';

interface FWRawPermit {
  record_id: string;
  permit_type: string;
  job_value: string;
  address: string;
  status_date: string;
  description: string;
  applicant_name: string;
  status: string;
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
const DIRECT_ENDPOINT = 'https://data.fortworthtexas.gov/resource/qy5k-jz7m.json';

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
      // Fallback to direct API (development/bypass)
      console.warn('[Fort Worth] Proxy unavailable, trying direct API...');
      const query = [
        '$where=(permit_type like \'%Commercial%\' OR permit_type like \'%Remodel%\') AND status != \'Withdrawn\'',
        '$order=status_date DESC',
        '$limit=20'
      ].join('&');

      response = await fetch(`${DIRECT_ENDPOINT}?${query}`);

      if (!response.ok) {
        throw new Error(`Fort Worth API Error: ${response.statusText}`);
      }

      data = await response.json();
    }

    return data.map(record => ({
      id: `FW-${record.record_id}`,
      permitNumber: record.record_id,
      permitType: record.permit_type.includes('CO') ? 'Certificate of Occupancy' : 'Commercial Remodel',
      address: record.address || 'Address Not Listed',
      city: 'Fort Worth',
      appliedDate: record.status_date ? record.status_date.split('T')[0] : new Date().toISOString().split('T')[0],
      description: record.description || record.permit_type,
      applicant: record.applicant_name || 'Unknown',
      valuation: parseFloat(record.job_value) || 0,
      status: record.status === 'Finaled' ? 'Issued' : 'Under Review',
      dataSource: 'Fort Worth Open Data'
    }));

  } catch (error) {
    console.warn('Failed to fetch Fort Worth permits:', error);
    return [];
  }