/**
 * TABC (Texas Alcoholic Beverage Commission) Liquor License Connector
 * 
 * Data Source: Texas Open Data Portal
 * Dataset: naix-2893 (Active TABC Licenses)
 * Purpose: Identify new restaurant/bar establishments as early-stage commercial leads
 * 
 * Key Features:
 * - Filters for new/original applications (not renewals)
 * - Focuses on commercial license types (MB, BG)
 * - Creates "Ghost Leads" when no matching permit exists
 * - Provides 30-60 day advance notice before venue opens
 */

import { Permit } from '../../types';

interface TABCRawLicense {
  taxpayer_number?: string;
  taxpayer_name?: string;
  trade_name?: string;
  location_address?: string;
  location_city?: string;
  location_county?: string;
  location_state?: string;
  location_zip?: string;
  type_of_license?: string;
  obligation_end_date_yyyymmdd?: string;
  original_issue_date_yyyymmdd?: string;
  primary_e_texas_county?: string;
}

// Target cities in DFW metro
const DFW_CITIES = ['DALLAS', 'FORT WORTH', 'ARLINGTON', 'PLANO', 'IRVING', 'FRISCO', 'RICHARDSON', 'GARLAND', 'MCKINNEY'];

// Commercial license types we care about
const COMMERCIAL_LICENSE_KEYWORDS = [
  'MIXED BEVERAGE', // MB - Full liquor license (restaurants/bars)
  'BEER AND WINE',  // BG - Beer & wine (cafes/casual dining)
  'WINE AND BEER',
  'PRIVATE CLUB',   // Upscale establishments
  'PACKAGE STORE',  // Retail liquor stores (construction opportunity)
];

/**
 * Fetch active TABC liquor licenses for DFW metro area
 * Focuses on recent applications that indicate new commercial activity
 */
