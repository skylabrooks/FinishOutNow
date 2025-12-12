# Copilot Instructions — FinishOutNow

**Purpose:** Quick reference to make AI agents productive in this repo without deep archaeological digs.

---

## 🏗️ Architecture Overview

**Data pipeline:** City-specific ingestion connectors (`services/ingestion/*`) → dedupe/geocode/normalize (`services/leadManager.ts`) → AI analysis (`services/geminiService.ts`) → enriched permit data (`EnrichedPermit` in `types.ts`) → UI components (`components/*`).

**Frontend:** React 19 + Vite. Entries: `index.tsx`, `App.tsx`.  
**AI/ML:** Gemini 2.0 Flash for permit analysis. ML predictions in `/services/ml/`.  
**Backend:** Node/Firebase. Dev server at `npm run dev:api` (port 3001).  
**State:** Firebase Firestore for leads, users, claims. Auth via Firebase.

---

## 🎯 Critical Files & Why

| File | Role | When to Edit |
|------|------|--------------|
| `services/leadManager.ts` | Orchestrator: runs ingestion, dedupe, geocoding, signal linking, scoring | Adding city connectors, tweaking quality filters, signal matching rules |
| `services/geminiService.ts` | Gemini API layer: prompt, schema, response parsing | Changing AI signals ("Vibe Coding" rules), confidence scoring, entity extraction |
| `services/gemini/schema.ts` | `analysisSchema` + `systemInstruction` | Modifying AI response structure (must sync with `AIAnalysisResult` in `types.ts`) |
| `services/gemini/responseMapper.ts` | snake_case → camelCase conversion | Mapping new Gemini fields to UI model |
| `services/ingestion/{city}.ts` | City-specific permit fetchers (Dallas, Fort Worth, Plano, Arlington, Irving, TABC, etc.) | Adding new cities, fixing API changes |
| `services/qualityFilter.ts` | Lead scoring logic: recency, value, land use, geocoding | Tweaking quality thresholds, stage-specific windows |
| `types.ts` | Core TypeScript interfaces: `Permit`, `EnrichedPermit`, `AIAnalysisResult` | Adding fields to permits or analysis results |
| `components/AnalysisModal.tsx` & `DiagnosticPanel.tsx` | AI result rendering & test suite invocation | Testing prompt changes before commit |

---

## 🔄 Data Structures & Type Safety

**Core types:**
- `Permit` / `EnrichedPermit` — raw → enriched permit data (permit details, AI analysis, enrichment metadata)
- `AIAnalysisResult` — Gemini output: `isCommercialTrigger`, `confidenceScore`, `tradeOpportunities`, `reasoning`, `category`
- `City` — union of 6 supported cities (Dallas, Fort Worth, Plano, Frisco, Irving, Arlington)
- `ProjectStage` — pipeline state: PRE_PERMIT → PERMIT_APPLIED → PERMIT_ISSUED → FINAL_INSPECTION → COMPLETE

**Quality metrics** (tracked per permit):
- `leadScore` (0-100 composite)
- `isHighQuality` (actionable + recent + score ≥ threshold)
- `stage`, `landUse`, `valuation` — used by quality filters

---

## 💡 Project Conventions

### "Vibe Coding" (AI Signal Rules)
Gemini's `systemInstruction` in `schema.ts` defines deterministic positive/negative signals for commercial trigger detection:
- **Positive signals:** "Tenant Improvement", "Access Control", "Certificate of Occupancy", "Security System", "HVAC"
- **Negative signals:** "Residential", "Maintenance", "Minor Repairs"
- `is_commercial_trigger` boolean set by Gemini; confidence score calibrated by domain knowledge.

### Schema-First AI Integration
1. Update `analysisSchema` in `services/gemini/schema.ts` (JSON schema for Gemini response)
2. Add corresponding fields to `AIAnalysisResult` in `types.ts`
3. Update `mapGeminiResponse()` in `responseMapper.ts` to parse new fields
4. Test via `DiagnosticPanel` before committing

### Client-Side Geocoding & Caching
- `leadManager.ts` calls `geocodingService.geocodeBatch()` to batch-geocode addresses
- Results cached in `localStorage` under key `finishoutnow_geocache_v1` to avoid repeated API calls
- Rate limiting: 900ms default delay between batches

### Safe AI Fallbacks
- `geminiService.ts` catches all AI errors and returns default `AIAnalysisResult` (trigger=false, score=0)
- **Preserve this fallback** — prevents UI breakage when API key missing, network fails, or API changes

