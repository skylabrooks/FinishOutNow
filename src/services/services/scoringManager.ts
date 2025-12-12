// Scoring manager: applies quality filters and computes lead scores
import { Permit, EnrichedPermit } from '../../types';
import { applyQualityFilters, evaluateHighQuality } from './qualityFilter';
import { computeLeadScore } from '../../utils/utils/leadScoring';

export function applyFiltersAndScore(permits: Permit[]): EnrichedPermit[] {
  const enriched = permits.map(p => ({ ...p, leadScore: computeLeadScore(p) }));
  return applyQualityFilters(enriched);
}

export function isHighQuality(permit: EnrichedPermit): boolean {
  return evaluateHighQuality(permit);
}
