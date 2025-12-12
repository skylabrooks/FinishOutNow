/**
 * Quality Filter Service
 *
 * Implements rules from 04_lead_quality_filtering.md:
 * - Defaults: min declared value $10k, recency 30 days, min lead score 60
 * - Flags: geocoded, value_above_threshold, type_supported, land_use_supported,
 *   business_verified, within_region
 * - Derived: is_actionable = all flags true + stage allowed
 * - Derived: is_recent = appliedDate within stage window
 * - High-quality view: actionable + recent + leadScore ≥ threshold
 *
 * PRODUCTION CALIBRATION GUIDE:
 * ============================
 * As production data accumulates, use the following workflows to refine thresholds:
 *
 * 1. MIN_VALUATION_THRESHOLD ($10,000)
 *    - Analyze lead_quality_view for value distribution of won/lost deals
 *    - If too many low-value leads pass → increase threshold (e.g., $15k, $20k)
 *    - If too many high-value leads filtered out → decrease threshold
 *    - Consider city-specific thresholds (Dallas ≠ Plano) once data matures
 *
 * 2. RECENCY_THRESHOLD_DAYS (30 days default, stage-specific overrides)
 *    - PERMIT_ISSUED (60d): Time for contractor to mobilize; extend if cycle > 60d
 *    - UNDER_CONSTRUCTION (120d): Multi-month projects; adjust based on typical duration
 *    - FINAL_INSPECTION (60d): Approaching occupancy; shorten if lost deals > 60d old
 *    - OCCUPANCY_PENDING (45d): Final phase; balance between stale/actionable
 *    - PRE_PERMIT (30d): Early signals; shorten if false positives, extend if missing leads
 *    - Add new stages as creative signals mature (e.g., INCENTIVE_ANNOUNCED, ZONING_APPROVED)
 *
 * 3. MIN_LEAD_SCORE_HIGH_QUALITY (60 points)
 *    - Analyze score distribution in lead_high_quality_view
 *    - Correlate scores to conversion rate, contract value, time-to-close
 *    - Scoring tiers (recommended):
 *      * 80+: High-priority outreach (likely to convert, high value)
 *      * 60-79: Standard queue (good candidates)
 *      * 40-59: Secondary queue or manual review (consider excluding)
 *      * <40: Filter out entirely
 *
 * 4. DFW_POLYGON (Region boundaries)
 *    - Monitor for valid leads outside polygon → expand boundary
 *    - Monitor for invalid leads inside polygon → contract or reshape
 *    - When business expands (e.g., Austin, Houston) → add new polygon or city logic
 *    - Use geocoding fallback for edge cases (small towns, zip codes)
 *
 * 5. FEEDBACK LOOP (Weekly/Monthly)
 *    - Query lead_high_quality_view and correlate isHighQuality flag to outcomes
 *    - Identify patterns: which flags correlate to wins vs. losses
 *    - If certain land use types underperform → add to SUPPORTED_LAND_USE or adjust scoring
 *    - If certain project types overperform → boost SUPPORTED_PROJECT_TYPES priority
 *    - Run getQualityStats() to track pass rate trends
 *
 * 6. GEOGRAPHIC CALIBRATION
 *    - Run point-in-polygon tests (tests/unit/services/qualityFilter.test.ts)
 *    - Test boundary cities: Arlington, Irving, Frisco (often at polygon edges)
 *    - Add specific test cases for known lost leads outside polygon
 *    - Consider supporting sparse rural areas or satellite cities
 *
 * 7. NEXT STEPS (Post-Launch)
 *    - Enable logging in applyQualityFilters() to track flag rejections
 *    - Add A/B test: High-quality view (current) vs. Relaxed filters (exploratory)
 *    - Monitor deal age: if won deals average 45 days old, increase recency windows
 *    - Survey sales team: which filters are too strict? Which too loose?
 *    - Implement dynamic scoring based on city, contractor history, seasonal trends
 */

import { EnrichedPermit, LandUse, PermitType, ProjectStage } from '../types';

// Minimum declared value for a lead to be considered (doc: 04_lead_quality_filtering.md)
export const MIN_VALUATION_THRESHOLD = 10000;

// Recency threshold in days (doc default: 30)
export const RECENCY_THRESHOLD_DAYS = 30;

// Minimum lead score for high-quality candidates
export const MIN_LEAD_SCORE_HIGH_QUALITY = 60;

// Supported project types and land use categories
const SUPPORTED_PROJECT_TYPES: PermitType[] = [
  'Commercial Remodel',
  'Certificate of Occupancy',
  'New Construction',
  'Utility Hookup',
  'Zoning Case',
  'Fire Alarm'
];

