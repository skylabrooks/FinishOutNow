/**
 * Project Probability Service
 * ML-based predictions for project start dates and completion probability
 */

import { EnrichedPermit, ProjectProbability, ProjectStage } from '../../types';

/**
 * Calculate seasonality factor (0-1)
 * Construction activity peaks in spring/summer, dips in winter
 */
function calculateSeasonality(date: Date): number {
  const month = date.getMonth(); // 0-11
  
  // Peak season: April-September (0.8-1.0)
  // Shoulder: March, October (0.6-0.8)
  // Low season: November-February (0.4-0.6)
  
  const seasonalityMap: Record<number, number> = {
    0: 0.45,  // January
    1: 0.50,  // February
    2: 0.65,  // March
    3: 0.85,  // April
    4: 0.95,  // May
    5: 1.00,  // June
    6: 0.95,  // July
    7: 0.90,  // August
    8: 0.85,  // September
    9: 0.70,  // October
    10: 0.55, // November
    11: 0.45  // December
  };
  
  return seasonalityMap[month];
}

/**
 * Calculate historical pattern score based on permit data
 */
function calculateHistoricalPattern(lead: EnrichedPermit): number {
  let score = 0.5; // Base score
  
  // Stage advancement indicates higher probability
  const stageScores: Record<ProjectStage, number> = {
    'CONCEPT': 0.3,
    'PRE_PERMIT': 0.4,
    'PERMIT_APPLIED': 0.6,
    'PERMIT_ISSUED': 0.9,
    'UNDER_CONSTRUCTION': 1.0,
    'FINAL_INSPECTION': 0.95,
    'COMPLETE': 0.0, // Already complete
    'OCCUPANCY_PENDING': 0.85,
    'PRE_OPENING': 0.8
  };
  
  if (lead.stage) {
    score = stageScores[lead.stage];
  }
  
  // Status also matters
  if (lead.status === 'Issued') {
    score = Math.max(score, 0.75);
  } else if (lead.status === 'Under Review') {
    score = Math.min(score, 0.6);
  }
  
  return score;
}

/**
 * Calculate market conditions factor
 * Based on valuation and permit type
 */
