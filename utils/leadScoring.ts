/**
 * Lead Scoring Utility
 *
 * Scores permits 0-100 using valuation, AI confidence, recency, and enrichment validity.
 */
import { EnrichedPermit } from '../types';
import { RECENCY_THRESHOLD_DAYS } from '../services/qualityFilter';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const daysSince = (dateStr: string): number => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return RECENCY_THRESHOLD_DAYS * 2; // treat as stale
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Compute a composite lead score (0-100)
 * Enhanced with contractor quality and ML predictions
 */
export const computeLeadScore = (permit: EnrichedPermit): number => {
  const valuation: number = permit.valuation;
  const confidence: number = permit.aiAnalysis?.confidenceScore ?? 0;
  const appliedDate: string = permit.appliedDate;
  const enrichmentVerified: boolean = permit.enrichmentData?.verified === true;
  const contractorQuality: number = permit.contractorQualityScore ?? 0;
  const projectProbability: number = permit.prediction?.probabilityScore ?? 0;

  // Base scoring (total: 70 points)
  const valuationScore = clamp((valuation / 1000000) * 30, 0, 30); // up to $1M -> 30 pts
  const confidenceScore = clamp(confidence * 0.3, 0, 30); // 0-100 -> 0-30
  const recencyDays: number = daysSince(appliedDate);
  const recencyScore = clamp(((RECENCY_THRESHOLD_DAYS - recencyDays) / RECENCY_THRESHOLD_DAYS) * 10, 0, 10);
  
  // Enhanced scoring factors (total: 30 points)
  const enrichmentScore = enrichmentVerified ? 5 : 0;
  const contractorScore = clamp(contractorQuality * 0.15, 0, 15); // 0-100 -> 0-15
  const probabilityScore = clamp(projectProbability * 0.10, 0, 10); // 0-100 -> 0-10

  const raw: number = valuationScore + confidenceScore + recencyScore + enrichmentScore + contractorScore + probabilityScore;
  return Math.round(clamp(raw, 0, 100));
};

/**
 * Compute lead score with custom weights
 */
export const computeLeadScoreCustom = (
  permit: EnrichedPermit,
  weights: {
    valuation?: number;
    confidence?: number;
    recency?: number;
    enrichment?: number;
    contractor?: number;
    probability?: number;
  }
): number => {
  const defaultWeights = {
    valuation: 30,
    confidence: 30,
    recency: 10,
    enrichment: 5,
    contractor: 15,
    probability: 10
  };

  const w = { ...defaultWeights, ...weights };
  
  const valuation: number = permit.valuation;
  const confidence: number = permit.aiAnalysis?.confidenceScore ?? 0;
  const recencyDays: number = daysSince(permit.appliedDate);
  const enrichmentVerified: boolean = permit.enrichmentData?.verified === true;
  const contractorQuality: number = permit.contractorQualityScore ?? 0;
  const projectProbability: number = permit.prediction?.probabilityScore ?? 0;

  const valuationScore = clamp((valuation / 1000000) * w.valuation, 0, w.valuation);
  const confidenceScore = clamp(confidence * (w.confidence / 100), 0, w.confidence);
  const recencyScore = clamp(((RECENCY_THRESHOLD_DAYS - recencyDays) / RECENCY_THRESHOLD_DAYS) * w.recency, 0, w.recency);
  const enrichmentScore = enrichmentVerified ? w.enrichment : 0;
  const contractorScore = clamp(contractorQuality * (w.contractor / 100), 0, w.contractor);
  const probabilityScore = clamp(projectProbability * (w.probability / 100), 0, w.probability);

  const raw: number = valuationScore + confidenceScore + recencyScore + enrichmentScore + contractorScore + probabilityScore;
  return Math.round(clamp(raw, 0, 100));
};
