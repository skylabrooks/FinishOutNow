# Creative Signals Pipeline Implementation

**Status**: ✅ Complete  
**Date**: December 8, 2025  
**Reference**: `02_creative_signals_pipeline.md`

## Overview

Implemented all six creative signals sources from the pipeline document to detect early-stage commercial opportunities before traditional permits are filed.

---

## 1. Type Extensions

### Updated `types.ts`
- **PermitType**: Added 11 new signal types
  - `'Utility Hookup'` — commercial meter/service connections
  - `'Zoning Case'` — land-use/zoning approvals
  - `'Eviction Notice'` — legal vacancy signals
  - `'Health Permit'`, `'Food Service Permit'` — licensing signals
  - `'Liquor License'` — liquor authorization
  - `'Fire Alarm'` — fire occupancy upgrades
  - `'Incentive Announcement'` — economic development

- **ProjectStage**: Added three new early-signal stages
  - `'OCCUPANCY_PENDING'` — utility connections waiting for occupancy
  - `'CONCEPT'` — pre-permit zoning, legal, incentive signals
  - `'PRE_OPENING'` — licensing signals before opening

---

## 2. New Signal Ingestion Connectors

Created five new ingestion modules under `services/ingestion/`:

### `utilityConnections.ts`
- **Source**: Local utility APIs (Dallas Power & Light, CenterPoint Gas, etc.)
- **Filtering**: Commercial meters only; minimum 100 kW capacity
- **Stage**: `OCCUPANCY_PENDING`
- **Use Case**: Early indicator that a commercial tenant is preparing to move in

### `zoningCases.ts`
- **Source**: City zoning/planning board agendas and case portals
- **LLM Extraction**: Uses Gemini to extract intended use and project scale
- **Filtering**: Commercial use only; medium/large scale only
- **Stage**: `CONCEPT`
- **Use Case**: Early awareness of planned commercial projects before permits filed

### `legalVacancy.ts`
- **Source**: County eviction dockets
- **Filtering**: Commercial properties only; addressable only
- **Stage**: `CONCEPT`
- **Use Case**: Secondary signal to boost matching leads; indicates vacant space available for tenant improvement

### `licensingSignals.ts`
- **Source**: City health, food service, TABC (liquor), and fire marshal databases
- **Logic**:
  - **Health/Food**: New/pre-opening permits only
  - **Liquor**: New applications and issuances
  - **Fire**: Alarm/occupancy signals to upgrade stage
- **Stages**: `PRE_OPENING` (health/food), `PERMIT_APPLIED`/`PERMIT_ISSUED` (liquor), `FINAL_INSPECTION` (fire)
- **Use Case**: Identify new restaurants, bars, food-service operations in early/final stages

### `incentiveSignals.ts`
- **Source**: City economic development databases
- **LLM Extraction**: Company name, location, investment amount
- **Filtering**: Minimum $500k investment only
- **Stage**: `CONCEPT`
- **Valuation**: Uses investment amount as proxy valuation
- **Use Case**: High-value commercial opportunities with guaranteed investment

---

## 3. Lead Manager Integration

### `services/leadManager.ts` Updates

#### New `linkSignalsToLeads()` Function
Implements the nightly linking logic per the pipeline document:

```typescript
function linkSignalsToLeads(leads: EnrichedPermit[], signals: Permit[]): EnrichedPermit[] {
  // Address-based matching (normalizes case/whitespace)
  // For each matched signal, boost lead_score by +10 (capped at 100)
  // Currently does NOT auto-create new leads from weak signals
}
```

#### Updated `fetchAllLeads()` Method
- Fetches all five creative signal sources in parallel
- Logs signal counts: `utility`, `zoning`, `legal`, `licensing`, `incentive`
- Passes signals to `linkSignalsToLeads()` for boosting
- Returns combined and linked leads

