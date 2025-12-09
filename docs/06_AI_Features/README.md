# AI Features & Predictive Analytics

**Last Updated:** December 8, 2025  
**Status:** Production Ready

## Overview

FinishOutNow includes advanced AI-powered features for lead intelligence, geospatial analysis, contractor benchmarking, and predictive analytics. This document provides a comprehensive guide to all AI features.

---

## Table of Contents

1. [Predictive Alerts](#1-predictive-alerts)
2. [Geospatial Clustering & Heatmaps](#2-geospatial-clustering--heatmaps)
3. [Contractor Benchmarking](#3-contractor-benchmarking)
4. [Subcontractor Recommendations](#4-subcontractor-recommendations)
5. [ML-Based Project Probability](#5-ml-based-project-probability)
6. [API Reference](#6-api-reference)
7. [Integration Guide](#7-integration-guide)

---

## 1. Predictive Alerts

### Overview
Automatically match new leads against user preferences and send notifications through multiple channels.

### Features
- Geographic filtering (city, radius, zip code exclusion)
- Scoring thresholds (lead score, valuation range, confidence)
- Category and permit type filters
- Multi-channel notifications (email, SMS, push, in-app)

### Usage Example

```typescript
import { matchesPreferences, processLeadsForAlerts } from './services/alerts/alertQueue';
import { UserPreferences, EnrichedPermit } from './types';

// Define user preferences
const preferences: UserPreferences = {
  userId: 'user-123',
  enabled: true,
  notificationChannels: ['email', 'in_app'],
  geoFilters: {
    cities: ['Dallas', 'Fort Worth'],
    radiusMiles: 50,
    centerLat: 32.7767,
    centerLng: -96.7970
  },
  scoringThresholds: {
    minLeadScore: 70,
    minValuation: 100000,
    maxValuation: 5000000,
    minConfidenceScore: 75
  },
  categories: [LeadCategory.SECURITY, LeadCategory.LOW_VOLTAGE],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Check if a lead matches
const matches = matchesPreferences(lead, preferences);

// Process multiple leads for alerts
const allPreferences = [preferences];
const alerts = processLeadsForAlerts(newLeads, allPreferences);

// Send alerts
for (const alert of alerts) {
  // Send through configured channels
  sendNotification(alert);
}
```

### Configuration

Configure alert preferences via the UI:

```typescript
import { AlertPreferencesModal } from './components/AlertPreferencesModal';

<AlertPreferencesModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  currentPreferences={userPreferences}
  onSave={(prefs) => savePreferences(prefs)}
/>
```

---

## 2. Geospatial Clustering & Heatmaps

### Overview
DBSCAN-based clustering to identify geographic concentrations of high-quality leads.

### Features
- Automatic cluster detection using DBSCAN algorithm
- Configurable epsilon (distance threshold) and minimum points
- Hotspot detection using kernel density estimation
- Interactive map visualization
- Cluster statistics and insights

### Usage Example

```typescript
import { clusterLeads, detectHotspots } from './services/geospatial/clusteringService';
import { leadsToHeatmapPoints } from './services/geospatial/heatmapService';

// Cluster leads (1 mile radius, minimum 3 leads)
const clusters = clusterLeads(leads, 1.0, 3);

// Detect hotspots
const hotspots = detectHotspots(leads, 0.5, 30);

// Get heatmap data
const heatmapPoints = leadsToHeatmapPoints(leads);

// Display results
console.log(`Found ${clusters.length} clusters`);
clusters.forEach(cluster => {
  console.log(`Cluster: ${cluster.leads.length} leads, avg score: ${cluster.averageScore}`);
});
```

### Visualization Components

```typescript
import { HotspotMap } from './components/HotspotMap';
import { ClusterInsights } from './components/ClusterInsights';

// Map view
<HotspotMap
  hotspots={hotspots}
  clusters={clusters}
  center={[32.7767, -96.7970]}
  zoom={10}
  height="600px"
/>

// Dashboard widget
<ClusterInsights
  clusters={clusters}
  hotspots={hotspots}
  hotspotSummary={summary}
/>
```

### DBSCAN Parameters

- **epsilon (miles):** Maximum distance between points in same cluster (default: 1.0)
- **minPoints:** Minimum points to form a cluster (default: 3)
- **gridSize:** Grid resolution for hotspot detection (default: 0.5 miles)
- **minIntensity:** Minimum intensity threshold for hotspots (default: 30)

---

## 3. Contractor Benchmarking

### Overview
Track contractor performance with fuzzy name matching for deduplication.

### Features
- Automatic contractor profile creation from leads
- Fuzzy name matching (Levenshtein distance)
- Performance metrics tracking
- Quality scoring
- Historical project analysis

### Usage Example

```typescript
import { 
  processLeadsForContractors, 
  findMatchingContractor,
  calculatePerformance 
} from './services/contractors/contractorService';

// Build/update contractor profiles
const profiles = processLeadsForContractors(leads, existingProfiles);

// Find matching contractor (with fuzzy matching)
const contractor = findMatchingContractor('ABC Construction Inc', profiles, 0.8);

// Calculate performance metrics
const performance = calculatePerformance(contractor, allLeads);

console.log(`${contractor.name}: ${contractor.projectCount} projects`);
console.log(`Quality Score: ${contractor.qualityScore}/100`);
console.log(`Avg Project Size: $${contractor.avgProjectSize.toLocaleString()}`);
```

### Fuzzy Matching

The service uses Levenshtein distance to match contractor names:

```typescript
// These will match with threshold 0.8:
"ABC Construction Inc" ↔ "ABC Construction"
"ABC Construction LLC" ↔ "A.B.C. Construction"
"Smith & Sons Contractors" ↔ "Smith and Sons Contracting"
```

### Enhanced Lead Scoring

Contractor quality scores are integrated into lead scoring:

```typescript
import { computeLeadScore, computeLeadScoreCustom } from './utils/leadScoring';

// Standard scoring (includes contractor quality)
const score = computeLeadScore(lead);

// Custom weights
const customScore = computeLeadScoreCustom(lead, {
  valuation: 25,
  confidence: 25,
  recency: 10,
  enrichment: 5,
  contractor: 20,  // Increase contractor weight
  probability: 15
});
```

---

## 4. Subcontractor Recommendations

### Overview
Network-based recommendations leveraging GC-subcontractor relationship graphs.

### Features
- Relationship graph from historical data
- Per-lead subcontractor recommendations
- Relevance scoring based on category match, relationship strength, and recency
- Network statistics and insights

### Usage Example

```typescript
import { 
  buildRelationshipGraph,
  generateRecommendations,
  getNetworkStats 
} from './services/network/relationshipGraph';

// Build relationship graph
const relationships = buildRelationshipGraph(permits, gcProfiles, subProfiles);

// Get recommendations for a lead
const recommendations = generateRecommendations(lead, relationships, 30);

recommendations.forEach(rec => {
  console.log(`${rec.subName} (${rec.relevanceScore}/100)`);
  console.log(`Reason: ${rec.reason}`);
  console.log(`Past projects: ${rec.pastProjectsWithGC}`);
});

// Network statistics
const stats = getNetworkStats(relationships);
console.log(`Network: ${stats.totalRelationships} relationships`);
console.log(`Top GC: ${stats.topGCs[0].name} (${stats.topGCs[0].subCount} subs)`);
```

### Relevance Scoring

Recommendations are scored 0-100 based on:

- **Category Match (40 pts):** Does the sub work in the lead's category?
- **Relationship Strength (30 pts):** How strong is the GC-sub relationship?
- **Project Count (20 pts):** How many projects together?
- **Recency (10 pts):** How recently did they work together?

---

## 5. ML-Based Project Probability

### Overview
Predict project start dates and completion probability using pattern analysis.

### Features
- Probability scoring (0-100)
- Estimated start date prediction
- Duration estimation
- Multi-factor analysis (historical, seasonal, market, contractor)

### Usage Example

```typescript
import { 
  predictProjectProbability, 
  batchPredictProbability,
  filterByProbability 
} from './services/ml/projectProbability';

// Single prediction
const prediction = predictProjectProbability(lead);

console.log(`Probability: ${prediction.probabilityScore}%`);
console.log(`Est. Start: ${prediction.estimatedStartDate}`);
console.log(`Est. Duration: ${prediction.estimatedDuration} days`);
console.log(`Confidence: ${prediction.confidence}%`);

// Batch predictions
const predictions = batchPredictProbability(leads);

// Filter high-probability leads
const highProbLeads = filterByProbability(leads, 70);
```

### Prediction Factors

1. **Historical Pattern (40%):** Based on project stage and status
2. **Seasonality (15%):** Construction activity peaks in spring/summer
3. **Market Conditions (25%):** Valuation, permit type, commercial trigger
4. **Contractor Activity (20%):** Contractor quality and reputation

---

## 6. API Reference

### Alert Queue Service

```typescript
// Match lead against preferences
matchesPreferences(lead: EnrichedPermit, preferences: UserPreferences): boolean

// Create alert queue item
createAlertQueueItem(userId: string, lead: EnrichedPermit, channels: NotificationChannel[]): AlertQueueItem

// Process leads for alerts
processLeadsForAlerts(leads: EnrichedPermit[], allPreferences: UserPreferences[]): AlertQueueItem[]

// Filter leads by preferences
filterLeadsByPreferences(leads: EnrichedPermit[], preferences: UserPreferences): EnrichedPermit[]

// Generate alert summary
generateAlertSummary(leads: EnrichedPermit[]): AlertSummary
```

### Clustering Service

```typescript
// Cluster leads using DBSCAN
clusterLeads(leads: EnrichedPermit[], epsilonMiles?: number, minPoints?: number): LeadCluster[]

// Detect hotspots
detectHotspots(leads: EnrichedPermit[], gridSize?: number, minIntensity?: number): Hotspot[]

// Filter clusters
filterClusters(clusters: LeadCluster[], minScore?: number, minValuation?: number, maxRadiusMiles?: number): LeadCluster[]

// Get cluster leads
getClusterLeads(cluster: LeadCluster, allLeads: EnrichedPermit[]): EnrichedPermit[]
```

### Contractor Service

```typescript
// Find matching contractor (fuzzy)
findMatchingContractor(name: string, profiles: ContractorProfile[], threshold?: number): ContractorProfile | null

// Create contractor profile
createContractorProfile(lead: EnrichedPermit, contractorName: string): ContractorProfile

// Update contractor profile
updateContractorProfile(profile: ContractorProfile, lead: EnrichedPermit): ContractorProfile

// Process leads for contractors
processLeadsForContractors(leads: EnrichedPermit[], existingProfiles?: ContractorProfile[]): ContractorProfile[]

// Calculate performance
calculatePerformance(profile: ContractorProfile, allLeads: EnrichedPermit[]): ContractorPerformance
```

### Network Service

```typescript
// Build relationship graph
buildRelationshipGraph(permits: EnrichedPermit[], gcProfiles: ContractorProfile[], subProfiles: ContractorProfile[]): GCSubRelationship[]

// Generate recommendations
generateRecommendations(lead: EnrichedPermit, relationships: GCSubRelationship[], minScore?: number): SubcontractorRecommendation[]

// Get network statistics
getNetworkStats(relationships: GCSubRelationship[]): NetworkStats

// Find similar GCs
findSimilarGCs(gcName: string, relationships: GCSubRelationship[], topN?: number): Array<{gcName: string, similarity: number, sharedSubs: number}>
```

### ML Prediction Service

```typescript
// Predict project probability
predictProjectProbability(lead: EnrichedPermit): ProjectProbability

// Batch predict
batchPredictProbability(leads: EnrichedPermit[]): Map<string, ProjectProbability>

// Filter by probability
filterByProbability(leads: EnrichedPermit[], minProbability?: number): EnrichedPermit[]

// Sort by probability
sortByProbability(leads: EnrichedPermit[], descending?: boolean): EnrichedPermit[]
```

---

## 7. Integration Guide

### Step 1: Update Lead Manager

Integrate AI services into your lead pipeline:

```typescript
import { recomputeLeadScores } from './services/jobs/scoringJob';
import { clusterLeads } from './services/geospatial/clusteringService';
import { processLeadsForContractors } from './services/contractors/contractorService';

async function enrichLeads(leads: EnrichedPermit[]) {
  // Process contractors
  const contractors = processLeadsForContractors(leads);
  
  // Recompute scores with contractor data
  const scoredLeads = await recomputeLeadScores(leads, contractors);
  
  // Generate clusters
  const clusters = clusterLeads(scoredLeads, 1.0, 3);
  
  // Assign cluster IDs
  for (const cluster of clusters) {
    for (const leadId of cluster.leads) {
      const lead = scoredLeads.find(l => l.id === leadId);
      if (lead) lead.clusterId = cluster.id;
    }
  }
  
  return { leads: scoredLeads, clusters, contractors };
}
```

### Step 2: Setup Alerts

Configure alert processing:

```typescript
import { processLeadsForAlerts } from './services/alerts/alertQueue';

async function processNewLeads(newLeads: EnrichedPermit[]) {
  // Get user preferences from database
  const allPreferences = await getUserPreferences();
  
  // Generate alerts
  const alerts = processLeadsForAlerts(newLeads, allPreferences);
  
  // Send notifications
  for (const alert of alerts) {
    await sendNotifications(alert);
  }
}
```

### Step 3: Weekly Digest

Setup weekly prospect lists:

```typescript
import { generateProspectList, generateWeeklyDigest, formatProspectListEmail } from './services/notifications/prospectList';

async function sendWeeklyDigest(userId: string) {
  const preferences = await getUserPreferences(userId);
  const leads = await getRecentLeads(7); // Last 7 days
  const relationships = await getRelationships();
  
  const prospectList = generateProspectList(leads, preferences, relationships, 60);
  const digest = generateWeeklyDigest(prospectList, 10);
  const html = formatProspectListEmail(digest, userName);
  
  await sendEmail(userEmail, 'Your Weekly Prospect Report', html);
}
```

### Step 4: Dashboard Integration

Add widgets to your dashboard:

```typescript
import { ClusterInsights } from './components/ClusterInsights';
import { HotspotMap } from './components/HotspotMap';
import { AlertPreferencesModal } from './components/AlertPreferencesModal';

function Dashboard() {
  const { clusters, hotspots } = useClusterData();
  
  return (
    <div>
      <ClusterInsights clusters={clusters} hotspots={hotspots} />
      <HotspotMap hotspots={hotspots} clusters={clusters} />
      <AlertPreferencesModal ... />
    </div>
  );
}
```

---

## Performance Considerations

### Caching
- Geocoding results are cached in localStorage
- Contractor profiles should be cached in database
- Cluster computations can be cached for 1-4 hours

### Rate Limiting
- Nominatim API: 1 request/second (handled by geocoding service)
- Batch processing: Use `geocodeBatch` with 900ms delay

### Optimization Tips
1. Pre-compute clusters daily via scheduled job
2. Index leads by city, score, and category in database
3. Use pagination for large result sets
4. Cache relationship graphs in memory/Redis

---

## Next Steps

1. **Testing:** Run unit tests with `npm test`
2. **Monitoring:** Track alert delivery rates and user engagement
3. **Tuning:** Adjust DBSCAN parameters based on market density
4. **Expansion:** Add more cities and data sources

For questions or issues, see the [main README](../README.md) or [contact support](mailto:support@finishoutnow.com).
