/**
 * Alert Queue Service
 * Matches new leads against user preferences and queues notifications
 */

import { 
  EnrichedPermit, 
  UserPreferences, 
  AlertQueueItem, 
  NotificationChannel,
  GeoFilter,
  ScoringThresholds 
} from '../../types';

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check if a lead matches geographic filters
 */
function matchesGeoFilter(lead: EnrichedPermit, filter?: GeoFilter): boolean {
  if (!filter) return true;
  
  // Check city filter
  if (filter.cities && filter.cities.length > 0) {
    if (!filter.cities.includes(lead.city)) {
      return false;
    }
  }
  
  // Check radius filter
  if (filter.radiusMiles && filter.centerLat && filter.centerLng) {
    const leadLat = (lead as any).latitude;
    const leadLng = (lead as any).longitude;
    
    if (leadLat && leadLng) {
      const distance = calculateDistance(
        filter.centerLat,
        filter.centerLng,
        leadLat,
        leadLng
      );
      
      if (distance > filter.radiusMiles) {
        return false;
      }
    }
  }
  
  // Check zip code exclusion
  if (filter.excludeZipCodes && filter.excludeZipCodes.length > 0) {
    const leadZip = lead.address.match(/\b\d{5}\b/)?.[0];
    if (leadZip && filter.excludeZipCodes.includes(leadZip)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a lead matches scoring thresholds
 */
function matchesScoringThresholds(
  lead: EnrichedPermit, 
  thresholds?: ScoringThresholds
): boolean {
  if (!thresholds) return true;
  
  // Check lead score
  if (thresholds.minLeadScore !== undefined && lead.leadScore !== undefined) {
    if (lead.leadScore < thresholds.minLeadScore) {
      return false;
    }
  }
  
  // Check valuation range
  if (thresholds.minValuation !== undefined && lead.valuation < thresholds.minValuation) {
    return false;
  }
  
  if (thresholds.maxValuation !== undefined && lead.valuation > thresholds.maxValuation) {
    return false;
  }
  
  // Check AI confidence score
  if (thresholds.minConfidenceScore !== undefined && lead.aiAnalysis) {
    if (lead.aiAnalysis.confidenceScore < thresholds.minConfidenceScore) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a lead matches user preferences
 */
export function matchesPreferences(
  lead: EnrichedPermit,
  preferences: UserPreferences
): boolean {
  if (!preferences.enabled) return false;
  
  // Check geographic filters
  if (!matchesGeoFilter(lead, preferences.geoFilters)) {
    return false;
  }
  
  // Check scoring thresholds
  if (!matchesScoringThresholds(lead, preferences.scoringThresholds)) {
    return false;
  }
  
  // Check category filters
  if (preferences.categories && preferences.categories.length > 0 && lead.aiAnalysis) {
    if (!preferences.categories.includes(lead.aiAnalysis.category)) {
      return false;
    }
  }
  
  // Check permit type filters
  if (preferences.permitTypes && preferences.permitTypes.length > 0) {
    if (!preferences.permitTypes.includes(lead.permitType)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Queue an alert for a user
 */
export function createAlertQueueItem(
  userId: string,
  lead: EnrichedPermit,
  channels: NotificationChannel[]
): AlertQueueItem {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    leadId: lead.id,
    lead,
    channels,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

/**
 * Process new leads against all user preferences
 * Returns array of alert queue items to be sent
 */
export function processLeadsForAlerts(
  leads: EnrichedPermit[],
  allPreferences: UserPreferences[]
): AlertQueueItem[] {
  const alerts: AlertQueueItem[] = [];
  
  for (const lead of leads) {
    for (const prefs of allPreferences) {
      if (matchesPreferences(lead, prefs)) {
        alerts.push(
          createAlertQueueItem(prefs.userId, lead, prefs.notificationChannels)
        );
      }
    }
  }
  
  return alerts;
}

/**
 * Filter leads by user preferences (for display)
 */
export function filterLeadsByPreferences(
  leads: EnrichedPermit[],
  preferences: UserPreferences
): EnrichedPermit[] {
  return leads.filter(lead => matchesPreferences(lead, preferences));
}

/**
 * Get summary statistics for matched leads
 */
export interface AlertSummary {
  totalMatches: number;
  avgLeadScore: number;
  totalValuation: number;
  topCategories: Record<string, number>;
  cityCounts: Record<string, number>;
}

export function generateAlertSummary(leads: EnrichedPermit[]): AlertSummary {
  const summary: AlertSummary = {
    totalMatches: leads.length,
    avgLeadScore: 0,
    totalValuation: 0,
    topCategories: {},
    cityCounts: {}
  };
  
  if (leads.length === 0) return summary;
  
  let scoreSum = 0;
  let scoreCount = 0;
  
  for (const lead of leads) {
    // Lead score
    if (lead.leadScore !== undefined) {
      scoreSum += lead.leadScore;
      scoreCount++;
    }
    
    // Valuation
    summary.totalValuation += lead.valuation;
    
    // Categories
    if (lead.aiAnalysis) {
      const cat = lead.aiAnalysis.category;
      summary.topCategories[cat] = (summary.topCategories[cat] || 0) + 1;
    }
    
    // Cities
    summary.cityCounts[lead.city] = (summary.cityCounts[lead.city] || 0) + 1;
  }
  
  summary.avgLeadScore = scoreCount > 0 ? scoreSum / scoreCount : 0;
  
  return summary;
}
