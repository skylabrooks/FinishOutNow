import { Permit, PermitType, LandUse } from '../types';

/**
 * Normalizes a raw date string into ISO 8601 (YYYY-MM-DD).
 * Handles various inputs like 'MM/DD/YYYY', timestamp numbers, or ISO strings.
 */
export const normalizeDate = (rawDate: string | number | undefined): string => {
  if (!rawDate) return new Date().toISOString().split('T')[0];

  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0]; // Fallback to today
};

/**
 * Maps diverse city statuses to the internal 3-state system.
 */
export const normalizeStatus = (rawStatus: string): Permit['status'] => {
  const status = rawStatus.toLowerCase();
  
  if (status.includes('issue') || status.includes('final') || status.includes('permit') || status.includes('open')) {
    return 'Issued';
  }
  if (status.includes('review') || status.includes('applied') || status.includes('submit') || status.includes('payment')) {
    return 'Under Review';
  }
  if (status.includes('inspect')) {
    return 'Pending Inspection';
  }
  
  return 'Under Review'; // Default conservative estimate
};

/**
 * Maps raw permit types (often messy) to specific Commercial Triggers.
 */
export const normalizePermitType = (rawType: string, description: string = ''): PermitType => {
  const text = (rawType + ' ' + description).toLowerCase();

  if (text.includes('occupancy') || text.includes('co ') || text.includes('c.o.')) {
    return 'Certificate of Occupancy';
  }
  
  if (text.includes('new') && (text.includes('building') || text.includes('construction'))) {
    return 'New Construction';
  }

  // Default to Remodel for most commercial work that isn't new build or CO
  return 'Commercial Remodel';
};

/**
 * Ensures formatting for city names.
 */
export const normalizeCity = (city: string): Permit['city'] => {
  const c = city.trim().toLowerCase();
  if (c.includes('fort') || c.includes('fw') || c.includes('ft.') || c.includes('ft ')) return 'Fort Worth';
  if (c.includes('dallas')) return 'Dallas';
  if (c.includes('plano')) return 'Plano';
  if (c.includes('frisco')) return 'Frisco';
  if (c.includes('irving')) return 'Irving';
  if (c.includes('arlington')) return 'Arlington';
  
  // Return as-is if it's a valid DFW city, otherwise default to Dallas
  return city.trim() || 'Dallas';
};

/**
 * Classify land use based on permit type/description
 */
export const classifyLandUse = (permitType: string, description: string = ''): LandUse => {
  const text = `${permitType} ${description}`.toLowerCase();

  const commercialSignals = [
    'commercial', 'tenant', 'office', 'retail', 'restaurant', 'warehouse',
    'occupancy', 'finish out', 'build-out', 'shell', 'industrial', 'hotel', 'mall'
  ];

  const residentialSignals = [
    'single family', 'sfr', 'residential', 'apartment', 'duplex', 'townhome', 'condo',
    'multi-family', 'multifamily', 'mf-', 'sfh'
  ];

  const hasCommercial = commercialSignals.some(k => text.includes(k));
  const hasResidential = residentialSignals.some(k => text.includes(k));

  if (hasCommercial && hasResidential) return 'MIXED';
  if (hasCommercial) return 'COMMERCIAL';
  if (hasResidential) return 'RESIDENTIAL';

  return 'UNKNOWN';
};
