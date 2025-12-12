/**
 * Relationship Graph Service
 * Tracks GC-to-subcontractor relationships from historical data
 */

import { 
  GCSubRelationship, 
  SubcontractorRecommendation, 
  EnrichedPermit, 
  LeadCategory,
  ContractorProfile 
} from '../../types';

/**
 * Build relationship graph from historical permit data
 */
export function buildRelationshipGraph(
  permits: EnrichedPermit[],
  gcProfiles: ContractorProfile[],
  subProfiles: ContractorProfile[]
): GCSubRelationship[] {
  const relationships = new Map<string, GCSubRelationship>();

  for (const permit of permits) {
    const gcName = permit.aiAnalysis?.extractedEntities?.generalContractor;
    if (!gcName) continue;

    // For now, we'll infer subcontractor relationships from the permit description
    // In a real system, this would come from detailed project records
    const subcontractors = extractSubcontractors(permit);

    for (const subName of subcontractors) {
      const key = `${gcName}::${subName}`;
      
      const existing = relationships.get(key);
      if (existing) {
        // Update existing relationship
        existing.projectCount += 1;
        if (permit.aiAnalysis?.category && !existing.categories.includes(permit.aiAnalysis.category)) {
          existing.categories.push(permit.aiAnalysis.category);
        }
        if (new Date(permit.appliedDate) > new Date(existing.lastWorkedTogether)) {
          existing.lastWorkedTogether = permit.appliedDate;
        }
        // Increase relationship strength
        existing.relationshipStrength = Math.min(100, existing.relationshipStrength + 5);
      } else {
        // Create new relationship
        relationships.set(key, {
          gcId: gcName,
          gcName: gcName,
          subId: subName,
          subName: subName,
          projectCount: 1,
          categories: permit.aiAnalysis?.category ? [permit.aiAnalysis.category] : [],
          lastWorkedTogether: permit.appliedDate,
          relationshipStrength: 50 // Initial strength
        });
      }
    }
  }

  return Array.from(relationships.values());
}

/**
 * Extract potential subcontractor mentions from permit description
 * This is a simplified version - real implementation would use NER or structured data
 */
function extractSubcontractors(permit: EnrichedPermit): string[] {
  const subcontractors: string[] = [];
  const description = permit.description.toLowerCase();

  // Common subcontractor keywords
  const patterns = [
    /electrical contractor[:\s]+([^,\.\n]+)/gi,
    /plumbing contractor[:\s]+([^,\.\n]+)/gi,
    /hvac contractor[:\s]+([^,\.\n]+)/gi,
    /security installer[:\s]+([^,\.\n]+)/gi,
    /low voltage[:\s]+([^,\.\n]+)/gi,
    /sign[age]* (?:by|from)[:\s]+([^,\.\n]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 3) {
        subcontractors.push(match[1].trim());
      }
    }
  }

  return subcontractors;
}

/**
 * Get all subcontractors who have worked with a GC
 */
export function getSubcontractorsForGC(
  gcName: string,
  relationships: GCSubRelationship[]
): GCSubRelationship[] {
  return relationships
    .filter(rel => rel.gcName === gcName)
    .sort((a, b) => b.relationshipStrength - a.relationshipStrength);
}

/**
 * Get all GCs a subcontractor has worked with
 */
export function getGCsForSubcontractor(
  subName: string,
  relationships: GCSubRelationship[]
): GCSubRelationship[] {
  return relationships
    .filter(rel => rel.subName === subName)
    .sort((a, b) => b.projectCount - a.projectCount);
}

/**
 * Find subcontractors by category
 */
export function findSubcontractorsByCategory(
  category: LeadCategory,
  relationships: GCSubRelationship[]
): string[] {
  const subSet = new Set<string>();
  
  for (const rel of relationships) {
    if (rel.categories.includes(category)) {
      subSet.add(rel.subName);
    }
  }
  
  return Array.from(subSet);
}

/**
 * Calculate relevance score for subcontractor recommendation
 */