export const fetchTABCLicenses = async (): Promise<Permit[]> => {
  try {
    const TABC_ENDPOINT = 'https://data.texas.gov/resource/naix-2893.json';
    
    // Calculate date filter: licenses issued/expiring in the future (active)
    // obligation_end_date_yyyymmdd is numeric format YYYYMMDD (e.g., 20250601)
    const today = new Date();
    const todayNumeric = parseInt(
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')
    );
    
    // Build city filter: location_city IN ('DALLAS', 'FORT WORTH', ...)
    const cityFilter = DFW_CITIES.map(city => `location_city='${city}'`).join(' OR ');
    
    // CRITICAL FIX: Numeric date comparison without quotes
    // Original bug was: obligation_end_date_yyyymmdd > '20250101' (quoted number = 400 error)
    // Correct syntax: obligation_end_date_yyyymmdd > 20250101 (unquoted)
    const params = new URLSearchParams({
      '$limit': '500',
      '$where': `(${cityFilter}) AND obligation_end_date_yyyymmdd > ${todayNumeric}`,
      '$order': 'original_issue_date_yyyymmdd DESC',
      '$select': 'taxpayer_number,taxpayer_name,trade_name,location_address,location_city,location_county,location_state,location_zip,type_of_license,obligation_end_date_yyyymmdd,original_issue_date_yyyymmdd'
    });

    console.log(`[TABC] Fetching licenses with query: ${params.toString()}`);

    const response = await fetch(`${TABC_ENDPOINT}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        // Add App Token if available (optional but recommended for higher rate limits)
        ...(import.meta.env.VITE_TEXAS_APP_TOKEN && {
          'X-App-Token': import.meta.env.VITE_TEXAS_APP_TOKEN
        })
      }
    });

    if (!response.ok) {
      console.error(`[TABC] API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[TABC] Error details: ${errorText}`);
      return [];
    }

    const data: TABCRawLicense[] = await response.json();
    console.log(`[TABC] Retrieved ${data.length} total licenses`);

    // Filter for commercial license types only
    const commercialLicenses = data.filter(license => {
      const licenseType = (license.type_of_license || '').toUpperCase();
      return COMMERCIAL_LICENSE_KEYWORDS.some(keyword => licenseType.includes(keyword));
    });

    console.log(`[TABC] Filtered to ${commercialLicenses.length} commercial licenses`);

    // Map to standard Permit format
    const permits: Permit[] = commercialLicenses
      .filter(license => {
        // Ensure minimum required fields
        return license.location_address && 
               license.location_city && 
               license.location_address.length > 5;
      })
      .map(license => {
        // Construct full address
        const fullAddress = [
          license.location_address,
          license.location_city,
          license.location_state || 'TX',
          license.location_zip
        ].filter(Boolean).join(', ');

        // Parse date from YYYYMMDD numeric format
        const parseDateYYYYMMDD = (dateNum?: string): string => {
          if (!dateNum || dateNum.length !== 8) {
            return new Date().toISOString().split('T')[0];
          }
          const year = dateNum.substring(0, 4);
          const month = dateNum.substring(4, 6);
          const day = dateNum.substring(6, 8);
          return `${year}-${month}-${day}`;
        };

        // Normalize city name to match our City type
        const normalizeCity = (city?: string): Permit['city'] => {
          if (!city) return 'Dallas';
          const upper = city.toUpperCase();
          if (upper === 'DALLAS') return 'Dallas';
          if (upper === 'FORT WORTH') return 'Fort Worth';
          if (upper === 'ARLINGTON') return 'Arlington';
          if (upper === 'PLANO') return 'Plano';
          if (upper === 'IRVING') return 'Irving';
          // Default to Dallas for other DFW cities
          return 'Dallas';
        };

        return {
          id: `TABC-${license.taxpayer_number || Math.random().toString(36).substring(7)}`,
          permitNumber: license.taxpayer_number || 'TABC-UNKNOWN',
          permitType: 'Liquor License' as const,
          address: fullAddress,
          city: normalizeCity(license.location_city),
          appliedDate: parseDateYYYYMMDD(license.original_issue_date_yyyymmdd),
          description: `${license.type_of_license || 'Liquor License'} - ${license.trade_name || license.taxpayer_name || 'New Establishment'}`,
          applicant: license.taxpayer_name || license.trade_name || 'License Holder',
          valuation: 0, // Liquor licenses don't have construction valuation
          status: 'Issued' as const,
          dataSource: 'TABC',
          stage: 'PRE_OPENING', // Liquor license = venue opening soon
        };
      });

    console.log(`[TABC] Returning ${permits.length} valid permits`);
    return permits;

  } catch (error) {
    console.error('[TABC] Fetch error:', error);
    return [];
  }
};

/**
 * Advanced version: Detect "Ghost Leads" - TABC licenses without matching permits
 * This indicates under-the-radar construction activity
 * 
 * Usage: Call this AFTER fetching all permits to cross-reference addresses
 */
export const detectGhostLeads = async (existingPermits: Permit[]): Promise<Permit[]> => {
  const tabcLicenses = await fetchTABCLicenses();
  
  // Build address lookup map (normalized addresses)
  const normalizeAddress = (addr: string): string => {
    return addr
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|parkway|pkwy)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  };

  const permitAddresses = new Set(
    existingPermits.map(p => normalizeAddress(p.address))
  );

  // Find TABC licenses with no matching permit (Ghost Leads)
  const ghostLeads = tabcLicenses.filter(license => {
    const normalizedAddr = normalizeAddress(license.address);
    return !permitAddresses.has(normalizedAddr);
  });

  console.log(`[TABC Ghost Leads] Found ${ghostLeads.length} licenses without matching permits`);
  
  // Tag ghost leads for special handling
  return ghostLeads.map(lead => ({
    ...lead,
    description: `🔍 GHOST LEAD: ${lead.description} (No construction permit found - potential unlisted project)`,
    leadScore: 85, // High score - these are often exclusive finds
  }));
};
