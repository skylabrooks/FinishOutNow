import { EnrichedPermit, GCSubRelationship } from '../types';
import { generateRecommendations } from '../network/relationshipGraph';
import { Logger } from '../logger';

// Dummy implementations for DB (to be replaced with real services)
async function getLead(leadId: string): Promise<EnrichedPermit | null> {
  throw new Error('getLead not implemented');
}
async function getRelationships(): Promise<GCSubRelationship[]> {
  throw new Error('getRelationships not implemented');
}

/**
 * Get subcontractor recommendations for a specific lead.
 */
export async function getLeadRecommendations(leadId: string) {
  Logger.info(`Getting recommendations for lead ${leadId}...`);

  // Get lead
  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error('Lead not found');
  }

  // Get relationships
  const relationships = await getRelationships();

  // Generate recommendations
  const recommendations = generateRecommendations(lead, relationships, 30);
  Logger.info(`  ✓ ${recommendations.length} recommendations`);

  // Return formatted response
  return {
    leadId,
    lead: {
      city: lead.city,
      permitType: lead.permitType,
      valuation: lead.valuation,
      category: lead.aiAnalysis?.category,
      generalContractor: lead.aiAnalysis?.extractedEntities?.generalContractor
    },
    recommendations: recommendations.map(rec => ({
      name: rec.subName,
      score: rec.relevanceScore,
      reason: rec.reason,
      pastProjects: rec.pastProjectsWithGC,
      categories: rec.categories
    }))
  };
}