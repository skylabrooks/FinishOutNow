# AI Features Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FINISHOUTNOW AI FEATURES                        │
│                            Architecture Diagram                          │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐
│   Data Ingestion       │
│   (Existing System)    │
│                        │
│  • Dallas Permits      │
│  • Fort Worth Permits  │
│  • Plano, Frisco, etc  │
│  • Creative Signals    │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      LEAD ENRICHMENT PIPELINE                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │   Gemini AI  │───▶│  Enrichment  │───▶│   Quality    │           │
│  │   Analysis   │    │  (Comptroller│    │   Filtering  │           │
│  │              │    │   Geocoding) │    │              │           │
│  └──────────────┘    └──────────────┘    └──────────────┘           │
│                                                                        │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         AI FEATURES LAYER                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │  PHASE 1: PREDICTIVE ALERTS                              │         │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │         │
│  │  │   Alert     │  │    ML       │  │ Notification│     │         │
│  │  │   Queue     │──│ Probability │──│   Channels  │     │         │
│  │  │   Service   │  │  Predictor  │  │  (Email/SMS)│     │         │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │  PHASE 2: GEOSPATIAL INTELLIGENCE                       │         │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │         │
│  │  │   DBSCAN    │  │   Hotspot   │  │   Heatmap   │     │         │
│  │  │  Clustering │──│  Detection  │──│    Data     │     │         │
│  │  │   (Geo)     │  │   (KDE)     │  │  Generator  │     │         │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │  PHASE 3: CONTRACTOR BENCHMARKING                       │         │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │         │
│  │  │ Contractor  │  │    Fuzzy    │  │  Enhanced   │     │         │
│  │  │   Profile   │──│   Matching  │──│    Lead     │     │         │
│  │  │   Builder   │  │(Levenshtein)│  │   Scoring   │     │         │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │  PHASE 4: NETWORK RECOMMENDATIONS                       │         │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │         │
│  │  │Relationship │  │Subcontractor│  │   Weekly    │     │         │
│  │  │   Graph     │──│Recommender  │──│  Prospect   │     │         │
│  │  │  (GC-Sub)   │  │   Engine    │  │    Lists    │     │         │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                        │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  Alert Prefs    │  │   Cluster       │  │    Hotspot      │      │
│  │     Modal       │  │   Insights      │  │      Map        │      │
│  │   (Config UI)   │  │  (Dashboard)    │  │  (Interactive)  │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘


DATA FLOW DIAGRAM
═════════════════

┌─────────────┐
│  New Lead   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Contractor Profile  │ ◄─── Fuzzy Match (Levenshtein)
│     Extraction      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  ML Prediction      │ ◄─── 4 Factors (Historical, Seasonal, Market, Contractor)
│  (Probability)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Enhanced Scoring   │ ◄─── 6 Factors (Valuation, Confidence, Recency, etc)
│   (0-100 points)    │
└──────┬──────────────┘
       │
       ├───────────────────────────┐
       │                           │
       ▼                           ▼
┌─────────────────────┐   ┌──────────────────┐
│ Alert Matching      │   │  Clustering      │
│ (User Preferences)  │   │  (DBSCAN/KDE)    │
└──────┬──────────────┘   └────────┬─────────┘
       │                           │
       ▼                           ▼
┌─────────────────────┐   ┌──────────────────┐
│  Notifications      │   │  Visualization   │
│  (Multi-channel)    │   │  (Maps/Charts)   │
└─────────────────────┘   └──────────────────┘


SCORING ALGORITHM
═════════════════

Total: 100 points

┌────────────────────────────────────┐
│ Valuation        │ 30 pts │ ████   │
├────────────────────────────────────┤
│ AI Confidence    │ 30 pts │ ████   │
├────────────────────────────────────┤
│ Contractor       │ 15 pts │ ██     │
├────────────────────────────────────┤
│ Recency          │ 10 pts │ █      │
├────────────────────────────────────┤
│ ML Probability   │ 10 pts │ █      │
├────────────────────────────────────┤
│ Enrichment       │  5 pts │ ▌      │
└────────────────────────────────────┘


CLUSTERING ALGORITHM (DBSCAN)
══════════════════════════════

