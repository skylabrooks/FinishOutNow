# AI Features Quick Reference

Quick reference guide for common AI feature tasks.

## Import Statements

```typescript
// Alerts
import { matchesPreferences, processLeadsForAlerts } from './services/alerts/alertQueue';

// Clustering
import { clusterLeads, detectHotspots } from './services/geospatial/clusteringService';
import { leadsToHeatmapPoints } from './services/geospatial/heatmapService';

// Contractors
import { processLeadsForContractors, findMatchingContractor } from './services/contractors/contractorService';

// Network
import { buildRelationshipGraph, generateRecommendations } from './services/network/relationshipGraph';

// ML
import { predictProjectProbability, filterByProbability } from './services/ml/projectProbability';

// Scoring
import { recomputeLeadScores, getHighQualityLeads } from './services/jobs/scoringJob';

// Notifications
import { generateProspectList, generateWeeklyDigest } from './services/notifications/prospectList';

// Components
import { AlertPreferencesModal } from './components/AlertPreferencesModal';
import { ClusterInsights } from './components/ClusterInsights';
import { HotspotMap } from './components/HotspotMap';
```

## Common Tasks

### 1. Check if Lead Matches User Preferences

```typescript
const matches = matchesPreferences(lead, userPreferences);
if (matches) {
  // Send notification
}
```

### 2. Cluster Leads

```typescript
const clusters = clusterLeads(leads, 1.0, 3); // 1 mile, min 3 leads
const topCluster = clusters[0]; // Sorted by avgScore
```

### 3. Find Contractor

```typescript
const contractor = findMatchingContractor('ABC Construction', profiles, 0.8);
if (contractor) {
  console.log(`Found: ${contractor.name} (${contractor.projectCount} projects)`);
}
```

### 4. Get Lead Recommendations

```typescript
const recommendations = generateRecommendations(lead, relationships, 30);
recommendations.forEach(rec => {
  console.log(`${rec.subName}: ${rec.relevanceScore}%`);
});
```

### 5. Predict Project Probability

```typescript
const prediction = predictProjectProbability(lead);
console.log(`${prediction.probabilityScore}% likely to proceed`);
```

### 6. Generate Weekly Digest

```typescript
const prospectList = generateProspectList(leads, preferences, relationships);
const digest = generateWeeklyDigest(prospectList, 10);
const html = formatProspectListEmail(digest, userName);
```

### 7. Recompute All Lead Scores

```typescript
const updatedLeads = await recomputeLeadScores(leads, contractorProfiles);
const highQuality = getHighQualityLeads(updatedLeads, 70);
```

## Type Definitions

### UserPreferences
```typescript
{
  userId: string;
  enabled: boolean;
  notificationChannels: NotificationChannel[];
  geoFilters?: {
    cities?: string[];
    radiusMiles?: number;
    centerLat?: number;
    centerLng?: number;
  };
  scoringThresholds?: {
    minLeadScore?: number;
    minValuation?: number;
    maxValuation?: number;
  };
  categories?: LeadCategory[];
}
```

### LeadCluster
```typescript
{
  id: string;
  centroid: GeoPoint;
  leads: string[];
  averageScore: number;
  totalValuation: number;
  radiusMiles: number;
  density: number;
  topCategories: LeadCategory[];
}
```

### ProjectProbability
```typescript
{
  leadId: string;
  probabilityScore: number; // 0-100
  estimatedStartDate?: string;
  estimatedDuration?: number; // days
  confidence: number; // 0-100
  factors: {
    historicalPattern: number;
    seasonality: number;
    marketConditions: number;
    contractorActivity: number;
  };
}
```

## Default Parameters

```typescript
// Clustering
clusterLeads(leads, 1.0, 3)  // epsilon=1mi, minPoints=3

// Hotspots
detectHotspots(leads, 0.5, 30)  // gridSize=0.5mi, minIntensity=30

// Fuzzy matching
findMatchingContractor(name, profiles, 0.8)  // threshold=0.8

// Recommendations
generateRecommendations(lead, relationships, 30)  // minScore=30

// High-quality leads
getHighQualityLeads(leads, 70)  // minScore=70
```

