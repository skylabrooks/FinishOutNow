/**
 * Licensing & Occupancy Signals Ingestion
 * Fetches health, food service, liquor, and fire permits/licenses.
 * Per 02_creative_signals_pipeline.md:
 * - Health/Food: include new/pre-opening permits only
 * - Liquor: include new applications/issuances
 * - Fire: use alarm/occupancy to upgrade project stage
 */

import { Permit } from '../../types';

interface LicenseApplication {
  id: string;
  address: string;
  city: 'Dallas' | 'Fort Worth' | 'Plano' | 'Frisco' | 'Irving' | 'Arlington';
  licenseType: 'health' | 'food_service' | 'liquor' | 'fire_alarm';
  appliedDate: string;
  status: 'new' | 'renewal' | 'issued';
  description: string;
  businessName?: string;
}

/**
 * Fetch licensing & occupancy signals
 * Data sources:
 * - Liquor: Texas TABC Open Data (data.texas.gov) - statewide, filterable by city
 * - Health/Food: Dallas Food Inspections (dallasopendata.com)
 * - Fire Alarms: No public APIs - requires scraping or FOIA
 * 
 * Implementation: TABC liquor licenses + Dallas Food Inspections
 */
export const fetchLicensingSignals = async (): Promise<Permit[]> => {
  const signals: Permit[] = [];
  
  // ===== TABC LIQUOR LICENSES (Statewide) =====
  try {
    const TABC_ENDPOINT = 'https://data.texas.gov/resource/naix-2893.json';
    
    // Fetch liquor license applications/issuances for DFW cities
    // Filter for recent licenses (last 12 months) and active status
    const cities = ['DALLAS', 'FORT WORTH', 'ARLINGTON', 'PLANO', 'IRVING', 'FRISCO'];
    const cityFilter = cities.map(c => `city='${c}'`).join(' OR ');
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateFilter = oneYearAgo.toISOString().split('T')[0].replace(/-/g, '');
    
    const params = new URLSearchParams({
      '$limit': '200',
      '$where': `(${cityFilter}) AND obligation_end_date_yyyymmdd > '${dateFilter}'`,
      '$order': 'obligation_end_date_yyyymmdd DESC'
    });

    console.log('[Licensing Signals] Fetching TABC liquor licenses...');
    
    const response = await fetch(`${TABC_ENDPOINT}?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    }).catch((err) => {
      console.error('[Licensing Signals] TABC fetch error:', err.message);
      return null;
    });
    
    if (!response || !response.ok) {
      console.warn(`[Licensing Signals] TABC API returned ${response?.status || 'network error'} - skipping TABC`);
    } else {
      const data = await response.json();
      console.log(`[Licensing Signals] Retrieved ${data.length} TABC licenses`);
      
      const tabcApplications: LicenseApplication[] = data
        .filter((license: any) => {
          // Filter for commercial license types only (exclude private clubs, etc.)
          const licenseType = (license.type_of_license || '').toUpperCase();
          return (
            licenseType.includes('RESTAURANT') ||
            licenseType.includes('BAR') ||
            licenseType.includes('TAVERN') ||
            licenseType.includes('RETAILER') ||
            licenseType.includes('WINE') ||
            licenseType.includes('BEER') ||
            licenseType.includes('MIXED BEVERAGE')
          );
        })
        .map((license: any) => ({
          id: license.taxpayer_number || license.location_number || Math.random().toString(36),
          address: `${license.location_address || ''}, ${license.city || ''}, ${license.location_state || 'TX'} ${license.location_zip || ''}`.trim(),
          city: license.city as any,
          licenseType: 'liquor' as const,
          appliedDate: license.obligation_end_date_yyyymmdd || new Date().toISOString(),
          status: 'issued' as const,
          description: `${license.type_of_license || 'Liquor License'} - ${license.trade_name || license.taxpayer_name || 'Unknown Business'}`,
          businessName: license.trade_name || license.taxpayer_name
        }))
        .filter((app: LicenseApplication) => app.address.length > 10); // Ensure valid address
      
      console.log(`[Licensing Signals] Filtered to ${tabcApplications.length} commercial liquor licenses`);
      
      // Convert TABC licenses to permit signals
      for (const app of tabcApplications) {
        signals.push({
          id: `license_tabc_${app.id}`,
          permitNumber: `LIQUOR_${app.id}`,
          permitType: 'Liquor License',
          address: app.address,
          city: app.city,
          appliedDate: app.appliedDate,
          description: `Liquor license: ${app.description}`,
          applicant: app.businessName || 'License Applicant',
          valuation: 0,
          status: 'Issued' as const,
          dataSource: 'TABC',
          stage: 'PERMIT_ISSUED',
        });
      }
    }
  } catch (error) {
    console.error('[Licensing Signals] TABC error:', error);
  }

  // ===== DALLAS FOOD INSPECTIONS =====
  try {
    const DALLAS_FOOD_ENDPOINT = 'https://www.dallasopendata.com/resource/d57v-xk48.json';
    
    // Fetch recent food establishment inspections (last 6 months)
    // Focus on new establishments (first inspection or pre-opening)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateFilter = sixMonthsAgo.toISOString().split('T')[0];
    
    const params = new URLSearchParams({
      '$limit': '200',
      '$where': `inspection_date > '${dateFilter}'`,
      '$order': 'inspection_date DESC'
    });

    console.log('[Licensing Signals] Fetching Dallas food inspections...');
    
    const response = await fetch(`${DALLAS_FOOD_ENDPOINT}?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    }).catch((err) => {
      console.error('[Licensing Signals] Dallas Food fetch error:', err.message);
      return null;
    });
    
    if (!response || !response.ok) {
      console.warn(`[Licensing Signals] Dallas Food API returned ${response?.status || 'network error'} - skipping food inspections`);
    } else {
      const data = await response.json();
      console.log(`[Licensing Signals] Retrieved ${data.length} food inspections`);
      
      // Filter for new establishments only
      const newEstablishments = data
        .filter((inspection: any) => {
          const inspectionType = (inspection.inspection_type || '').toLowerCase();
          const purpose = (inspection.purpose_of_inspection || '').toLowerCase();
          return (
            inspectionType.includes('opening') ||
            inspectionType.includes('initial') ||
            purpose.includes('pre-opening') ||
            purpose.includes('new establishment') ||
            purpose.includes('initial inspection')
          );
        })
        .filter((inspection: any) => {
          // Ensure valid address
          return inspection.establishment_address && 
                 inspection.establishment_name &&
                 inspection.establishment_address.length > 10;
        });
      
      console.log(`[Licensing Signals] Filtered to ${newEstablishments.length} new food establishments`);
      
      // Convert to permit signals
      for (const inspection of newEstablishments) {
        signals.push({
          id: `food_dallas_${inspection.establishment_id || Math.random().toString(36)}`,
          permitNumber: `FOOD_${inspection.establishment_id || 'UNKNOWN'}`,
          permitType: 'Food Service Permit',
          address: `${inspection.establishment_address}, Dallas, TX ${inspection.establishment_zip || ''}`,
          city: 'Dallas',
          appliedDate: inspection.inspection_date || new Date().toISOString(),
          description: `New food establishment: ${inspection.establishment_name} (${inspection.inspection_type || 'Initial Inspection'})`,
          applicant: inspection.establishment_name || 'Food Service Applicant',
          valuation: 0,
          status: 'Issued' as const,
          dataSource: 'Dallas Food Inspections',
          stage: 'PRE_OPENING',
        });
      }
    }
  } catch (error) {
    console.error('[Licensing Signals] Dallas Food error:', error);
  }

  console.log(`[Licensing Signals] Total signals: ${signals.length} (TABC + Dallas Food)`);
  return signals;
};
