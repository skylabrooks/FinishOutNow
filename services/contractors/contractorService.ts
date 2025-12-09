/**
 * Contractor Service
 * Manages contractor profiles with fuzzy name matching for deduplication
 */

import { ContractorProfile, ContractorPerformance, EnrichedPermit, LeadCategory } from '../../types';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Normalize contractor name for matching
 */
function normalizeContractorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find best matching contractor profile
 */
export function findMatchingContractor(
  name: string,
  profiles: ContractorProfile[],
  threshold: number = 0.8
): ContractorProfile | null {
  const normalizedName = normalizeContractorName(name);
  let bestMatch: ContractorProfile | null = null;
  let bestScore = 0;

  for (const profile of profiles) {
    // Check main name
    const mainScore = calculateSimilarity(normalizedName, normalizeContractorName(profile.name));
    
    // Check aliases
    let aliasScore = 0;
    for (const alias of profile.aliases) {
      const score = calculateSimilarity(normalizedName, normalizeContractorName(alias));
      aliasScore = Math.max(aliasScore, score);
    }

    const score = Math.max(mainScore, aliasScore);
    
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = profile;
    }
  }

  return bestMatch;
}

/**
 * Create a new contractor profile from a lead
 */
export function createContractorProfile(
  lead: EnrichedPermit,
  contractorName: string
): ContractorProfile {
  return {
    id: `contractor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: contractorName,
    aliases: [],
    projectCount: 1,
    totalValuation: lead.valuation,
    avgProjectSize: lead.valuation,
    categories: lead.aiAnalysis?.category ? [lead.aiAnalysis.category] : [],
    cities: [lead.city],
    qualityScore: lead.leadScore ?? 50,
    reliability: 50, // Default
    lastActive: lead.appliedDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Update contractor profile with new lead data
 */
export function updateContractorProfile(
  profile: ContractorProfile,
  lead: EnrichedPermit
): ContractorProfile {
  const updated = { ...profile };

  // Update counts and valuation
  updated.projectCount += 1;
  updated.totalValuation += lead.valuation;
  updated.avgProjectSize = updated.totalValuation / updated.projectCount;

  // Update categories
  if (lead.aiAnalysis?.category && !updated.categories.includes(lead.aiAnalysis.category)) {
    updated.categories.push(lead.aiAnalysis.category);
  }

  // Update cities
  if (!updated.cities.includes(lead.city)) {
    updated.cities.push(lead.city);
  }

  // Update quality score (weighted average)
  if (lead.leadScore !== undefined) {
    updated.qualityScore = (updated.qualityScore * (updated.projectCount - 1) + lead.leadScore) / updated.projectCount;
  }

  // Update last active
  if (new Date(lead.appliedDate) > new Date(updated.lastActive)) {
    updated.lastActive = lead.appliedDate;
  }

  updated.updatedAt = new Date().toISOString();

  return updated;
}

/**
 * Process leads to build/update contractor profiles
 */
export function processLeadsForContractors(
  leads: EnrichedPermit[],
  existingProfiles: ContractorProfile[] = []
): ContractorProfile[] {
  const profileMap = new Map(existingProfiles.map(p => [p.id, p]));

  for (const lead of leads) {
    // Try to extract contractor name from lead
    const contractorName = 
      lead.aiAnalysis?.extractedEntities?.generalContractor || 
      lead.applicant;

    if (!contractorName || contractorName.length < 3) continue;

    // Try to find matching existing profile
    const existing = findMatchingContractor(contractorName, Array.from(profileMap.values()));

    if (existing) {
      // Update existing profile
      const updated = updateContractorProfile(existing, lead);
      profileMap.set(updated.id, updated);
    } else {
      // Create new profile
      const newProfile = createContractorProfile(lead, contractorName);
      profileMap.set(newProfile.id, newProfile);
    }
  }

  return Array.from(profileMap.values());
}

/**
 * Calculate contractor performance metrics
 */
export function calculatePerformance(
  profile: ContractorProfile,
  allLeads: EnrichedPermit[]
): ContractorPerformance {
  const contractorLeads = allLeads.filter(lead => {
    const name = lead.aiAnalysis?.extractedEntities?.generalContractor || lead.applicant;
    return name && findMatchingContractor(name, [profile]) !== null;
  });

  let successfulProjects = 0;
  let failedProjects = 0;
  let totalDays = 0;
  let completedCount = 0;
  let totalValuation = 0;
  const categoryCounts: Record<string, number> = {};

  for (const lead of contractorLeads) {
    // Consider "Complete" stage as successful
    if (lead.stage === 'COMPLETE') {
      successfulProjects++;
      
      // Calculate duration if possible
      const appliedDate = new Date(lead.appliedDate);
      const now = new Date();
      const days = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += days;
      completedCount++;
    }

    totalValuation += lead.valuation;

    // Track categories
    if (lead.aiAnalysis?.category) {
      const cat = lead.aiAnalysis.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat as LeadCategory);

  return {
    contractorId: profile.id,
    successfulProjects,
    failedProjects,
    avgTimeToComplete: completedCount > 0 ? totalDays / completedCount : 0,
    avgValuation: contractorLeads.length > 0 ? totalValuation / contractorLeads.length : 0,
    topCategories
  };
}

/**
 * Rank contractors by quality score
 */
export function rankContractors(profiles: ContractorProfile[]): ContractorProfile[] {
  return [...profiles].sort((a, b) => {
    // Primary: quality score
    if (Math.abs(b.qualityScore - a.qualityScore) > 5) {
      return b.qualityScore - a.qualityScore;
    }
    
    // Secondary: project count
    if (Math.abs(b.projectCount - a.projectCount) > 5) {
      return b.projectCount - a.projectCount;
    }
    
    // Tertiary: reliability
    return b.reliability - a.reliability;
  });
}

/**
 * Filter contractors by criteria
 */
export function filterContractors(
  profiles: ContractorProfile[],
  options: {
    minQualityScore?: number;
    minProjects?: number;
    categories?: LeadCategory[];
    cities?: string[];
    activeSince?: Date;
  }
): ContractorProfile[] {
  return profiles.filter(profile => {
    if (options.minQualityScore !== undefined && profile.qualityScore < options.minQualityScore) {
      return false;
    }
    
    if (options.minProjects !== undefined && profile.projectCount < options.minProjects) {
      return false;
    }
    
    if (options.categories && options.categories.length > 0) {
      const hasCategory = options.categories.some(cat => profile.categories.includes(cat));
      if (!hasCategory) return false;
    }
    
    if (options.cities && options.cities.length > 0) {
      const hasCity = options.cities.some(city => profile.cities.includes(city));
      if (!hasCity) return false;
    }
    
    if (options.activeSince) {
      const lastActive = new Date(profile.lastActive);
      if (lastActive < options.activeSince) return false;
    }
    
    return true;
  });
}

/**
 * Merge duplicate contractor profiles
 */
export function mergeContractorProfiles(
  profile1: ContractorProfile,
  profile2: ContractorProfile
): ContractorProfile {
  return {
    id: profile1.id,
    name: profile1.name,
    aliases: [...new Set([...profile1.aliases, profile2.name, ...profile2.aliases])],
    projectCount: profile1.projectCount + profile2.projectCount,
    totalValuation: profile1.totalValuation + profile2.totalValuation,
    avgProjectSize: (profile1.totalValuation + profile2.totalValuation) / (profile1.projectCount + profile2.projectCount),
    categories: [...new Set([...profile1.categories, ...profile2.categories])],
    cities: [...new Set([...profile1.cities, ...profile2.cities])],
    qualityScore: (profile1.qualityScore + profile2.qualityScore) / 2,
    reliability: (profile1.reliability + profile2.reliability) / 2,
    lastActive: new Date(profile1.lastActive) > new Date(profile2.lastActive) ? profile1.lastActive : profile2.lastActive,
    createdAt: new Date(profile1.createdAt) < new Date(profile2.createdAt) ? profile1.createdAt : profile2.createdAt,
    updatedAt: new Date().toISOString()
  };
}
