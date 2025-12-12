# FinishOutNow - Phase 1 Immediate Actions
**Created:** December 10, 2025  
**Status:** Ready for AI Agent Execution  
**Priority:** Critical Path Items First

---

## Overview

This todo list bridges the comprehensive ALSE implementation plan with the current FinishOutNow frontend architecture. Focus is on fixing broken sources, adding high-value data connectors, and improving lead quality within the existing React+Vite+TypeScript stack.

---

## PHASE 1A: Fix Broken Data Sources (Week 1)

### 1.1 Fix TABC Liquor Licenses Connector ❌ → ✅
**Priority:** HIGH  
**Current Status:** 400 error (query syntax issue)  
**Location:** `services/ingestion/` (new file needed)

**[AI] Tasks:**
- [x] Create `services/ingestion/tabc.ts`
- [x] Implement Socrata connector for dataset `naix-2893`
- [x] Fix numeric query syntax: `obligation_end_date_yyyymmdd > 20250101` (NO quotes)
- [x] Filter: Commercial license types (MB, BG, etc.) via keyword matching
- [x] Return fields: business_name, premise_address, premise_city, license_type, obligation_end_date
- [x] Implement pagination with `$limit` (500 records)
- [x] Add to `services/leadManager.ts` orchestration
- [ ] Test with Fort Worth and Dallas filters (in progress)

**[Human] Tasks:**
- [ ] Verify Socrata App Token is valid for Texas Open Data
- [ ] Review first 20 TABC records for data quality

**Success Criteria:**
- Returns 50+ active liquor license applications from last 90 days
- No 400 errors
- Data normalizes to standard Lead format

---

### 1.2 Debug Arlington Connector (CORS Issue)
**Priority:** MEDIUM  
**Current Status:** CORS blocked in browser
**Location:** `services/ingestion/arlington.ts` (may exist as mock)

**[AI] Tasks:**
- [ ] Investigate current Arlington implementation
- [ ] Option A: Implement backend proxy endpoint at `/api/proxy/arlington`
- [ ] Option B: Use ArcGIS token authentication if available
- [ ] Option C: Configure proper CORS headers on Vercel serverless function
- [ ] Target endpoint: Arlington Permit Applications FeatureServer
- [ ] Filter: `STATUSDESC IN ('Application Incomplete', 'In Review', 'Resubmittal Required')`
- [ ] Implement "Golden Hour" filtering (permits filed within 24-48 hours)

**[Human] Tasks:**
- [ ] Decide on proxy vs serverless approach based on Vercel limits
- [ ] Test Arlington endpoint accessibility

**Success Criteria:**
- Arlington connector returns 10+ permits without CORS errors
- "Golden Hour" leads show up within 1 hour of filing

---

### 1.3 Fix Plano Data Source (Currently Mock)
**Priority:** HIGH  
**Current Status:** Returns 2 mock permits
**Location:** `services/ingestion/plano.ts`

**[AI] Tasks:**
- [x] Research Plano Open Data portal for real API endpoints
- [x] Check for Socrata, ArcGIS, or other structured API
- [x] Implement multi-source attempt strategy (ArcGIS, Energov, Socrata)
- [x] Add proper error handling with fallback to mock
- [x] Normalize fields to standard Lead schema
- [x] Add geocoding support (handled by leadManager)
- [x] Improve mock data labeling for clarity
- [ ] Replace mock implementation when Human provides real endpoint

**[Human] Tasks:**
- [ ] Provide Plano permit portal URLs or Excel report links
- [ ] Confirm if login/authentication is required

**Success Criteria:**
- Real Plano permits flowing (target: 15-30/day)
- Mock data removed
- Proper address normalization

---

### 1.4 Fix Irving Permits (Returns 0 Results)
**Priority:** MEDIUM  
**Current Status:** Wrong endpoint or query
**Location:** Create `services/ingestion/irving.ts`

**[AI] Tasks:**
- [ ] Research Irving Open Data or city portal
- [ ] Test potential endpoints:
  - ArcGIS FeatureServer (common for DFW cities)
  - City of Irving building permits portal
  - Socrata open data
- [ ] Implement working connector with proper query filters
- [ ] Add to leadManager orchestration

**[Human] Tasks:**
- [ ] Confirm Irving has public permit data
- [ ] Provide any known portal URLs

**Success Criteria:**
- Irving connector returns 5+ permits/day
- Integrated into main lead pipeline

---

## PHASE 1B: Add High-Value Creative Signals (Week 2)

### 2.1 Implement Certificate of Occupancy (CO) Pipeline
**Priority:** HIGH  
**Business Value:** Early tenant turnover signals
**Location:** Create `services/ingestion/dallas_co.ts`