function calculateRelevanceScore(
  lead: EnrichedPermit,
  relationship: GCSubRelationship
): number {
  let score = 0;

  // Category match (40 points)
  if (lead.aiAnalysis?.category && relationship.categories.includes(lead.aiAnalysis.category)) {
    score += 40;
  }

  // Relationship strength (30 points)
  score += (relationship.relationshipStrength / 100) * 30;

  // Project count (20 points)
  const projectScore = Math.min(20, relationship.projectCount * 2);
  score += projectScore;

  // Recency (10 points)
  const daysSinceLastWorked = Math.floor(
    (Date.now() - new Date(relationship.lastWorkedTogether).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyScore = Math.max(0, 10 - (daysSinceLastWorked / 365) * 10);
  score += recencyScore;

  return Math.round(Math.min(100, score));
}

/**
 * Generate subcontractor recommendations for a lead
 */
export function generateRecommendations(
  lead: EnrichedPermit,
  relationships: GCSubRelationship[],
  minScore: number = 30
): SubcontractorRecommendation[] {
  const gcName = lead.aiAnalysis?.extractedEntities?.generalContractor;
  if (!gcName) return [];

  // Get relationships for this GC
  const gcRelationships = getSubcontractorsForGC(gcName, relationships);

  // Generate recommendations
  const recommendations: SubcontractorRecommendation[] = [];

  for (const rel of gcRelationships) {
    const relevanceScore = calculateRelevanceScore(lead, rel);
    
    if (relevanceScore >= minScore) {
      recommendations.push({
        subId: rel.subId,
        subName: rel.subName,
        relevanceScore,
        reason: generateRecommendationReason(rel, lead),
        pastProjectsWithGC: rel.projectCount,
        categories: rel.categories
      });
    }
  }

  // Sort by relevance
  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate human-readable reason for recommendation
 */
function generateRecommendationReason(
  relationship: GCSubRelationship,
  lead: EnrichedPermit
): string {
  const reasons: string[] = [];

  if (lead.aiAnalysis?.category && relationship.categories.includes(lead.aiAnalysis.category)) {
    reasons.push(`Experienced in ${lead.aiAnalysis.category}`);
  }

  if (relationship.projectCount >= 5) {
    reasons.push(`${relationship.projectCount} past projects with this GC`);
  } else if (relationship.projectCount > 1) {
    reasons.push(`${relationship.projectCount} past projects together`);
  }

  if (relationship.relationshipStrength >= 80) {
    reasons.push('Strong working relationship');
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(relationship.lastWorkedTogether).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince < 180) {
    reasons.push('Recently active');
  }

  return reasons.join('. ') + '.';
}

/**
 * Get network statistics
 */
export interface NetworkStats {
  totalRelationships: number;
  uniqueGCs: number;
  uniqueSubs: number;
  avgProjectsPerRelationship: number;
  topGCs: Array<{ name: string; subCount: number }>;
  topSubs: Array<{ name: string; gcCount: number }>;
}

export function getNetworkStats(relationships: GCSubRelationship[]): NetworkStats {
  const gcSet = new Set<string>();
  const subSet = new Set<string>();
  let totalProjects = 0;

  const gcCounts = new Map<string, number>();
  const subCounts = new Map<string, number>();

  for (const rel of relationships) {
    gcSet.add(rel.gcName);
    subSet.add(rel.subName);
    totalProjects += rel.projectCount;

    gcCounts.set(rel.gcName, (gcCounts.get(rel.gcName) || 0) + 1);
    subCounts.set(rel.subName, (subCounts.get(rel.subName) || 0) + 1);
  }

  const topGCs = Array.from(gcCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, subCount: count }));

  const topSubs = Array.from(subCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, gcCount: count }));

  return {
    totalRelationships: relationships.length,
    uniqueGCs: gcSet.size,
    uniqueSubs: subSet.size,
    avgProjectsPerRelationship: relationships.length > 0 ? totalProjects / relationships.length : 0,
    topGCs,
    topSubs
  };
}

/**
 * Find similar GCs based on subcontractor network
 */
export function findSimilarGCs(
  gcName: string,
  relationships: GCSubRelationship[],
  topN: number = 5
): Array<{ gcName: string; similarity: number; sharedSubs: number }> {
  const targetSubs = new Set(
    getSubcontractorsForGC(gcName, relationships).map(rel => rel.subName)
  );

  const allGCs = new Set(relationships.map(rel => rel.gcName));
  allGCs.delete(gcName);

  const similarities: Array<{ gcName: string; similarity: number; sharedSubs: number }> = [];

  for (const otherGC of allGCs) {
    const otherSubs = new Set(
      getSubcontractorsForGC(otherGC, relationships).map(rel => rel.subName)
    );

    const intersection = new Set([...targetSubs].filter(x => otherSubs.has(x)));
    const union = new Set([...targetSubs, ...otherSubs]);

    const similarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0;

    if (similarity > 0) {
      similarities.push({
        gcName: otherGC,
        similarity: Math.round(similarity),
        sharedSubs: intersection.size
      });
    }
  }

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topN);
}
