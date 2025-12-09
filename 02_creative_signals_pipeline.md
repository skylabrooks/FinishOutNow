# 02_creative_signals_pipeline.md

Concise steps for adding creative early‑signal sources.

## 1. Utility Connections
- Fetch new commercial meter/service connections.
- Normalize as `UTILITY_HOOKUP` with stage `OCCUPANCY_PENDING`.
- Only include commercial or high‑capacity records.

## 2. Zoning & Land‑Use Cases
- Scrape zoning agendas/case portals.
- Use LLM to extract intended use + scale.
- Normalize as `ZONING_CASE` at stage `CONCEPT`.
- Include only commercial, medium/large cases.

## 3. Legal Vacancy Signals
- Scrape eviction dockets; extract property address.
- Use as **secondary signals** to boost related leads.
- Only treat as primary if commercial and addressable.

## 4. Licensing & Occupancy
- Health/Food: include new/pre‑opening permits only.
- Liquor: include new applications/issuances.
- Fire: use alarm/occupancy to upgrade project stage.

## 5. Incentives & Environmental Permits
- Scrape economic development approvals.
- LLM‑extract company, location, investment.
- Normalize as `INCENTIVE_ANNOUNCEMENT` at `CONCEPT`.
- Include only significant investments.

## 6. Linking Signals to Leads
- Nightly job links by address/geometry.
- Boost `lead_score` on matched leads.
- Create new leads only when signals are strong.

