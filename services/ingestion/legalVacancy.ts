/**
 * Legal Vacancy Signals Ingestion
 * Fetches eviction data and extracts commercial property addresses.
 * Per 02_creative_signals_pipeline.md: Use as secondary signals to boost related leads;
 * treat as primary only if commercial and addressable.
 */

import { Permit } from '../../types';

interface EvictionDocket {
  id: string;
  address: string;
  city: 'Dallas' | 'Fort Worth' | 'Plano' | 'Frisco' | 'Irving' | 'Arlington';
  filedDate: string;
  isCommercial: boolean;
  description: string;
}

/**
 * Parse CSV text into structured data
 */
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const records: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      records.push(record);
    }
  }
  
  return records;
}

/**
 * Determine if an address is likely commercial based on keywords
 */
function isLikelyCommercial(address: string): boolean {
  const commercialKeywords = [
    'suite', 'ste', 'unit', '#',
    'plaza', 'center', 'mall', 'building', 'bldg',
    'office', 'commercial', 'retail', 'shop',
    'restaurant', 'store', 'market'
  ];
  
  const lowerAddress = address.toLowerCase();
  return commercialKeywords.some(keyword => lowerAddress.includes(keyword));
}

/**
 * Map county to cities
 */
function getCitiesForCounty(county: string): Array<'Dallas' | 'Fort Worth' | 'Plano' | 'Frisco' | 'Irving' | 'Arlington'> {
  const normalized = county.toLowerCase();
  if (normalized.includes('dallas')) return ['Dallas', 'Irving'];
  if (normalized.includes('tarrant')) return ['Fort Worth', 'Arlington'];
  if (normalized.includes('collin')) return ['Plano', 'Frisco'];
  return ['Dallas']; // Default fallback
}

/**
 * Fetch legal vacancy signals from Eviction Lab CSV data
 * Data sources:
 * - Eviction Lab (evictionlab.org) - Weekly CSV exports for DFW metro
 * - Data covers Dallas, Tarrant, and Collin counties
 * 
 * Implementation: Direct CSV fetch from Eviction Lab's data repository
 * Note: Eviction Lab provides aggregated weekly data, not real-time court records
 */
export const fetchLegalVacancySignals = async (): Promise<Permit[]> => {
  const signals: Permit[] = [];
  
  try {
    // Eviction Lab CSV endpoint (example - adjust based on actual data structure)
    // Real endpoint may vary - Eviction Lab updates their data structure periodically
    // Alternative: Use local CSV cache updated via scheduled job
    
    const EVICTION_LAB_CSV_URL = 'https://evictionlab.org/uploads/texas_weekly.csv';
    
    console.log('[Legal Vacancy] Fetching Eviction Lab CSV data...');
    
    const response = await fetch(EVICTION_LAB_CSV_URL, {
      headers: {
        'Accept': 'text/csv'
      }
    }).catch((err) => {
      console.error('[Legal Vacancy] Fetch error:', err.message);
      return null;
    });
    
    if (!response || !response.ok) {
      console.warn(`[Legal Vacancy] Eviction Lab CSV unavailable (${response?.status || 'network error'})`);
      console.warn('[Legal Vacancy] Consider implementing local CSV cache updated via scheduled job');
      return [];
    }
    
    const csvText = await response.text();
    const records = parseCSV(csvText);
    
    console.log(`[Legal Vacancy] Retrieved ${records.length} eviction records`);
    
    // Filter and process eviction records
    const dockets: EvictionDocket[] = [];
    
    for (const record of records) {
      // Expected CSV columns (adjust based on actual Eviction Lab format):
      // - case_id, filing_date, address, city, county, case_type
      const address = record.address || record.property_address || '';
      const county = record.county || 'Dallas';
      const filingDate = record.filing_date || record.date || new Date().toISOString();
      
      // Skip if no address
      if (!address || address.length < 10) continue;
      
      // Determine if commercial based on address patterns
      const isCommercial = isLikelyCommercial(address);
      
      // Map county to cities
      const cities = getCitiesForCounty(county);
      
      // Create docket entry for each city in county (we'll pick the first city as primary)
      dockets.push({
        id: record.case_id || record.id || Math.random().toString(36),
        address: address,
        city: cities[0], // Use first city as primary
        filedDate: filingDate,
        isCommercial: isCommercial,
        description: `Eviction filed in ${county} County`
      });
    }
    
    // Filter for commercial properties only (per pipeline requirements)
    const commercialDockets = dockets.filter(d => d.isCommercial);
    
    console.log(`[Legal Vacancy] Filtered to ${commercialDockets.length} commercial evictions (from ${dockets.length} total)`);
    
    // Convert to permit signals
    for (const docket of commercialDockets) {
      signals.push({
        id: `eviction_${docket.id}`,
        permitNumber: `EV_${docket.id}`,
        permitType: 'Eviction Notice',
        address: docket.address,
        city: docket.city,
        appliedDate: docket.filedDate,
        description: `Legal vacancy signal: Commercial eviction filed (potential space availability)`,
        applicant: 'Legal System',
        valuation: 0, // Evictions don't have valuations
        status: 'Under Review' as const,
        dataSource: 'Eviction Lab',
        stage: 'CONCEPT',
      });
    }
    
  } catch (error) {
    console.error('[Legal Vacancy] Error processing eviction data:', error);
  }
  
  // ===== ALTERNATIVE: North Texas Eviction Project (NTEP) =====
  // NTEP provides real-time dashboard but no public API
  // Consider scraping if Eviction Lab data is stale:
  // URL: https://childpovertyactionlab.org/north-texas-eviction-project/
  
  console.log(`[Legal Vacancy] Total signals: ${signals.length}`);
  return signals;
};