## Component Props

### AlertPreferencesModal
```typescript
<AlertPreferencesModal
  isOpen={boolean}
  onClose={() => void}
  currentPreferences={UserPreferences}
  onSave={(prefs: UserPreferences) => void}
/>
```

### ClusterInsights
```typescript
<ClusterInsights
  clusters={LeadCluster[]}
  hotspots={Hotspot[]}
  hotspotSummary={HotspotSummary}
/>
```

### HotspotMap
```typescript
<HotspotMap
  hotspots={Hotspot[]}
  clusters={LeadCluster[]}
  center={[lat, lng]}
  zoom={number}
  height={string}
/>
```

## Scoring Weights

Standard lead scoring weights:
- Valuation: 30 points (max)
- AI Confidence: 30 points (max)
- Recency: 10 points (max)
- Enrichment: 5 points (max)
- Contractor Quality: 15 points (max)
- Project Probability: 10 points (max)
- **Total: 100 points**

Customize with:
```typescript
computeLeadScoreCustom(lead, {
  valuation: 25,
  confidence: 25,
  recency: 10,
  enrichment: 5,
  contractor: 20,
  probability: 15
});
```

## Database Schema Extensions

Add to your database schema:

```sql
-- Contractor profiles
CREATE TABLE contractor_profiles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  aliases TEXT[], -- Array of aliases
  project_count INT DEFAULT 0,
  total_valuation DECIMAL(12,2),
  avg_project_size DECIMAL(12,2),
  categories TEXT[],
  cities TEXT[],
  quality_score INT,
  reliability INT,
  last_active TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- GC-Sub relationships
CREATE TABLE gc_sub_relationships (
  id VARCHAR(255) PRIMARY KEY,
  gc_id VARCHAR(255),
  gc_name VARCHAR(255),
  sub_id VARCHAR(255),
  sub_name VARCHAR(255),
  project_count INT DEFAULT 0,
  categories TEXT[],
  last_worked_together TIMESTAMP,
  relationship_strength INT
);

-- User preferences
CREATE TABLE user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  notification_channels TEXT[],
  geo_filters JSONB,
  scoring_thresholds JSONB,
  categories TEXT[],
  permit_types TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Alert queue
CREATE TABLE alert_queue (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  lead_id VARCHAR(255),
  channels TEXT[],
  status VARCHAR(50),
  created_at TIMESTAMP,
  sent_at TIMESTAMP,
  error TEXT
);
```

## Troubleshooting

### Issue: Clustering produces no results
- Ensure leads have latitude/longitude coordinates
- Try reducing minPoints parameter (e.g., from 3 to 2)
- Increase epsilon radius (e.g., from 1.0 to 2.0 miles)

### Issue: Fuzzy matching too strict/loose
- Adjust threshold parameter (default 0.8)
- Lower threshold (0.7) for more matches
- Raise threshold (0.9) for stricter matches

### Issue: No recommendations generated
- Verify relationships graph is populated
- Check that lead has general contractor extracted
- Lower minScore parameter (default 30)

### Issue: Low prediction confidence
- Ensure leads have stage information
- Verify contractor profiles exist
- Check lead has AI analysis data

## Performance Tips

1. **Batch operations:** Use batch functions for processing multiple leads
2. **Caching:** Cache contractor profiles and relationships in memory
3. **Indexing:** Index leads by city, category, and score in database
4. **Rate limiting:** Respect geocoding API limits (1 req/sec)
5. **Scheduled jobs:** Run cluster computation and scoring daily, not on-demand

## Next Steps

- See [full documentation](./README.md) for detailed guides
- Check [test examples](../../tests/unit/services/) for usage patterns
- Review [type definitions](../../types.ts) for complete interfaces
