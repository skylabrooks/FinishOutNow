# Copilot Instructions — FinishOutNow

Purpose: short, practical guide to make an AI coding agent productive in this repo.

Big picture
- Frontend: React + Vite. Entry points: `index.tsx` and `App.tsx`.
- Data flow: city-specific ingestion connectors live under `services/ingestion/*` → normalized/enriched by `services/leadManager.ts` → analyzed by `services/geminiService.ts` → surfaced in UI (`components/*`).

Key files (what to edit and why)
- `services/leadManager.ts`: central orchestrator — run and combine ingestion, dedupe, geocode (client-side), and call enrichers.
- `services/geminiService.ts`: AI layer. Contains `analysisSchema`, `systemInstruction` ("Vibe Coding" rules), and the snake_case → camelCase mapping. When changing prompts, update `analysisSchema` and the mapping together.
- `components/AnalysisModal.tsx` & `components/DiagnosticPanel.tsx`: examples of how AI results are rendered and how diagnostics/tests are invoked (`tests/testSuite.ts`).
- `services/enrichment/comptroller.ts`: external enrichment (TX Comptroller) — watch rate limits and CORS.

Project-specific conventions
- "Vibe Coding": deterministic prompt rules in `services/geminiService.ts` define positive/negative signals (e.g., "Tenant Improvement", "Access Control", "Certificate of Occupancy"). Code relies on those rules to set `is_commercial_trigger`.
- Schema-first: Gemini responses are validated against `analysisSchema`. Any schema change must be mirrored in the code that maps the JSON to `AIAnalysisResult`.
- Snake_case → camelCase mapping: search for `is_commercial_trigger` and `confidence_score` in `services/geminiService.ts` to see the exact mapping pattern.
- Client-only geocoding: `leadManager` uses `localStorage` cache key `finishoutnow_geocache_v1` to avoid repeated lookups.
- Safe fallback: AI errors return a default `AIAnalysisResult` (see catch block in `services/geminiService.ts`) — preserve this to avoid UI breakage.

Developer workflows (commands and env)
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build` and `npm run preview`
- Tests/diagnostics: open app and use the `DiagnosticPanel` which runs `tests/testSuite.ts` diagnostics.
- Environment: `services/geminiService.ts` uses `process.env.API_KEY` for Gemini — create `.env.local` with `API_KEY=<your-key>`.

Integration points & dependencies
- `@google/genai` (Gemini) — configured in `services/geminiService.ts`.
- `xlsx` (used by `services/ingestion/plano.ts`) — Excel parsing may be mocked for CORS reasons in the browser.
- TX Comptroller API — used by `services/enrichment/comptroller.ts` for entity enrichment.
- MCP servers: see `MCP_INSTRUCTIONS.md` for recommended MCP entries (if you run local Gemini MCP agents).

Editing guidelines for agents
- When editing prompts or `analysisSchema`, always: (1) update `analysisSchema`, (2) update the parsing/mapping code in `services/geminiService.ts`, and (3) run the DiagnosticPanel/test suite.
- Preserve the fallback in `geminiService.ts` to avoid breaking the UI if the API/key/network fails.
- Keep ingestion connectors city-specific and additive — add new city connectors under `services/ingestion/` and register them in `leadManager.ts`.

Quick pointers (search tokens)
- `is_commercial_trigger`, `confidence_score` — schema fields and mapping examples.
- `finishoutnow_geocache_v1` — localStorage geocode cache key.
- `analysisSchema` and `systemInstruction` — in `services/geminiService.ts`.

If anything here is unclear or you'd like me to expand examples (e.g., a starter ingestion connector template or a small jq helper), tell me which part to expand.