Parameters:
  ε (epsilon)    = 1.0 mile (distance threshold)
  minPoints      = 3 leads (minimum cluster size)

Process:
  1. For each unvisited lead point
  2. Find neighbors within ε distance
  3. If neighbors ≥ minPoints: create cluster
  4. Expand cluster recursively
  5. Points with < minPoints neighbors = noise

Output:
  • Cluster ID
  • Centroid coordinates
  • Lead IDs in cluster
  • Average score
  • Total valuation
  • Density (leads/sq mi)


RECOMMENDATION SCORING
══════════════════════

Total: 100 points

┌──────────────────────────────────────┐
│ Category Match      │ 40 pts │ █████ │
├──────────────────────────────────────┤
│ Relationship        │ 30 pts │ ████  │
│ Strength            │        │       │
├──────────────────────────────────────┤
│ Project Count       │ 20 pts │ ██    │
├──────────────────────────────────────┤
│ Recency             │ 10 pts │ █     │
└──────────────────────────────────────┘


KEY SERVICES BY FILE
════════════════════

services/
├── alerts/
│   └── alertQueue.ts ................. Match leads to user preferences
├── ml/
│   └── projectProbability.ts ........ Predict project likelihood
├── geospatial/
│   ├── clusteringService.ts ......... DBSCAN clustering algorithm
│   └── heatmapService.ts ............ Heatmap data generation
├── contractors/
│   └── contractorService.ts ......... Fuzzy matching & profiles
├── network/
│   └── relationshipGraph.ts ......... GC-Sub recommendations
├── notifications/
│   └── prospectList.ts .............. Weekly digest generator
└── jobs/
    └── scoringJob.ts ................ Daily score recomputation


COMPONENTS
══════════

components/
├── AlertPreferencesModal.tsx ........ User preference configuration
├── ClusterInsights.tsx .............. Dashboard statistics widget
└── HotspotMap.tsx ................... Interactive Leaflet map


DATABASE SCHEMA (Recommended)
═══════════════════════════════

contractor_profiles
├── id (PK)
├── name
├── aliases (array)
├── project_count
├── total_valuation
├── quality_score
└── last_active

gc_sub_relationships
├── id (PK)
├── gc_id
├── sub_id
├── project_count
└── relationship_strength

user_preferences
├── user_id (PK)
├── enabled
├── notification_channels (array)
├── geo_filters (JSON)
└── scoring_thresholds (JSON)

alert_queue
├── id (PK)
├── user_id
├── lead_id
├── status
└── channels (array)


PERFORMANCE METRICS
═══════════════════

Operation                  | Complexity | Typical Time
---------------------------|------------|-------------
Alert matching (1 lead)    | O(n)       | <1ms
DBSCAN clustering (100)    | O(n²)      | ~50ms
Fuzzy matching (1 name)    | O(n*m)     | ~5ms
ML prediction (1 lead)     | O(1)       | <1ms
Hotspot detection (grid)   | O(n*g)     | ~100ms
Score recomputation (1000) | O(n)       | ~500ms

Where:
  n = number of leads
  m = string length
  g = grid cells


API ENDPOINTS (Recommended)
════════════════════════════

POST   /api/alerts/preferences      Save user preferences
GET    /api/alerts/preferences/:id  Get preferences
POST   /api/alerts/queue            Queue alerts
GET    /api/clusters                Get lead clusters
GET    /api/hotspots                Get hotspots
GET    /api/contractors             List contractors
GET    /api/contractors/:id         Get contractor
POST   /api/recommendations/:id     Get recommendations
GET    /api/prospect-list           Weekly digest
POST   /api/scoring/recompute       Trigger job


INTEGRATION CHECKLIST
═════════════════════

□ Add new types to database schema
□ Update lead manager pipeline with AI services
□ Integrate AlertPreferencesModal in settings
□ Add ClusterInsights to dashboard
□ Add HotspotMap to map view
□ Setup cron jobs (daily scoring, weekly digest)
□ Configure notification channels
□ Test alert matching logic
□ Verify clustering parameters for your market
□ Review and adjust scoring weights
□ Setup monitoring and alerts
□ Document custom configuration

```
