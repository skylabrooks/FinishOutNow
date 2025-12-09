# 03_ai_features_predictive_geo_network.md

Concise implementation of core AI features.

## 1. Predictive Alerts
- Store user prefs: geo filter, types, score threshold, max lead age.
- On lead update: push to queue → alert matcher.
- Alert only if: actionable, recent, score ≥ threshold.
- Optional model: project probability + expected start date.

## 2. Geospatial Clustering & Heatmaps
- Add `geom` to leads.
- Periodic clustering using DBSCAN on high‑quality leads.
- Store clusters: centroid, radius, counts, total value.
- Heatmap API returns clusters within bbox/time.
- Compute “hotspots” by comparing to historical metrics.

## 3. Contractor Benchmarking & Lead Scoring
- Build `contractor_profiles` with project volume, avg value, specialization.
- Fuzzy match contractor names.
- Score = weighted blend of value, recency, contractor strength, signals, completeness.
- Recompute score job daily; refresh high‑quality view.

## 4. Subcontractor Recommendations
- Build GC–sub graph from historical projects.
- Recommend subs based on segment, geography, frequency.
- Show per‑lead recommendations and weekly prospect lists.