**[AI] Tasks:**
- [ ] Identify Dallas CO dataset on Socrata (may be `9qet-qt9e` or search for "Certificate of Occupancy")
- [ ] Implement connector with filters:
  - `land_use IN ('OFFICE', 'RETAIL', 'RESTAURANT', 'MEDICAL')`
  - Status includes "Clean & Show CO"
- [ ] Tag as `LeadType.TENANT_TURNOVER`
- [ ] Create separate CO category in UI
- [ ] Add "Days Since CO" field to lead scoring

**[Human] Tasks:**
- [ ] Verify CO dataset ID on Dallas Open Data portal
- [ ] Review first 50 CO leads for relevance

**Success Criteria:**
- 20+ CO leads per week
- Distinct from regular permits in UI
- Score boost for recent COs (<30 days)

---

### 2.2 Add Dallas Food Inspections (New Business Indicator)
**Priority:** MEDIUM  
**Current Status:** 404 error (dataset `5zpr-tnby` moved/renamed)
**Location:** Create `services/ingestion/food_inspections.ts`

**[AI] Tasks:**
- [ ] Search Dallas Open Data for current food inspections dataset
- [ ] Alternative: Scrape Dallas Health Dept inspection portal
  - Use Playwright/Puppeteer if needed
  - Filter: "Last 7 days" or "New establishments"
- [ ] Cross-reference addresses with existing permits
- [ ] Flag as "New Restaurant/Food Service" signal
- [ ] Add to lead enrichment (not primary source)

**[Human] Tasks:**
- [ ] Confirm if food inspections are valuable lead signal
- [ ] Provide alternate data source if available

**Success Criteria:**
- Enriches 10-15 existing leads per week with food inspection status
- Helps identify restaurant build-outs

---

### 2.3 Implement Zoning Cases (Pre-Permit Signal)
**Priority:** HIGH  
**Business Value:** 6-18 month lead time before permits
**Location:** Create `services/ingestion/zoning.ts`

**[AI] Tasks:**
- [ ] Implement connector to Legistar API:
  - Base URL: `https://webapi.legistar.com/v1/dallas/Matters`
  - Filter: `MatterType = 'Zoning Case'` AND `MatterDate > [90 days ago]`
- [ ] Extract: Case number, address, description, proposed use, status
- [ ] Store attachment/PDF URLs for future LLM enrichment
- [ ] Tag as `LeadType.PRE_PERMIT_ZONING`
- [ ] Add "Estimated Permit Date" field (+6-12 months from filing)

**[Human] Tasks:**
- [ ] Review first 10 zoning cases for quality
- [ ] Confirm scoring weight for pre-permit signals

**Success Criteria:**
- 5-10 zoning cases ingested per week
- Visible in separate "Early Stage Leads" section
- Future PDF enrichment path ready

---

## PHASE 1C: Improve Current Connectors (Week 3)

### 3.1 Enhance Dallas Connector (e7gq-4sah)
**Priority:** MEDIUM  
**Current Status:** Working but limited fields
**Location:** `services/ingestion/dallas.ts`

**[AI] Tasks:**
- [ ] Audit current field mapping
- [ ] Add missing fields if available:
  - `contractor_name`, `contractor_phone`
  - `permit_subtype` (for better categorization)
  - `project_description` or `work_description`
  - `square_footage` (if available)
- [ ] Implement better permit type classification:
  - Current: Simple string matching
  - Improved: Multi-field logic (type + subtype + description)
- [ ] Add valuation normalization:
  - Handle null/zero valuations
  - Flag suspiciously low valuations
- [ ] Improve date parsing (handle multiple date formats)

**Success Criteria:**
- 30% more fields captured per permit
- Better lead type classification accuracy
- Reduced "Unknown" category leads

---

### 3.2 Optimize Fort Worth Connector Performance
**Priority:** LOW  
**Current Status:** Working but may hit rate limits
**Location:** `services/ingestion/fortworth.ts`

**[AI] Tasks:**
- [ ] Implement ObjectID-based pagination (currently may use offset)
- [ ] Add `returnGeometry: false` to reduce payload size
- [ ] Implement incremental fetch:
  - Store `lastMaxObjectId` in localStorage or DB
  - Only fetch records where `OBJECTID > lastMaxObjectId`
- [ ] Add retry logic with exponential backoff
- [ ] Optimize query filters:
  - Pre-filter by date server-side: `ISSUE_DATE > [date]`
  - Exclude finaled/expired permits in query, not post-fetch

**Success Criteria:**
- 50% faster fetch times
- No rate limit errors
- Handles network failures gracefully

---

### 3.3 Add Lead Deduplication & Merge Logic
**Priority:** HIGH  
**Location:** `services/leadManager.ts`