### Signal Linking
`leadManager.ts` links secondary signals (zoning cases, utility hookups, licensing, incentives) to primary permits by address:
- Match by normalized address string
- Boost `leadScore` on matched leads (+10 points)
- Create new leads only for exceptionally strong standalone signals

---

## 🧪 Developer Workflows

**Setup:**
```bash
npm install
cp .env.local.example .env.local  # Set VITE_GEMINI_API_KEY
```

**Running:**
- Frontend: `npm run dev` (http://localhost:5173)
- Backend: `npm run dev:api` (http://localhost:3001)
- Both: `npm run dev:full`

**Testing:**
- Unit: `npm test` (Vitest)
- Unit UI: `npm run test:ui`
- E2E: `npm run test:e2e`
- Integration: `npm run test:integration`
- Coverage: `npm run test:coverage`
- Diagnostics: Open app → click "Diagnostic Panel" (runs `tests/testSuite.ts` in-browser)

**Building:**
- `npm run build` → `dist/`
- `npm run preview` — local preview of build

---

## 🔌 Integration Points & Dependencies

| Dependency | Used By | Config |
|------------|---------|--------|
| `@google/genai` | `geminiService.ts` | `VITE_GEMINI_API_KEY` in `.env.local` |
| `firebase` | `firebase.ts`, `firebaseLeads.ts` | Firestore project ID, auth domain in env |
| `leaflet` + `react-leaflet` | `PermitMap.tsx`, `HotspotMap.tsx` | No special config; CSS in `index.css` |
| `xlsx` | `services/ingestion/plano.ts` | May fail in browser (CORS); tests mock it |
| TX Comptroller API | `services/enrichment/comptroller.ts` | Rate-limited; watch for 403 errors |
| Recharts | `components/charts/*` | Simple charting, no config needed |

---

## 🚀 Editing Guidelines

1. **Adding a new city connector:**
   - Create `services/ingestion/{city}.ts` with `fetch{City}Permits()` export
   - Register in `leadManager.ts` pipeline (import + call in main flow)
   - Define city in `City` union in `types.ts` if new

2. **Changing AI analysis schema:**
   - Edit `analysisSchema` JSON schema in `services/gemini/schema.ts`
   - Add fields to `AIAnalysisResult` in `types.ts`
   - Update `mapGeminiResponse()` in `responseMapper.ts` to extract & map fields
   - Test via DiagnosticPanel (click permit card → "AI Analysis" → debug output)

3. **Quality filter adjustments:**
   - Thresholds in `services/qualityFilter.ts` (look for `const` definitions at top)
   - Stage-specific recency windows calibrated per permit type (PRE_PERMIT: 60 days, PERMIT_ISSUED: 30 days, etc.)
   - Tests in `tests/unit/services/qualityFilter.test.ts` (marked with TODO for calibration notes)

4. **Debugging AI analysis:**
   - Check browser console for retry logs (exponential backoff: 500ms → 1.5s → 4.5s)
   - Fallback result logged as `"Analysis failed or API error."`
   - Gemini response parsed in `responseMapper.ts` — add console.log(raw) to debug shape

---

## 📍 Search Tokens for Quick Navigation

- `isCommercialTrigger` / `confidenceScore` — schema mapping examples
- `finishoutnow_geocache_v1` — localStorage geocode cache key
- `analysisSchema` / `systemInstruction` — Gemini AI rules
- `mapStageFromStatus()` — permit status → project stage mapping
- `linkSignalsToLeads()` — secondary signal linking logic
- `evaluateHighQuality()` — quality filter decision tree
- `geocodingService.geocodeBatch()` — batch geocoding entry point
- `services/ingestion/` — all city-specific permit fetchers

---

## ⚠️ Known Limitations & TODOs

- **`services/integrationExample.ts`:** 400+ line example pipeline; refactor into actual orchestrators before production use
- **Type safety in ingestion:** Heavy use of `any` type casting when parsing external APIs; add proper interfaces
- **Client-side geocoding:** Blocks UI during batch processing; consider moving to backend worker in Phase 2
- **Test location:** `services/tests/signalConnectors.test.ts` should move to `tests/__tests__/`
- **Mock data:** `services/mockData.ts` kept for demos; remove before full production rollout

---

## 💬 Questions?

Refer to `docs/GETTING_STARTED.md` for deeper context, or `docs/README.md` for full architecture docs.
