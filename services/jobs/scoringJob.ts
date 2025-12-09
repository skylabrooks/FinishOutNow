/**
 * Scoring Job Service
 * Daily recomputation of lead scores with enhanced factors
 */

import { EnrichedPermit, ContractorProfile } from '../../types';
import { computeLeadScore } from '../../utils/leadScoring';
import { predictProjectProbability } from '../ml/projectProbability';
import { findMatchingContractor } from '../contractors/contractorService';

/**
 * Recompute scores for all leads
 */
export async function recomputeLeadScores(
  leads: EnrichedPermit[],
  contractorProfiles: ContractorProfile[]
): Promise<EnrichedPermit[]> {
  const updatedLeads: EnrichedPermit[] = [];

  for (const lead of leads) {
    const updated = { ...lead };

    // Update contractor quality score if applicable
    const contractorName = 
      lead.aiAnalysis?.extractedEntities?.generalContractor || 
      lead.applicant;

    if (contractorName) {
      const contractor = findMatchingContractor(contractorName, contractorProfiles);
      if (contractor) {
        updated.contractorId = contractor.id;
        updated.contractorQualityScore = contractor.qualityScore;
      }
    }

    // Update ML prediction
    updated.prediction = predictProjectProbability(updated);

    // Recompute lead score with new factors
    updated.leadScore = computeLeadScore(updated);

    updatedLeads.push(updated);
  }

  return updatedLeads;
}

/**
 * Get high-quality leads (score >= threshold)
 */
export function getHighQualityLeads(
  leads: EnrichedPermit[],
  scoreThreshold: number = 70
): EnrichedPermit[] {
  return leads
    .filter(lead => (lead.leadScore ?? 0) >= scoreThreshold)
    .sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0));
}

/**
 * Get leads that need attention (score dropped, probability decreased)
 */
export interface LeadAlert {
  lead: EnrichedPermit;
  alertType: 'score_drop' | 'probability_drop' | 'stale';
  oldValue?: number;
  newValue?: number;
  message: string;
}

export function detectLeadAlerts(
  oldLeads: EnrichedPermit[],
  newLeads: EnrichedPermit[]
): LeadAlert[] {
  const alerts: LeadAlert[] = [];
  const oldMap = new Map(oldLeads.map(l => [l.id, l]));

  for (const newLead of newLeads) {
    const oldLead = oldMap.get(newLead.id);
    if (!oldLead) continue;

    // Score drop alert
    const oldScore = oldLead.leadScore ?? 0;
    const newScore = newLead.leadScore ?? 0;
    if (oldScore - newScore >= 15) {
      alerts.push({
        lead: newLead,
        alertType: 'score_drop',
        oldValue: oldScore,
        newValue: newScore,
        message: `Lead score dropped from ${oldScore} to ${newScore}`
      });
    }

    // Probability drop alert
    const oldProb = oldLead.prediction?.probabilityScore ?? 0;
    const newProb = newLead.prediction?.probabilityScore ?? 0;
    if (oldProb - newProb >= 20) {
      alerts.push({
        lead: newLead,
        alertType: 'probability_drop',
        oldValue: oldProb,
        newValue: newProb,
        message: `Project probability dropped from ${oldProb}% to ${newProb}%`
      });
    }

    // Stale alert (old applied date)
    const daysSince = Math.floor(
      (Date.now() - new Date(newLead.appliedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 120 && newScore < 50) {
      alerts.push({
        lead: newLead,
        alertType: 'stale',
        message: `Lead is ${daysSince} days old with low score (${newScore})`
      });
    }
  }

  return alerts;
}

/**
 * Generate scoring report
 */
export interface ScoringReport {
  totalLeads: number;
  avgScore: number;
  highQualityCount: number;
  mediumQualityCount: number;
  lowQualityCount: number;
  scoreDistribution: Record<string, number>;
  topLeads: EnrichedPermit[];
  alerts: LeadAlert[];
  timestamp: string;
}

export function generateScoringReport(
  leads: EnrichedPermit[],
  oldLeads?: EnrichedPermit[]
): ScoringReport {
  let totalScore = 0;
  let scoreCount = 0;
  let highQualityCount = 0;
  let mediumQualityCount = 0;
  let lowQualityCount = 0;

  const scoreDistribution: Record<string, number> = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  for (const lead of leads) {
    const score = lead.leadScore ?? 0;
    
    totalScore += score;
    scoreCount++;

    if (score >= 70) {
      highQualityCount++;
    } else if (score >= 40) {
      mediumQualityCount++;
    } else {
      lowQualityCount++;
    }

    // Distribution
    if (score <= 20) scoreDistribution['0-20']++;
    else if (score <= 40) scoreDistribution['21-40']++;
    else if (score <= 60) scoreDistribution['41-60']++;
    else if (score <= 80) scoreDistribution['61-80']++;
    else scoreDistribution['81-100']++;
  }

  const topLeads = getHighQualityLeads(leads, 70).slice(0, 10);
  const alerts = oldLeads ? detectLeadAlerts(oldLeads, leads) : [];

  return {
    totalLeads: leads.length,
    avgScore: scoreCount > 0 ? totalScore / scoreCount : 0,
    highQualityCount,
    mediumQualityCount,
    lowQualityCount,
    scoreDistribution,
    topLeads,
    alerts,
    timestamp: new Date().toISOString()
  };
}

/**
 * Schedule scoring job (pseudo-code for job scheduling)
 */
export interface JobSchedule {
  jobId: string;
  jobType: 'scoring_recomputation';
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export function createScoringJobSchedule(): JobSchedule {
  return {
    jobId: `scoring_job_${Date.now()}`,
    jobType: 'scoring_recomputation',
    schedule: '0 2 * * *', // Daily at 2 AM
    enabled: true,
    nextRun: getNextRunTime('0 2 * * *')
  };
}

function getNextRunTime(cronExpression: string): string {
  // Simplified: just set to next 2 AM
  const now = new Date();
  const next = new Date(now);
  next.setHours(2, 0, 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next.toISOString();
}