**[AI] Tasks:**
- [x] Implement fuzzy address matching:
  - Normalize addresses (remove suite/unit, standardize abbreviations)
  - Use Levenshtein distance for near-matches
  - Geocode and compare lat/lng (within 50m = same property)
- [x] Merge duplicate leads:
  - Keep highest valuation
  - Combine signals (permit + CO + zoning = multi-signal lead)
  - Preserve all source references
- [x] Add deduplication service with statistics tracking
- [x] Create "Multi-Signal Leads" badge capability
- [x] Integrate into leadManager.fetchAllLeads pipeline

**Success Criteria:**
- Reduces duplicate leads by 40%+
- Multi-signal leads get score boost (+15 points)
- Console logs show deduplication statistics
- UI can show consolidated view of related permits

---

## PHASE 1D: Quality & Testing (Week 4)

### 4.1 Implement Diagnostic Tests for New Connectors
**Priority:** HIGH  
**Location:** `tests/testSuite.ts`

**[AI] Tasks:**
- [ ] Add test cases for each new connector:
  - TABC: Verify query syntax, record count > 0, required fields present
  - Arlington: Test proxy/CORS solution
  - Plano: Validate real data vs mock
  - Irving: Check endpoint connectivity
  - CO Pipeline: Validate land_use filtering
  - Zoning: Test Legistar API response
- [ ] Add data quality checks:
  - Address completeness (city, state, zip)
  - Valuation reasonableness ($1K - $50M range)
  - Date validity (not future dates, not >5 years old)
  - Required fields not null
- [ ] Update DiagnosticPanel to show new connector health

**Success Criteria:**
- All connectors have passing tests
- Diagnostic panel shows green status for each source
- Failed records route to DLQ (dead letter queue)

---

### 4.2 Improve Lead Scoring Model
**Priority:** MEDIUM  
**Location:** `services/geminiService.ts` and `services/leadManager.ts`

**[AI] Tasks:**
- [ ] Enhance scoring factors:
  - **Recency:** Stronger decay curve (50% weight at 30 days, 25% at 60 days)
  - **Multi-Signal Bonus:** +20 points if lead has permit + CO, +30 if permit + zoning
  - **Valuation Tiers:** 
    - <$50K: Base score cap at 60
    - $50K-$250K: Base score 70-85
    - $250K-$1M: Base score 85-95
    - >$1M: Base score 95-100
  - **Lead Type Weights:**
    - NEW_CONSTRUCTION: 1.0x
    - COMMERCIAL_REMODEL: 0.9x
    - TENANT_TURNOVER: 0.8x
    - PRE_PERMIT_ZONING: 0.7x (long sales cycle)
  - **Contractor Verification:** +10 if entity resolved with active TIN
- [ ] Add score explanation in UI tooltip
- [ ] Log score components for debugging

**Success Criteria:**
- Higher-quality leads surface first
- Reduced "noise" leads (<50 score)
- User can understand why a lead scored X

---

### 4.3 Add Error Handling & Monitoring
**Priority:** HIGH  
**Location:** `services/leadManager.ts` and new `services/monitoring.ts`

**[AI] Tasks:**
- [ ] Implement connector error tracking:
  - Log failed fetches with error details
  - Track success rate per connector (last 7 days)
  - Alert if success rate drops below 80%
- [ ] Add performance metrics:
  - Fetch duration per connector
  - Record count per fetch
  - Cache hit rate (geocoding)
- [ ] Create monitoring dashboard view:
  - Show in DiagnosticPanel or separate tab
  - Display: Last run time, records fetched, errors, avg response time
- [ ] Implement graceful degradation:
  - If Dallas fails, still show Fort Worth leads
  - Cache last successful results (1 hour TTL)

**Success Criteria:**
- System continues working if 1-2 sources fail
- Errors are visible and actionable
- Performance metrics baseline established

---

## PHASE 1E: User Experience Improvements (Parallel to Above)

### 5.1 Add "Creative Signals" Section to UI
**Priority:** MEDIUM  
**Location:** `components/` (new component needed)

**[AI] Tasks:**
- [ ] Create `components/CreativeSignalsPanel.tsx`
- [ ] Separate lead categories:
  - **Core Permits:** Regular permits (Dallas, Fort Worth, etc.)
  - **Tenant Turnover:** CO leads
  - **Pre-Permit:** Zoning cases
  - **Licensing Signals:** TABC licenses
  - **Early Detection:** Arlington "golden hour" leads
- [ ] Add visual indicators:
  - 🚀 for "golden hour" leads (<24h old)
  - 🔄 for tenant turnover
  - 📋 for pre-permit/zoning
  - 🍺 for TABC/licensing
