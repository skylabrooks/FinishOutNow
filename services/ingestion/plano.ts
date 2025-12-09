
import { Permit } from '../../types';
import { normalizeDate, normalizeStatus, normalizePermitType } from '../normalization';

// Minimum valuation threshold per 01_data_sources_and_ingestion.md
const MIN_VALUATION = 50000;
// @ts-ignore
import { read, utils } from 'xlsx';

// Plano provides weekly reports in Excel format.
// Real URL: https://www.plano.gov/Archive.aspx?AMID=56 (Needs scraping logic usually)
// For this demo, we simulate fetching a binary excel file or fallback to mock data if CORS blocks us.

export const fetchPlanoPermits = async (): Promise<Permit[]> => {
  try {
    // 1. Attempt to fetch a real file (often fails in browser due to CORS on government sites)
    // In a real production app, this would hit a backend proxy.
    // We will simulate a failure here to trigger the fallback, or "Vibe Code" the parsing logic
    // assuming we had the file.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // MOCK DATA for Phase 2 demonstration (Since we can't actually download the Excel file cross-origin)
    // However, I'm writing the parsing code below as if we had the file.
    
    const mockPlanoData = [
      {
        "PERMIT_NO": "BLD2025-0042",
        "ADDRESS": "5700 LEGACY DR",
        "TYPE": "Commercial Interior Finish Out",
        "VALUATION": 450000,
        "APPLICANT": "Highland Builders",
        "DATE": "2025-05-14",
        "DESC": "Interior office remodel for Toyota North America expansion. New partitions and breakroom."
      },
      {
        "PERMIT_NO": "BLD2025-0089",
        "ADDRESS": "6121 W PARK BLVD",
        "TYPE": "Commercial Alteration",
        "VALUATION": 85000,
        "APPLICANT": "Signs by Tomorrow",
        "DATE": "2025-05-13",
        "DESC": "Installation of new illuminated wall sign for 'The Shops at Willow Bend' new tenant."
      }
    ];

    // --- PSEUDO-IMPLEMENTATION OF EXCEL PARSING (for documentation/handoff) ---
    /* 
    const response = await fetch('https://proxy-server.com/plano-permits.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = read(arrayBuffer);
    const sheetName = workbook.SheetNames.find(n => n.includes('Commercial'));
    const rows = utils.sheet_to_json(workbook.Sheets[sheetName]);
    */
    // --------------------------------------------------------------------------

    // Filter by minimum valuation and map to internal format
    return mockPlanoData
      .filter(record => record.VALUATION >= MIN_VALUATION)
      .map(record => ({
      id: `PLA-${record.PERMIT_NO}`,
      permitNumber: record.PERMIT_NO,
      permitType: normalizePermitType(record.TYPE, record.DESC),
      address: record.ADDRESS,
      city: 'Plano',
      appliedDate: normalizeDate(record.DATE),
      description: record.DESC,
      applicant: record.APPLICANT,
      valuation: record.VALUATION,
      status: 'Issued',
      dataSource: 'Plano Permitting'
    }));

  } catch (error) {
    console.warn('Failed to fetch Plano permits:', error);
    return [];
  }
};