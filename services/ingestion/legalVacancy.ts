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
    // Eviction Lab no longer provides direct CSV downloads
    // Their data is now accessed through their interactive tools at evictionlab.org
    // Alternative approach: Use county court record APIs if available
    // For now, returning empty array with informative log
    
    console.log('[Legal Vacancy] Eviction Lab CSV no longer publicly available');
    console.log('[Legal Vacancy] Consider implementing: 1) County court record scraper, 2) Commercial eviction monitoring service');
    
    // Return empty - this signal source requires alternative implementation
    return [];
    
  } catch (error) {
    console.error('[Legal Vacancy] Error processing eviction data:', error);
    return [];
  }
};
