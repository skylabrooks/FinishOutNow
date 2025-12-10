/**
 * Lead Deduplication & Merging Service
 * 
 * Purpose: Identify and merge duplicate leads from multiple data sources
 * Strategy:
 * - Address normalization (remove suite/unit, standardize abbreviations)
 * - Fuzzy string matching (Levenshtein distance)
 * - Geocoding-based proximity matching (within 50m = same property)
 * - Multi-signal lead consolidation (permit + CO + zoning = higher quality)
 */

import { Permit, EnrichedPermit } from '../types';

/**
 * Normalize address for fuzzy matching
 * Removes noise and standardizes format for comparison
 */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    // Remove suite/unit numbers
    .replace(/\b(suite|ste|unit|apt|#)\s*[\w\d-]+/gi, '')
    // Standardize street abbreviations
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bparkway\b/g, 'pkwy')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bcircle\b/g, 'cir')
    // Remove directions (N, S, E, W) that might vary
    .replace(/\b[nsew]\b\.?/gi, '')
    // Remove punctuation
    .replace(/[^\w\s]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns number of single-character edits needed to transform one string to another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two addresses (0-100%)
 */
export function addressSimilarity(addr1: string, addr2: string): number {
  const norm1 = normalizeAddress(addr1);
  const norm2 = normalizeAddress(addr2);
  
  // Exact match after normalization
  if (norm1 === norm2) return 100;
  
  // Calculate similarity based on Levenshtein distance
  const maxLen = Math.max(norm1.length, norm2.length);
  const distance = levenshteinDistance(norm1, norm2);
  const similarity = ((maxLen - distance) / maxLen) * 100;
  
  return Math.round(similarity);
}

/**
 * Check if two permits are at the same physical location using coordinates
 * Returns true if within 50 meters (typical property size threshold)
 */
export function isSameLocation(permit1: EnrichedPermit, permit2: EnrichedPermit): boolean {
  const p1 = permit1 as any;
  const p2 = permit2 as any;
  
  // Check if both have coordinates
  if (!p1.latitude || !p1.longitude || !p2.latitude || !p2.longitude) {
    return false;
  }

  // Haversine formula for distance between two lat/lng points
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (p1.latitude * Math.PI) / 180;
  const φ2 = (p2.latitude * Math.PI) / 180;
  const Δφ = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const Δλ = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters

  return distance <= 50; // Within 50 meters = same property
}

/**
 * Determine if two permits are duplicates
 * Uses both address matching and geocoding (if available)
 */
export function areDuplicates(permit1: EnrichedPermit, permit2: EnrichedPermit): boolean {
  // Don't compare a permit to itself
  if (permit1.id === permit2.id) return false;

  // Check if same city (basic filter)
  if (permit1.city !== permit2.city) return false;

  // Method 1: Geocoding-based (most accurate)
  if (isSameLocation(permit1, permit2)) {
    return true;
  }

  // Method 2: Address similarity (fallback if no coordinates)
  const similarity = addressSimilarity(permit1.address, permit2.address);
  
  // Threshold: 85% similarity = likely duplicate
  // Lower threshold for shorter addresses to avoid false positives
  const threshold = permit1.address.length < 20 ? 90 : 85;
  
  return similarity >= threshold;
}

/**
 * Merge two duplicate permits into a single lead
 * Strategy: Keep highest valuation, combine signals, preserve all sources
 */
export function mergePermits(primary: EnrichedPermit, secondary: EnrichedPermit): EnrichedPermit {
  // Keep permit with higher valuation as primary
  const higher = primary.valuation >= secondary.valuation ? primary : secondary;
  const lower = primary.valuation >= secondary.valuation ? secondary : primary;

  // Combine data sources
  const combinedSources = [
    higher.dataSource,
    lower.dataSource
  ].filter(Boolean).join(' + ');

  // Boost lead score for multi-signal leads
  const multiSignalBonus = 15; // +15 points for having multiple data sources
  const combinedScore = (higher.leadScore || 0) + multiSignalBonus;

  // Build combined description showing all signals
  const combinedDescription = `${higher.description} | MULTI-SIGNAL: Also found in ${lower.dataSource}`;

  return {
    ...higher,
    dataSource: combinedSources,
    description: combinedDescription,
    leadScore: Math.min(100, combinedScore),
    // Mark as multi-signal lead
    isHighQuality: true,
    // Store reference to merged permit
    ...(higher as any).mergedWith ? {} : { mergedWith: [lower.id] }
  };
}

/**
 * Deduplicate array of permits
 * Returns array with duplicates merged
 */
export function deduplicatePermits(permits: EnrichedPermit[]): EnrichedPermit[] {
  const processed = new Set<string>(); // Track processed IDs
  const result: EnrichedPermit[] = [];
  const duplicateGroups: Map<string, EnrichedPermit[]> = new Map();

  // First pass: identify duplicate groups
  for (let i = 0; i < permits.length; i++) {
    if (processed.has(permits[i].id)) continue;

    const duplicates: EnrichedPermit[] = [permits[i]];
    
    // Find all duplicates of this permit
    for (let j = i + 1; j < permits.length; j++) {
      if (processed.has(permits[j].id)) continue;
      
      if (areDuplicates(permits[i], permits[j])) {
        duplicates.push(permits[j]);
        processed.add(permits[j].id);
      }
    }

    // Store group
    if (duplicates.length > 1) {
      duplicateGroups.set(permits[i].id, duplicates);
      console.log(`[Dedup] Found ${duplicates.length} duplicates for ${permits[i].address}`);
    }
    
    processed.add(permits[i].id);
  }

  // Second pass: merge duplicates and build result
  processed.clear();
  
  for (const permit of permits) {
    if (processed.has(permit.id)) continue;

    const group = duplicateGroups.get(permit.id);
    
    if (group && group.length > 1) {
      // Merge all permits in group
      let merged = group[0];
      for (let i = 1; i < group.length; i++) {
        merged = mergePermits(merged, group[i]);
        processed.add(group[i].id);
      }
      result.push(merged);
      processed.add(permit.id);
    } else if (!processed.has(permit.id)) {
      // No duplicates, keep original
      result.push(permit);
      processed.add(permit.id);
    }
  }

  const dedupedCount = permits.length - result.length;
  console.log(`[Dedup] Removed ${dedupedCount} duplicates (${permits.length} → ${result.length})`);

  return result;
}

/**
 * Statistics about deduplication results
 */
export interface DeduplicationStats {
  originalCount: number;
  dedupedCount: number;
  duplicatesRemoved: number;
  multiSignalLeads: number;
  deduplicationRate: number; // Percentage of duplicates found
}

/**
 * Get statistics from deduplication process
 */
export function getDeduplicationStats(
  original: EnrichedPermit[],
  deduped: EnrichedPermit[]
): DeduplicationStats {
  const multiSignalLeads = deduped.filter(p => 
    p.dataSource?.includes('+') || (p as any).mergedWith
  ).length;

  return {
    originalCount: original.length,
    dedupedCount: deduped.length,
    duplicatesRemoved: original.length - deduped.length,
    multiSignalLeads,
    deduplicationRate: ((original.length - deduped.length) / original.length * 100) || 0
  };
}
