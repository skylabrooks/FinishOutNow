
import { Permit } from '../../types';

// Dallas Open Data Endpoint (Building Permits)
// ID: e7gq-4sah
const DALLAS_API_ENDPOINT = 'https://www.dallasopendata.com/resource/e7gq-4sah.json';

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

export const fetchDallasPermits = async (): Promise<Permit[]> => {
  try {
    // Socrata (SoQL) Query
    // Filter for Commercial logic and valid dates
    const query = [
      '$where=(permit_type like \'%Commercial%\' OR permit_type = \'Certificate of Occupancy\') AND valuation > 1000',
      '$order=issue_date DESC',
      '$limit=20'
    ].join('&');

    const response = await fetch(`${DALLAS_API_ENDPOINT}?${query}`);
    
    if (!response.ok) {
      throw new Error(`Dallas API Error: ${response.statusText}`);
    }

    const data: DallasRawPermit[] = await response.json();

    return data.map(record => ({
      id: `DAL-${record.permit_no}`,
      permitNumber: record.permit_no,
      permitType: record.permit_type.includes('Occupancy') ? 'Certificate of Occupancy' : 'Commercial Remodel',
      address: record.address.toUpperCase(),
      city: 'Dallas',
      appliedDate: record.issue_date ? record.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
      description: record.work_description || `Commercial work at ${record.address}`,
      applicant: record.applicant_name || 'Unknown Applicant',
      valuation: parseFloat(record.valuation) || 0,
      status: 'Issued', // Socrata dataset usually contains issued permits
      dataSource: 'Dallas Open Data'
    }));

  } catch (error) {
    console.warn('Failed to fetch Dallas permits:', error);
    return []; // Fail gracefully
  }
};