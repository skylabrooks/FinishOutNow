
import { Permit } from '../../types';

// Minimum valuation threshold per 01_data_sources_and_ingestion.md
const MIN_VALUATION = 50000;

// Arlington uses ArcGIS usually, which can be tricky with CORS.
// This is a simulated fetch that mimics the structure of an ArcGIS FeatureLayer query.
// In a production backend, this would use a proxy.

export const fetchArlingtonPermits = async (): Promise<Permit[]> => {
  try {
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate a successful "Live" response from Arlington
    // Real endpoint would be: https://maps.arlingtontx.gov/arcgis/rest/services/...
    const mockLiveResponse: Permit[] = [
      {
        id: 'ARL-2025-001',
        permitNumber: 'BP-24-00192',
        permitType: 'Commercial Remodel',
        address: '101 W ABRAM ST, ARLINGTON, TX',
        city: 'Arlington',
        appliedDate: new Date().toISOString().split('T')[0],
        description: 'LIVE FEED: Interior remodel for "Rangers Republic". Demising wall demo and new electrical service.',
        applicant: 'Texas General Contractors',
        valuation: 150000,
        status: 'Under Review',
        dataSource: 'Arlington Permits (Live)'
      },
      {
        id: 'ARL-2025-002',
        permitNumber: 'CO-24-00441',
        permitType: 'Certificate of Occupancy',
        address: '801 STADIUM DR, ARLINGTON, TX',
        city: 'Arlington',
        appliedDate: new Date().toISOString().split('T')[0],
        description: 'LIVE FEED: New occupancy for retail suite 100. Safety inspection required.',
        applicant: 'BuildGroup',
        valuation: 0,
        status: 'Pending Inspection',
        dataSource: 'Arlington Permits (Live)'
      }
    ];

    // Filter by minimum valuation
    return mockLiveResponse.filter(p => p.valuation >= MIN_VALUATION);

  } catch (error) {
    console.warn('Failed to fetch Arlington permits:', error);
    return [];
  }
};