function calculateMarketConditions(lead: EnrichedPermit): number {
  let score = 0.5;
  
  // Higher valuation projects have better funding/commitment
  if (lead.valuation > 500000) {
    score += 0.2;
  } else if (lead.valuation > 100000) {
    score += 0.1;
  } else if (lead.valuation < 10000) {
    score -= 0.1;
  }
  
  // Certain permit types are more likely to proceed
  const highProbabilityTypes = [
    'Certificate of Occupancy',
    'Utility Hookup',
    'Fire Alarm'
  ];
  
  if (highProbabilityTypes.includes(lead.permitType)) {
    score += 0.15;
  }
  
  // Commercial triggers from AI are positive
  if (lead.aiAnalysis?.isCommercialTrigger) {
    score += 0.1;
  }
  
  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Calculate contractor activity factor
 */
function calculateContractorActivity(lead: EnrichedPermit): number {
  let score = 0.5;
  
  // If we have contractor quality score
  if (lead.contractorQualityScore !== undefined) {
    score = lead.contractorQualityScore / 100;
  }
  
  // Known general contractor is positive
  if (lead.aiAnalysis?.extractedEntities?.generalContractor) {
    score = Math.max(score, 0.6);
  }
  
  // Valid applicant information
  if (lead.applicant && lead.applicant.length > 3) {
    score = Math.max(score, 0.55);
  }
  
  return score;
}

/**
 * Estimate project start date based on stage and patterns
 */
function estimateStartDate(lead: EnrichedPermit, appliedDate: Date): string | undefined {
  if (lead.stage === 'UNDER_CONSTRUCTION' || lead.stage === 'COMPLETE') {
    // Already started or completed
    return undefined;
  }
  
  // Calculate days until estimated start
  let daysUntilStart = 60; // Default 2 months
  
  const stageDays: Partial<Record<ProjectStage, number>> = {
    'CONCEPT': 180,          // 6 months
    'PRE_PERMIT': 120,       // 4 months
    'PERMIT_APPLIED': 60,    // 2 months
    'PERMIT_ISSUED': 30,     // 1 month
    'OCCUPANCY_PENDING': 15, // 2 weeks
    'PRE_OPENING': 7         // 1 week
  };
  
  if (lead.stage && stageDays[lead.stage]) {
    daysUntilStart = stageDays[lead.stage]!;
  }
  
  const estimatedDate = new Date(appliedDate);
  estimatedDate.setDate(estimatedDate.getDate() + daysUntilStart);
  
  return estimatedDate.toISOString();
}

/**
 * Estimate project duration in days
 */
function estimateDuration(lead: EnrichedPermit): number {
  let baseDays = 90; // 3 months default
  
  // Scale by valuation
  if (lead.valuation > 1000000) {
    baseDays = 180; // 6 months
  } else if (lead.valuation > 500000) {
    baseDays = 150; // 5 months
  } else if (lead.valuation > 100000) {
    baseDays = 120; // 4 months
  } else if (lead.valuation < 25000) {
    baseDays = 45; // 1.5 months
  }
  
  // Adjust by project type
  if (lead.aiAnalysis?.projectType === 'New Construction') {
    baseDays *= 1.5;
  } else if (lead.aiAnalysis?.projectType === 'Maintenance/Repair') {
    baseDays *= 0.5;
  }
  
  return Math.round(baseDays);
}

/**
 * Calculate overall confidence in the prediction
 */
function calculateConfidence(
  historicalPattern: number,
  seasonality: number,
  marketConditions: number,
  contractorActivity: number
): number {
  // Weight the factors
  const weights = {
    historical: 0.4,
    seasonality: 0.15,
    market: 0.25,
    contractor: 0.2
  };
  
  const weightedScore = 
    historicalPattern * weights.historical +
    seasonality * weights.seasonality +
    marketConditions * weights.market +
    contractorActivity * weights.contractor;
  
  // Convert to confidence score (0-100)
  return Math.round(weightedScore * 100);
}

/**
 * Predict project probability and timeline for a lead
 */
export function predictProjectProbability(lead: EnrichedPermit): ProjectProbability {
  const appliedDate = new Date(lead.appliedDate);
  const now = new Date();
  
  // Calculate individual factors
  const historicalPattern = calculateHistoricalPattern(lead);
  const seasonality = calculateSeasonality(now);
  const marketConditions = calculateMarketConditions(lead);
  const contractorActivity = calculateContractorActivity(lead);
  
  // Calculate overall probability score
  const probabilityScore = Math.round(
    (historicalPattern * 0.4 +
     seasonality * 0.15 +
     marketConditions * 0.25 +
     contractorActivity * 0.2) * 100
  );
  
  // Calculate confidence
  const confidence = calculateConfidence(
    historicalPattern,
    seasonality,
    marketConditions,
    contractorActivity
  );
  
  return {
    leadId: lead.id,
    probabilityScore,
    estimatedStartDate: estimateStartDate(lead, appliedDate),
    estimatedDuration: estimateDuration(lead),
    confidence,
    factors: {
      historicalPattern: Math.round(historicalPattern * 100),
      seasonality: Math.round(seasonality * 100),
      marketConditions: Math.round(marketConditions * 100),
      contractorActivity: Math.round(contractorActivity * 100)
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Batch predict for multiple leads
 */
export function batchPredictProbability(leads: EnrichedPermit[]): Map<string, ProjectProbability> {
  const predictions = new Map<string, ProjectProbability>();
  
  for (const lead of leads) {
    const prediction = predictProjectProbability(lead);
    predictions.set(lead.id, prediction);
  }
  
  return predictions;
}

/**
 * Filter leads by probability threshold
 */
export function filterByProbability(
  leads: EnrichedPermit[],
  minProbability: number = 60
): EnrichedPermit[] {
  return leads.filter(lead => {
    if (!lead.prediction) {
      const prediction = predictProjectProbability(lead);
      return prediction.probabilityScore >= minProbability;
    }
    return lead.prediction.probabilityScore >= minProbability;
  });
}

/**
 * Get leads sorted by probability score
 */
export function sortByProbability(
  leads: EnrichedPermit[],
  descending: boolean = true
): EnrichedPermit[] {
  return [...leads].sort((a, b) => {
    const aScore = a.prediction?.probabilityScore ?? predictProjectProbability(a).probabilityScore;
    const bScore = b.prediction?.probabilityScore ?? predictProjectProbability(b).probabilityScore;
    
    return descending ? bScore - aScore : aScore - bScore;
  });
}