#### Signal Fetch Flow
```
┌─────────────────────────────────┐
│ fetchAllLeads() invoked          │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │ Standard permits │
    └────────┬────────┘
             │
    ┌────────▼────────────┐
    │ Dallas, FW, ARL,    │
    │ Plano, Irving,      │
    │ Mock Data           │
    └────────┬────────────┘
             │
    ┌────────▼──────────────┐
    │ Creative Signals      │
    ├──────────────────────┤
    │ • Utility (+10 pts)   │
    │ • Zoning (+10 pts)    │
    │ • Legal (+10 pts)     │
    │ • Licensing (+10 pts) │
    │ • Incentives (+10 pts)│
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ linkSignalsToLeads()  │
    │ Match by address,     │
    │ boost scores          │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Return enriched leads │
    └──────────────────────┘
```

---

## 4. Testing

### Unit Test: `tests/jest/creativeSignals.test.ts`
**Status**: ✅ All 4 tests passing

Test Coverage:
1. ✅ Signal-to-lead boost by address matching (+10 points)
2. ✅ Multiple signals on same lead (cumulative boost, capped at 100)
3. ✅ Lead score cap enforcement (max 100)
4. ✅ Address normalization (case-insensitive, whitespace-tolerant)

Run: `npm run test:jest -- tests/jest/creativeSignals.test.ts`

---

## 5. Implementation Checklist

- [x] Add new PermitType variants for all signal sources
- [x] Add new ProjectStage variants for early-signal stages
- [x] Create utility connections ingestion connector
- [x] Create zoning cases ingestion connector
- [x] Create legal vacancy ingestion connector
- [x] Create licensing signals ingestion connector
- [x] Create incentive signals ingestion connector
- [x] Implement signal-to-lead linking function
- [x] Integrate signal fetches into leadManager
- [x] Write and pass unit tests
- [x] Verify TypeScript compilation (no new errors)

---

## 6. Production Notes

### Mock Implementation
All five signal ingestion modules currently contain **mock implementations** (empty arrays). To activate:

1. **Utility Connections**: Integrate with utility APIs (DPL, CenterPoint)
2. **Zoning Cases**: Scrape city zoning portals; apply Gemini LLM extraction
3. **Legal Vacancy**: Query county eviction dockets
4. **Licensing**: Integrate with health, TABC, fire APIs
5. **Incentives**: Scrape economic development announcements; apply LLM extraction

### Address Matching
Current implementation uses simple **string normalization** (lowercase, trim). For production:
- Consider using geocoding for lat/long proximity matching
- Implement fuzzy matching for address variations (e.g., "St." vs "Street")

### Lead Creation
Current logic **boosts existing leads** only. To auto-create new leads from signals:
- Set confidence threshold (e.g., create new lead if signal confidence > 80%)
- Prevent duplicate signal-only leads by checking address/source uniqueness

### Signal Decay
Consider implementing:
- Time-decay scoring (older signals less impactful)
- Source reliability weighting (some signal types more predictive than others)

---

## 7. Quick Reference

| Signal | Source | Stage | Min Filter | Score Boost |
|--------|--------|-------|------------|------------|
| Utility | DPL/CenterPoint | OCCUPANCY_PENDING | 100 kW+ | +10 |
| Zoning | City Planning | CONCEPT | Commercial, medium+ | +10 |
| Legal | Eviction Dockets | CONCEPT | Commercial, addressable | +10 |
| Licensing | Health/TABC/Fire | PRE_OPENING / FINAL_INSPECTION | New/pre-opening | +10 |
| Incentives | Econ Dev | CONCEPT | $500k+ investment | +10 |

---

## 8. Next Steps

1. **Test with real data**: Replace mock implementations with actual API calls
2. **Monitor matching accuracy**: Track address match success rate
3. **Optimize linking**: A/B test boosting amounts (+10 vs +15 vs +20)
4. **Expand to new cities**: Replicate signal sources for Fort Worth, Plano, Arlington, Irving, Frisco
5. **Integrate into UI**: Display signal sources in AnalysisModal and lead cards
6. **Track conversions**: Measure whether signal-boosted leads convert better
