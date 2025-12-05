
import { Permit } from '../../types';

// Fort Worth Open Data Endpoint
// ID: qy5k-jz7m
const FW_API_ENDPOINT = 'https://data.fortworthtexas.gov/resource/qy5k-jz7m.json';

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

export const fetchFortWorthPermits = async (): Promise<Permit[]> => {
  try {
    // SoQL Query for Fort Worth
    const query = [
      '$where=(permit_type like \'%Commercial%\' OR permit_type like \'%Remodel%\') AND status != \'Withdrawn\'',
      '$order=status_date DESC',
      '$limit=20'
    ].join('&');

    const response = await fetch(`${FW_API_ENDPOINT}?${query}`);

    if (!response.ok) {
      throw new Error(`Fort Worth API Error: ${response.statusText}`);
    }

    const data: FWRawPermit[] = await response.json();

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
};