- [ ] Allow filtering by signal type
- [ ] Show multi-signal badges

**Success Criteria:**
- Users can easily find high-priority signal types
- Visual hierarchy matches lead value
- Multi-signal leads stand out

---

### 5.2 Improve Lead Detail View
**Priority:** LOW  
**Location:** `components/AnalysisModal.tsx`

**[AI] Tasks:**
- [ ] Add "Data Source" section showing:
  - Which connector(s) provided this lead
  - Original permit/case number with link to source
  - Last updated timestamp
- [ ] Add "Related Signals" section:
  - If permit has matching CO → show CO date and status
  - If permit has zoning case → show zoning details
  - If address has TABC license → show license type and date
- [ ] Add "Address Intelligence":
  - Google Maps link
  - Property type (if available from geocoding)
  - Nearby similar projects (within 1 mile)
- [ ] Improve AI analysis display:
  - Show confidence score breakdown
  - Highlight key trigger phrases

**Success Criteria:**
- User sees full context for each lead in one view
- Easy to verify lead quality
- External links work correctly

---

## Implementation Priorities (Week-by-Week)

**Week 1 Focus:**
1. Fix TABC connector (highest business value)
2. Fix Plano data source (currently useless mock)
3. Add lead deduplication (quality improvement)
4. Add connector diagnostic tests

**Week 2 Focus:**
1. Implement CO pipeline (tenant turnover signal)
2. Add zoning cases connector (early-stage leads)
3. Enhance Dallas connector field mapping
4. Improve lead scoring model

**Week 3 Focus:**
1. Fix Arlington CORS issue
2. Fix Irving connector
3. Optimize Fort Worth performance
4. Add error monitoring dashboard

**Week 4 Focus:**
1. Add Creative Signals UI panel
2. Improve Lead Detail view
3. Add food inspections enrichment
4. Final testing and validation

---

## Human Checkpoints

**End of Week 1:**
- [ ] Review TABC data quality (20 records sample)
- [ ] Confirm Plano portal URLs and access method
- [ ] Approve lead deduplication logic on test dataset

**End of Week 2:**
- [ ] Validate CO leads are relevant (not just routine inspections)
- [ ] Review zoning case usefulness (are 6+ month lead times valuable?)
- [ ] Approve new scoring weights

**End of Week 3:**
- [ ] Verify Arlington solution (proxy vs alternatives)
- [ ] Review monitoring dashboard and set alert thresholds
- [ ] Test error scenarios (what happens if Dallas API is down?)

**End of Week 4:**
- [ ] UAT on Creative Signals UI
- [ ] Review lead quality improvements vs baseline
- [ ] Go/no-go decision for Phase 2 (entity resolution, geospatial)

---

## Success Metrics (Phase 1 Goals)

**Quantitative:**
- [ ] Increase total leads from **40/day** to **80-100/day** (2-2.5x)
- [ ] Add **3-4 new data sources** (TABC, CO, Zoning, fixed Plano/Arlington)
- [ ] Reduce duplicates by **40%+**
- [ ] Improve lead score accuracy (20% fewer low-quality leads flagged by users)
- [ ] Achieve **90%+ connector uptime** (measured over 7 days)

**Qualitative:**
- [ ] Users can find "golden hour" leads within 1 hour of filing
- [ ] Multi-signal leads are clearly identified and prioritized
- [ ] System degrades gracefully when individual sources fail
- [ ] Lead detail view provides enough context to qualify without external research

---

## Next Phase Preview (Phase 2 - Not Started Yet)

After Phase 1 is complete and validated:
- **Entity Resolution:** Contractor matching, FTAS integration
- **Advanced Geospatial:** Parcel overlay, TIF district mapping, hotspot detection
- **LLM Enrichment:** PDF parsing for zoning cases, project descriptions
- **Economic Incentives:** Chapter 380 agreements scraping
- **Predictive Scoring:** ML model for project start date prediction

---

## Notes for AI Agent

- **Existing Code Patterns:** Follow patterns in current `services/ingestion/*.ts` files
- **Type Safety:** Use TypeScript interfaces from `types.ts`, extend `Lead` type as needed
- **Error Handling:** Use try-catch with fallback, never crash the entire pipeline
- **Testing:** Run DiagnosticPanel after each connector addition
- **Incremental:** Make one change at a time, test, then proceed
- **Cache-Aware:** Use `localStorage` geocache, don't abuse external APIs
- **Rate Limits:** Respect Socrata (1000 req/day), Nominatim (1 req/sec), Comptroller (unknown, be conservative)

---

**END OF PHASE 1 TODO LIST**

This is your actionable roadmap. Start with Week 1 priorities and check off items as you complete them. Update this document with status and blockers as you progress.