const SUPPORTED_LAND_USE: LandUse[] = ['COMMERCIAL', 'MIXED'];

// Stage allowances and recency windows
const ALLOWED_STAGES: ProjectStage[] = [
  'PRE_PERMIT',
  'PERMIT_APPLIED',
  'PERMIT_ISSUED',
  'UNDER_CONSTRUCTION',
  'FINAL_INSPECTION',
  'OCCUPANCY_PENDING',
  'PRE_OPENING'
];

const STAGE_RECENCY_LIMITS: Partial<Record<ProjectStage, number>> = {
  PRE_PERMIT: 30,
  PERMIT_APPLIED: 30,
  PERMIT_ISSUED: 60,
  UNDER_CONSTRUCTION: 120,
  FINAL_INSPECTION: 60,
  OCCUPANCY_PENDING: 45,
  PRE_OPENING: 45
};

// DFW region polygon (rough outline) used for within-region checks
const DFW_POLYGON: [number, number][] = [
  [33.30, -97.90],
  [33.40, -97.20],
  [33.35, -96.60],
  [33.00, -96.30],
  [32.60, -96.30],
  [32.35, -96.60],
  [32.30, -97.20],
  [32.45, -97.80],
  [32.90, -98.00]
];

/**
 * Check if permit has valid geocoded coordinates
 */
export const hasValidCoordinates = (permit: EnrichedPermit): boolean => {
  const anyPermit = permit as any;
  const lat = anyPermit.latitude;
  const lng = anyPermit.longitude;
  
  if (lat === undefined || lng === undefined) return false;
  if (lat === 0 && lng === 0) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  
  return true;
};

/**
 * Ray-casting point-in-polygon to determine if coordinates fall within DFW polygon
 */
const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]): boolean => {
  // Treat lat as Y and lng as X for the ray-casting algorithm
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [pyLat, pyLng] = polygon[i];
    const [qyLat, qyLng] = polygon[j];

    const intersects = (pyLng > lng) !== (qyLng > lng) &&
      lat < ((qyLat - pyLat) * (lng - pyLng)) / (qyLng - pyLng) + pyLat;

    if (intersects) inside = !inside;
  }
  return inside;
};

/**
 * Check if coordinates are within DFW region polygon
 */
export const isInDFWRegion = (permit: EnrichedPermit): boolean => {
  const anyPermit = permit as any;
  const lat = anyPermit.latitude;
  const lng = anyPermit.longitude;
  
  if (!hasValidCoordinates(permit)) return false;
  
  return isPointInPolygon(lat, lng, DFW_POLYGON);
};

/**
 * Check if permit meets minimum valuation threshold
 */
export const meetsValuationThreshold = (permit: EnrichedPermit): boolean => {
  return permit.valuation >= MIN_VALUATION_THRESHOLD;
};

/**
 * Check if permit has valid applicant information
 */
export const hasValidApplicant = (permit: EnrichedPermit): boolean => {
  if (!permit.applicant || permit.applicant.trim().length < 3) return false;
  
  const normalized = permit.applicant.toLowerCase().trim();
  
  // Filter out common invalid values
  const invalidValues = [
    'unknown',
    'n/a',
    'na',
    'not available',
    'tbd',
    'none',
    'test',
    'null'
  ];
  
  return !invalidValues.includes(normalized);
};

/**
 * Check if permit has valid address information
 */
export const hasValidAddress = (permit: EnrichedPermit): boolean => {
  if (!permit.address || permit.address.trim().length < 5) return false;
  
  const normalized = permit.address.toLowerCase().trim();
  
  // Filter out common invalid values
  const invalidValues = [
    'address not listed',
    'not available',
    'n/a',
    'na',
    'unknown',
    'tbd',
    'none'
  ];
  
  return !invalidValues.includes(normalized);
};

/**
 * Check if permit is commercial (not residential)
 */
export const isCommercialLandUse = (permit: EnrichedPermit): boolean => {
  if (!permit.landUse) return false;
  
  return SUPPORTED_LAND_USE.includes(permit.landUse);
};

/**
 * Check if permit is recent (within threshold)
 */
export const isRecent = (permit: EnrichedPermit): boolean => {
  try {
    const appliedDate = new Date(permit.appliedDate);
    const now = new Date();
    const daysDiff = (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);

    const window = getRecencyWindow(permit.stage);
    return daysDiff <= window;
  } catch (error) {
    return false;
  }
};

/**
 * Check if permit has supported type
 */
export const hasSupportedType = (permit: EnrichedPermit): boolean => {
  return SUPPORTED_PROJECT_TYPES.includes(permit.permitType);
};
 
