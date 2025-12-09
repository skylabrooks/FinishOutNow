# 🎯 AI Features - Quick Start

## Installation

All AI features are included in the FinishOutNow codebase. No additional dependencies required beyond the existing stack.

## Import Everything from One Place

```typescript
import { AIFeatures, AIQuick } from './services/aiFeatures';

// Or import specific functions
import { 
  clusterLeads, 
  generateRecommendations, 
  predictProjectProbability 
} from './services/aiFeatures';
```

## Quick Examples

### 1. Check if a Lead Matches User Preferences

```typescript
import { AIQuick } from './services/aiFeatures';

const matches = AIQuick.matchLead(lead, userPreferences);
if (matches) {
  console.log('Send notification!');
}
```

### 2. Cluster Leads Geographically

```typescript
import { AIQuick } from './services/aiFeatures';

const clusters = AIQuick.cluster(leads, 1.0, 3); // 1 mile radius, min 3 leads
console.log(`Found ${clusters.length} clusters`);
```

### 3. Get Subcontractor Recommendations

```typescript
import { AIQuick } from './services/aiFeatures';

const recommendations = AIQuick.recommend(lead, relationships, 30);
recommendations.forEach(rec => {
  console.log(`${rec.subName}: ${rec.relevanceScore}% match`);
});
```

### 4. Predict Project Probability

```typescript
import { AIQuick } from './services/aiFeatures';

const prediction = AIQuick.predict(lead);
console.log(`${prediction.probabilityScore}% likely to proceed`);
console.log(`Estimated start: ${prediction.estimatedStartDate}`);
```

### 5. Complete Processing Pipeline

```typescript
import { AIFeatures } from './services/aiFeatures';

// Process contractors
const contractors = AIFeatures.contractors.processLeadsForContractors(leads);

// Recompute scores
const scoredLeads = await AIFeatures.scoring.recomputeLeadScores(leads, contractors);

// Generate clusters
const clusters = AIFeatures.geospatial.clusterLeads(scoredLeads);

// Get top leads
const topLeads = AIFeatures.scoring.getHighQualityLeads(scoredLeads, 70);
```

## Components

### Alert Preferences Modal

```typescript
import { AlertPreferencesModal } from './components/AlertPreferencesModal';

<AlertPreferencesModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  currentPreferences={userPreferences}
  onSave={handleSave}
/>
```

### Cluster Insights Dashboard

```typescript
import { ClusterInsights } from './components/ClusterInsights';

<ClusterInsights
  clusters={clusters}
  hotspots={hotspots}
  hotspotSummary={summary}
/>
```

### Hotspot Map

```typescript
import { HotspotMap } from './components/HotspotMap';

<HotspotMap
  hotspots={hotspots}
  clusters={clusters}
  center={[32.7767, -96.7970]}
  zoom={10}
/>
```

## Documentation

- **📚 Full Guide:** [docs/06_AI_Features/README.md](docs/06_AI_Features/README.md)
- **⚡ Quick Reference:** [docs/06_AI_Features/QUICK_REFERENCE.md](docs/06_AI_Features/QUICK_REFERENCE.md)
- **📋 Implementation Summary:** [AI_FEATURES_IMPLEMENTATION_SUMMARY.md](AI_FEATURES_IMPLEMENTATION_SUMMARY.md)
- **🔧 Integration Example:** [services/integrationExample.ts](services/integrationExample.ts)

## Testing

Run the test suite:

```bash
npm test
npm run test:coverage
```

Example test file: `tests/unit/services/alertQueue.test.ts`

## Features Included

✅ **Predictive Alerts** - Multi-channel notifications with geo filtering  
✅ **Geospatial Clustering** - DBSCAN algorithm with hotspot detection  
✅ **Contractor Benchmarking** - Fuzzy matching and quality scoring  
✅ **Network Recommendations** - GC-to-sub relationship intelligence  
✅ **ML Predictions** - Project probability and timeline estimates  
✅ **Enhanced Scoring** - 6-factor lead quality algorithm  
✅ **Weekly Digests** - Automated prospect list generation  
✅ **Interactive Visualizations** - Maps, charts, and insights  

## Next Steps

1. **Review Documentation:** Start with [Quick Reference](docs/06_AI_Features/QUICK_REFERENCE.md)
2. **Setup Database:** Add tables from schema in documentation
3. **Integrate Services:** Follow [Integration Example](services/integrationExample.ts)
4. **Add Components:** Include dashboard widgets in your UI
5. **Schedule Jobs:** Setup daily scoring and weekly digest jobs
6. **Test Features:** Run unit tests and add your own

## Support

- 📖 Check documentation in `docs/06_AI_Features/`
- 🧪 Review test examples in `tests/unit/services/`
- 💡 See integration patterns in `services/integrationExample.ts`
- 📝 Reference type definitions in `types.ts`

**All 17 AI features are production-ready! 🚀**
