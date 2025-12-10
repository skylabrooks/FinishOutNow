# 01_data_sources_and_ingestion.md

Concise implementation steps for adding and normalizing new data sources.

## 1. Canonical Schema
Use two core tables:
- `lead_raw`: stores unprocessed source data.
- `lead_normalized`: unified fields: project type, stage, value, address, entities, score, flags.

Create `lead_high_quality`:
```
CREATE MATERIALIZED VIEW lead_high_quality AS
SELECT * FROM lead_normalized
WHERE is_actionable = TRUE AND is_recent = TRUE AND lead_score >= 60;
```

## 2. County & State Sources
### Collin County
- Fetch permits via county API.
- Normalize: map type → `COMMERCIAL_NEW`, `COMMERCIAL_ALTERATION`, etc.
- Filter out valuations < $50k.
- Only process addresses that geocode.

### Texas Sales Tax Permits
- Fetch recent permits.
- Normalize as tenant-change / new occupancy.
- Only include commercial NAICS.

### TDLR TABS
- Scrape public project records >$50k.
- Normalize as `PRE_PERMIT` construction.
- Use for early signals.

## 3. Static City Reports
- Crawl weekly/monthly Excel/PDF.
- Extract: permit #, description, value, contractor.
- Parse tables with heuristics.
- Normalize, enforce filters.

## 4. Minimum Quality Filters
Apply at normalization:
- Geocoded
- Value ≥ threshold
- Supported type + land use
- Active business
- Within DFW region

Set `is_recent` using event date rules.

## 5. Orchestration
Create DAGs: ingestion, normalization, dedupe, scoring, refreshing the high-quality materialized view.