function getRecencyWindow(stage?: ProjectStage): number {
  if (stage && STAGE_RECENCY_LIMITS[stage]) {
    return STAGE_RECENCY_LIMITS[stage] as number;
  }
  return RECENCY_THRESHOLD_DAYS;
}

const isStageAllowed = (stage?: ProjectStage): boolean => {
  if (!stage) return true;
  return ALLOWED_STAGES.includes(stage);
};

const buildQualityFlags = (permit: EnrichedPermit) => {
  const geocoded = hasValidCoordinates(permit);
  const valueAboveThreshold = meetsValuationThreshold(permit);
  const typeSupported = hasSupportedType(permit);
  const landUseSupported = isCommercialLandUse(permit);
  const businessVerified = hasValidApplicant(permit);
  const withinRegion = isInDFWRegion(permit);
  const addressValid = hasValidAddress(permit);

  return {
    geocoded,
    valueAboveThreshold,
    typeSupported,
    landUseSupported,
    businessVerified,
    withinRegion,
    addressValid
  } as const;
};

/**
 * Apply all quality filters and determine if permit is actionable
 *
 * is_actionable = all flags true + stage allowed (doc: 04_lead_quality_filtering.md)
 * is_recent     = appliedDate within stage-specific window
 */
export const applyQualityFilters = (permit: EnrichedPermit): EnrichedPermit => {
  const flags = buildQualityFlags(permit);
  const stageAllowed = isStageAllowed(permit.stage);
  const recencyWindowDays = getRecencyWindow(permit.stage);

  const isActionable =
    flags.geocoded &&
    flags.valueAboveThreshold &&
    flags.typeSupported &&
    flags.landUseSupported &&
    flags.businessVerified &&
    flags.addressValid &&
    flags.withinRegion &&
    stageAllowed;

  const isRecentFlag = isRecent({ ...permit, stage: permit.stage } as EnrichedPermit);

  return {
    ...permit,
    ...flags,
    recencyWindowDays,
    isActionable,
    isRecent: isRecentFlag
  };
};

/**
 * Evaluate high-quality candidates after lead scoring is present.
 * high_quality_candidate = actionable + score >= threshold
 * is_high_quality view   = actionable + recent + score >= threshold
 */
export const evaluateHighQuality = (
  permit: EnrichedPermit,
  minLeadScore: number = MIN_LEAD_SCORE_HIGH_QUALITY
): EnrichedPermit => {
  const leadScore = permit.leadScore ?? 0;
  const highQualityCandidate = Boolean(permit.isActionable) && leadScore >= minLeadScore;
  const isHighQuality = highQualityCandidate && Boolean(permit.isRecent);

  return {
    ...permit,
    highQualityCandidate,
    isHighQuality
  };
};

/**
 * Filter array of permits to only high-quality actionable leads
 *
 * Mirrors: actionable + recent + score threshold
 */
export const filterHighQualityLeads = (permits: EnrichedPermit[]): EnrichedPermit[] => {
  return permits
    .map(p => evaluateHighQuality(p))
    .filter(p => p.isHighQuality);
};

/**
 * Get quality filter statistics for reporting
 */
export const getQualityStats = (permits: EnrichedPermit[]) => {
  const total = permits.length;
  const actionable = permits.filter(p => p.isActionable).length;
  const recent = permits.filter(p => p.isRecent).length;
  const highQuality = filterHighQualityLeads(permits).length;
  
  // Breakdown of filter failures
  const failedValuation = permits.filter(p => !meetsValuationThreshold(p)).length;
  const failedAddress = permits.filter(p => !hasValidAddress(p)).length;
  const failedApplicant = permits.filter(p => !hasValidApplicant(p)).length;
  const failedLandUse = permits.filter(p => !isCommercialLandUse(p)).length;
  const failedRegion = permits.filter(p => !isInDFWRegion(p)).length;
  const failedGeocode = permits.filter(p => !hasValidCoordinates(p)).length;
  const failedType = permits.filter(p => !hasSupportedType(p)).length;
  const belowScore = permits.filter(p => (p.leadScore ?? 0) < MIN_LEAD_SCORE_HIGH_QUALITY).length;
  
  return {
    total,
    actionable,
    recent,
    highQuality,
    passRate: total > 0 ? (highQuality / total * 100).toFixed(1) : '0.0',
    failures: {
      valuation: failedValuation,
      address: failedAddress,
      applicant: failedApplicant,
      landUse: failedLandUse,
      region: failedRegion,
      geocoded: failedGeocode,
      typeSupported: failedType,
      leadScore: belowScore
    }
  };
};
