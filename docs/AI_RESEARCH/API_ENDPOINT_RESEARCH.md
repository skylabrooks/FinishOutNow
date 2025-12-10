# API Endpoint Research & Lead Procurement Strategy
**Status:** Production Research Document for Gemini Pro 3  
**Date:** December 9, 2025  
**Objective:** Identify all working data sources and implement competitive advantage in lead quality and exclusivity

---

## Executive Summary

FinishOutNow needs comprehensive access to commercial permit and construction activity data across DFW metro to identify high-value leads before competitors. Current implementation reaches **40 permits/day** but misses critical signals.  Find other sources outside the ones sourced in already as well. This document maps all available APIs, web scraping targets, and data fusion strategies to achieve **500+ exclusive high-quality leads/week**.

---

## 1. CURRENT STATUS & GAPS

### Working Sources (Verified ✅)
- **Dallas Open Data** (e7gq-4sah.json) - ✅ 20+ permits/day
- **Fort Worth ArcGIS** - ✅ 20+ permits/day  
- **Plano Mock Data** - 2 permits/session (need real source)
- **Arlington Mock Data** - 1 permit/session (need real source)

### Broken/Unavailable (❌)
- **TABC Liquor Licenses** (data.texas.gov) - 400 error (query syntax)
- **Dallas Food Inspections** (5zpr-tnby) - 404 (endpoint changed)
- **Eviction Lab CSV** - No longer public
- **Arlington Zoning Cases** (ArcGIS) - CORS blocked
- **Irving Permits** - Returns 0 results (wrong endpoint)
- **Texas Comptroller** - Requires scraping
- **Utility Connections** - No direct API

---

## 2. PRIMARY DATA SOURCES TO UNLOCK

### 2.1 Dallas
**Current:** Dallas Open Data e7gq-4sah.json (20 permits/API call)  
**Gaps:** Only captures ~30% of commercial activity

#### A. Alternative Dallas Datasets
```
Dataset: Building Permits (Enhanced)
ID: 9qet-qt9e (was CO-specific, may have moved)
Alternative: Search Dallas Open Data for:
  - "Building Permits" 
  - "Development Permits"
  - "Commercial Construction"
  - "Certificate of Occupancy"
Research: https://www.dallasopendata.com/

Hidden Signals:
  - Address Change Records (business relocations)
  - Electrical/HVAC Permits (indicate upfit activity)
  - Tenant Improvement Records
  
API Field Mapping (once found):
  - permit_no / id
  - issue_date / issued_date / created_date
  - address / location
  - valuation / estimated_cost / project_value
  - permit_type / work_description / purpose
  - applicant_name / contractor / business_name
  - status / stage / phase
```

#### B. Dallas County Appraisal District (DCAD)
```
Source: https://www.dallascad.org/
Data: Property valuations, ownership changes, commercial classifications
Scraping Target: 
  - Property tax records (public)
  - Commercial property valuations
  - Recent purchases (30-60 days old = renovation candidates)
Rate Limit: Use rotating IPs, 2-3 req/sec
Frequency: Daily scrape overnight
```

#### C. City of Dallas Permitting Portal (Web Scrape)
```
URL: https://dallascityhall.com/business/Pages/Permits.aspx
or: Dallas Business Portal / Online Permit Search
Target Data:
  - Pending permits (earlier signal than issued)
  - Permit history by contractor
  - Project value trends
Scraping Method: 
  - Selenium with headless browser
  - Parse HTML tables
  - Extract address + contractor + estimated cost
Frequency: Hourly (catch new submissions)
Exclusivity: 4-6 hour head start on competitors
```

#### D. Dallas Council & Economic Development Agenda
```
URL: https://www.dallas.gov/about_dallas/agendas_and_minutes
Target: 
  - Economic development initiatives
  - Tax increment reinvestment zones (TIRZs)
  - Urban development areas
  - Council district development priorities
Signal: Districts flagged as "growth priority" → higher development density
Frequency: Weekly check on city council agenda
Value: Predictive lead sourcing (PRE-permit filing)
```

---

### 2.2 Fort Worth
**Current:** Fort Worth ArcGIS (20 permits/API call)  
**Gaps:** Arlington, Irving, Plano, Frisco need dedicated endpoints

#### A. Fort Worth Building Permits API (Verify Endpoint)
```
Current Endpoint: 
https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/CFW_Open_Data_Development_Permits_View/FeatureServer/0/query

Known Parameters:
  - where: Filter expression (SQL-like)
  - outFields: List of fields to return
  - f: json
  - returnGeometry: false (faster)
  - resultRecordCount: 100-2000

Query Optimization:
  - Filter by permit_type IN ('Commercial Remodel', 'New Building', 'CO')
  - Filter by issue_date > [60 days ago]
  - Filter by valuation > 50000

Fallback Endpoints (if main changes):
  1. https://services.arcgis.com/*/rest/services/*/FeatureServer
  2. Search Fort Worth Open Data portal
  3. City of Fort Worth Building Services portal (web scrape)
```

#### B. Fort Worth Building Services Portal
```
URL: https://fortworth.permitfinder.com/ (or similar)
or: https://fortworthtexas.gov/
Scraping Target:
  - Active permits
  - Permit holder company info
  - Contractor database
  - Address + scope + cost
```

---

### 2.3 Arlington
**Current:** Mock data (1 permit/session)  
**Target:** Real permits via ArcGIS or scraping

#### A. Arlington GIS Planning Data (Research Correct Endpoint)
```
City Website: https://www.arlingtontx.gov/
GIS Portal: https://gis.arlingtontx.gov/

Potential Endpoints:
  1. Planning & Zoning Cases (ArcGIS Feature Server)
     - Current: /hosting/rest/services/Hosted/Planning_Zoning_Cases/FeatureServer
     - Status: CORS-blocked from browser (needs server proxy)
     - Solution: Add /api/zoning-arlington proxy in dev-server.ts
  
  2. Building Permits (may be separate service)
     - Search: https://gis.arlingtontx.gov/hosting/rest/services
     - Look for "Building", "Development", "Permits" service
  
  3. Certificates of Occupancy
     - May be under "Development" or "Inspections"

Server Proxy Setup:
  File: api/dev-server.ts
  Route: /api/zoning-arlington
  Handler: Forward to Arlington ArcGIS with CORS headers
  Cache: 24 hours (unlikely to change intraday)
```

#### B. Arlington Building Permits Web Portal
```
URL: Search for "Arlington TX Building Permits Online"
or: https://www.arlingtontx.gov/business/development-services
Scraping:
  - Active permits by address
  - Contractor/applicant names
  - Permit values
  - Issue dates
```

---

### 2.4 Irving
**Current:** ArcGIS returns 0 results (wrong query or endpoint)

#### A. Irving GIS/Building Services
```
City Website: https://www.cityofirving.org/
Development Services: https://www.cityofirving.org/about/departments/development-services

Known Issues:
  - Current endpoint may not exist or query params wrong
  - Try: https://services.arcgis.com/*/rest/services/*/FeatureServer
  - Search city website for "Online Permits" or "Building Permits"

Alternative Approach:
  1. Direct web scrape of Irving permit portal
  2. Email city GIS dept for public API documentation
  3. FOIA request for permit data (legal but slow)
  4. Use county appraisal district data + cross-reference
```

---

### 2.5 Plano
**Current:** Mock data (2 permits/session)

#### A. Plano Open Data / GIS
```
City Website: https://www.plano.gov/
Plano GIS: https://gis.plano.gov/ (or similar)

Known: Plano has interactive permit map (per research)
Source: https://share.plano.gov/ (may have public API)

Data Points:
  - Building permits
  - Development reviews
  - Zoning cases
  - Commercial activity

Access Methods:
  1. Check Plano Open Data Portal
  2. GIS API endpoint discovery
  3. Web scrape Plano permit portal
```

---

### 2.6 Frisco & Other DFW Cities
```
Secondary Targets (similar tier to Irving/Plano):
  - Frisco Open Data: https://www.frisco.tx.us/
  - Lewisville: https://www.cityoflewisville.com/
  - Garland: https://www.ci.garland.tx.us/
  - Carrollton: https://www.cityofcarrollton.com/
  - Coppell: https://www.coppelltxgov.com/

Strategy: 
  - Check each city website for "Open Data" or "GIS Portal"
  - Look for ArcGIS FeatureServer endpoints
  - If not available, implement web scraping
```

---

## 3. SECONDARY SIGNALS (High-Value Indicators)

### 3.1 TABC Liquor Licenses (MUST FIX)
**Current Error:** 400 Bad Request on query  
**Status:** This is a high-value lead source (bars, restaurants, breweries)

#### A. Fix Query Syntax
```
Problem: obligation_end_date_yyyymmdd > '${dateFilter}'
         (string comparison on numeric field)

Solution:
  - Change to numeric comparison: > ${dateFilter} (no quotes)
  - Ensure dateFilter is numeric YYYYMMDD format: 20251209
  - Test with curl:
    curl "https://data.texas.gov/resource/naix-2893.json?$limit=10&$where=(city='DALLAS')%20AND%20obligation_end_date_yyyymmdd%3E20240101"

Alternative Approach:
  - Use Socrata API docs: https://dev.socrata.com/
  - May need app token for higher rate limits
  - Request from: https://opendata.texas.gov/
```

#### B. TABC Direct Database
```
Source: https://www.tabc.texas.gov/
Alternative: Texas Alcoholic Beverage Commission database
Data: All active licenses by city
Access:
  1. Check if TABC has downloadable CSV/API
  2. If not, web scrape license lookup by city
  3. Scheduled daily scrape (licenses update monthly)
  
Lead Value: 
  - New license = New business = Need for buildout/permits
  - Renewal near expiration = Business might relocate
  - Multi-location operators = Chain expansion opportunities
```

---

### 3.2 Dallas Food Inspections (Find Correct Endpoint)
**Current:** 404 on dataset 5zpr-tnby

#### A. Search Dallas Open Data
```
URL: https://www.dallasopendata.com/
Search Terms:
  - "Food Inspections"
  - "Restaurant Inspections"
  - "Health Permits"
  - "Food Service"

Find: Correct dataset ID
Once Found: Query recent "initial inspection" or "pre-opening"
Value: Pre-opening restaurants = Future construction/buildout
```

#### B. Dallas County Health Department
```
Source: https://www.dallascountyhhs.org/
Alternative: Food service permit records
Access: FOIA if not public, or web scrape
```

---

### 3.3 Utility Connections (Proxy Signal)
**Current:** Using building permits as proxy (incomplete)

#### A. Electric Utility - Oncor
```
Service: https://www.oncor.com/
Data: New commercial meter connections
Access:
  1. Check if Oncor publishes new connections
  2. Contact Oncor for B2B API access
  3. Web scrape if available (unlikely)

Alternative: Use CO/permit records as proxy (current approach)
```

#### B. Water & Sewer - City of Dallas
```
Source: https://www.dallaswater.org/
Data: New commercial meter installations
Access: Contact utility directly for business data
Frequency: Can request weekly/monthly reports
```

---

### 3.4 Zoning & Land Use Cases (CORS-Blocked, Needs Proxy)

#### A. Arlington Zoning Cases (FIX IMPLEMENTATION)
```
Current Issue: CORS blocks direct browser access

Solution: Implement Server-Side Proxy
File: api/dev-server.ts
Route: /api/zoning-arlington

Handler Code Pattern:
  async function handleArlingtonZoning(req, res) {
    const params = new URLSearchParams({
      where: `DateFiled > ${timestamp}`,
      outFields: 'CaseNumber,Address,DateFiled,CaseDescription,CaseType,Status',
      f: 'json',
      returnGeometry: 'false',
      resultRecordCount: '100'
    });
    
    const response = await fetch(
      `https://gis.arlingtontx.gov/hosting/rest/services/Hosted/Planning_Zoning_Cases/FeatureServer/0/query?${params}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    return res.json(await response.json());
  }

Value: Zoning cases 3-6 months BEFORE permits filed
Exclusivity: Extreme (most competitors miss this signal)
```

#### B. Dallas Zoning & Development
```
Source: https://www.dallascityhall.com/business/Pages/Zoning.aspx
Data: Zoning cases, variances, PUDs (Planned Unit Developments)
Access:
  1. Check for API
  2. Web scrape case docket
  3. Council agenda monitoring

Lead Signal: Major PUD = Multi-phase development = Repeat business
```

---

### 3.5 Commercial Real Estate & Vacancy Data

#### A. CoStar / CBRE Data (Paid Service - Fallback)
```
If budget allows:
  - CoStar commercial real estate database
  - CBRE market reports with absorption rates
  - Vacancy & lease-up activity

Free Alternative:
  - Monitor commercial real estate blogs
  - Track major leasing announcements
  - LinkedIn commercial real estate activity
```

#### B. Commercial Mortgage Default Notices (CMBS Distress)
```
Source: County records, public notices
Signal: Distressed properties → restructuring → renovation potential
Access:
  1. County clerk public records
  2. Legal notice aggregators
  3. Commercial property websites
```

---

## 4. WEB SCRAPING ARCHITECTURE

### 4.1 Scraping Targets Priority
```
TIER 1 (Implement First - High Value):
  ✅ Dallas Permit Portal (city website)
  ✅ Fort Worth Permit Portal
  ✅ Arlington GIS (via server proxy)
  ✅ Irving/Plano Permit Portals
  ✅ TABC License Database

TIER 2 (Implement Second):
  ⏳ City Council Agendas (economic dev)
  ⏳ Commercial Real Estate Websites
  ⏳ News Aggregation (construction bids)
  ⏳ Contractor Licensing Databases

TIER 3 (Nice-to-Have):
  • LinkedIn Company Updates
  • Commercial property tax assessments
  • SBA Loan Data (new business indicators)
```

### 4.2 Scraping Tech Stack
```
Framework: Puppeteer (Node.js) or Playwright
  - Headless browser automation
  - JavaScript-heavy sites (SPAs)
  - Rate limiting built-in

Backup: Beautiful Soup (Python)
  - Static HTML scraping
  - Lighter weight
  - Easy deployment

Implementation Pattern:

1. Scraper Class
   class CityPermitScraper {
     constructor(city, url) { }
     async getAllPermits() { }
     async parsePermitCard(element) { }
     async searchByAddress(address) { }
   }

2. Scheduler
   Every 1 hour (Dallas portal)
   Every 4 hours (Fort Worth)
   Every 24 hours (Archived data)
   
3. Storage
   MongoDB: Permit objects + scraped_timestamp
   Dedup: Composite key (address + issue_date + permit_no)
   
4. Alerts
   New permit found → Webhook to leadManager
   High value (>$500k) → Immediate notification
```

### 4.3 Rate Limiting & Ethical Scraping
```
Rules:
  - 2-5 requests per second per domain
  - Rotate User-Agent headers
  - Use rotating residential proxies if blocked
  - Check robots.txt / Terms of Service
  - Implement request caching (6-24 hour TTL)
  
Headers to Rotate:
  - User-Agent (Chrome, Firefox, Safari variants)
  - Accept-Language
  - Accept-Encoding
  - Referer
  
Detection Avoidance:
  - Randomize request timing (100-500ms variance)
  - Limit to off-peak hours (2am-6am)
  - Mix in legitimate user behavior (click delays)
  - Rotate IP every N requests
```

---

## 5. REAL-TIME DATA FUSION STRATEGY

### 5.1 Multi-Source Deduplication
```
Problem: Same project appears in multiple sources
  - Dallas permits + City council agenda + News mention
  - Address variations (123 Main St vs 123 Main Street Suite 100)

Solution: Fuzzy Address Matching
  - Library: fuzzywuzzy / Levenshtein distance
  - Index by lat/long (0.0001 degree tolerance = ~10 meters)
  - Composite match score: address + date proximity + contractor

Implementation:
  async function dedupeAndEnrich(permits) {
    // 1. Normalize addresses (strip suite, standardize)
    // 2. Geocode all permits
    // 3. Group by spatial cluster + date window
    // 4. Flag duplicates + confidence score
    // 5. Merge with contractor/applicant data
    // 6. Rank by composite lead score
  }
```

### 5.2 Composite Lead Scoring
```
Scoring Factors:
  
  Valuation (0-30 pts):
    $50k-$100k: 5 pts
    $100k-$500k: 15 pts
    $500k-$2M: 25 pts
    >$2M: 30 pts
  
  Permit Type (0-25 pts):
    CO (New Building): 25 pts (rare, huge project)
    Commercial Remodel: 20 pts
    TI (Tenant Improvement): 15 pts
    HVAC/Electrical: 10 pts
  
  Industry Signal (0-20 pts):
    Restaurant/Hospitality: 20 pts
    Retail: 15 pts
    Office: 10 pts
    Warehouse: 5 pts
  
  Timing (0-15 pts):
    0-7 days old: 15 pts (fresh = higher conversion)
    8-30 days: 10 pts
    31-60 days: 5 pts
  
  Exclusivity (0-10 pts):
    First signal from scraping: 10 pts
    Sourced from 1 channel: 7 pts
    Sourced from 3+ channels: 5 pts (less exclusive)
  
  Contractor Track Record (0-10 pts):
    Known contractor (repeater): 10 pts
    First-time on radar: 0 pts
  
  Location (0-10 pts):
    Premium districts (downtown, legacy business): 10 pts
    Growth corridors: 8 pts
    Secondary: 5 pts
    
  **TOTAL POSSIBLE: 120 points**
  
  Ranking:
    90-120: Tier 1 (call same day)
    70-89: Tier 2 (call within 48h)
    50-69: Tier 3 (nurture flow)
    <50: Research/archive
```

### 5.3 Gemini Pro Integration
```
Use Case: Intelligent lead enrichment

Prompts to Implement:

1. Project Scope Analysis
   Input: Permit description + address + contractor
   Output: Estimated finish date, likely GC, budget projection
   
2. Contractor Intelligence
   Input: Contractor name + past projects + city
   Output: Company size, repeater patterns, typical project value
   
3. Decision Maker Identification
   Input: Contractor name + address
   Output: Likely business owner, decision makers via LinkedIn scrape
   
4. Market Analysis
   Input: Address + neighborhood + valuation
   Output: Similar projects in area, market trends, likelihood of budget increase
   
5. Follow-up Strategy
   Input: Permit type + contractor + past outcomes
   Output: Optimal contact method, timing, pitch angle

Implementation:
  File: services/geminiService.ts
  Add function: enrichLeadWithGemini(permit, historicalData)
  Cache: Store enrichments (contractor patterns repeat)
  Rate limit: Batch enrichment nightly, prioritize top 100 leads
```

---

## 6. COMPETITIVE ADVANTAGE OPPORTUNITIES

### 6.1 Temporal Edge
```
Current State: Detect permits 1-3 days after filing

Target State: Detect signals 30-60 days PRE-filing
  
Mechanism:
  1. Monitor zoning cases (Arlington): 60-90 days before permits
  2. Track city council agendas: Development priorities
  3. Monitor commercial property transfers: Acquisition = renovation prep
  4. Track TABC license applications: Restaurant/hospitality = buildout
  
Result: 
  - Contact contractor BEFORE they shop for solutions
  - Conversion rate: +40-60% vs. reactive leads
  - Price leverage: Can quote before budget locked
```

### 6.2 Exclusivity
```
Scraping vs. API:
  - Permit data goes live on city portal simultaneously
  - Most competitors use same public APIs
  - Scraping at 1-hour intervals = 1 hour headstart
  - Automated alerting = Same-day contact
  
Data Fusion Advantage:
  - Combine permit + zoning + property transfers + licensing
  - Predict project scope before official announcement
  - Competitors see only permit data
  
Hidden Signals:
  - Contractor license renewals = Expansion indicator
  - Commercial property tax assessment changes = Valuation update
  - City bond measures = Infrastructure-adjacent opportunities
```

### 6.3 Intelligence Depth
```
Add to Lead Card:
  - Contractor track record (projects in past 24 months)
  - Estimated timeline (based on permit type + valuation)
  - Decision maker profile (LinkedIn integration)
  - Past budget patterns (if repeat contractor)
  - Likely use case (based on permit classification + AI analysis)
  - Competitor active in this space (if known)
  - Suggested pitch angle (Gemini-generated)
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1 (Week 1-2): Fix Existing APIs
```
Priority 1.1: TABC Query Fix
  - Fix numeric date comparison
  - Test with 20-50 sample queries
  - Expected: 50-100 liquor licenses/week

Priority 1.2: Find Dallas Food Inspections
  - Search Dallas Open Data for correct endpoint
  - OR: Implement web scraper for health inspections
  - Expected: 30-50 new restaurants/week

Priority 1.3: Arlington Zoning Proxy
  - Implement /api/zoning-arlington proxy
  - Test ArcGIS endpoint
  - Cache 24 hours
  - Expected: 20-30 zoning cases/week
```

### Phase 2 (Week 3-4): Web Scraping
```
Priority 2.1: Dallas Permit Portal Scraper
  - Identify portal URL
  - Implement Puppeteer scraper
  - Hourly schedule
  - Expected: 50-100 additional permits/day (if portal shows unpublished)

Priority 2.2: Fort Worth Scraper (if needed)
  - Verify ArcGIS covers all data
  - Fallback scraper if API insufficient
  - Expected: 20-40 permits/day

Priority 2.3: City Council Agenda Scraper
  - Daily check Dallas/Fort Worth agendas
  - Extract economic development items
  - Feed to lead intelligence
  - Expected: 5-10 predictive signals/week
```

### Phase 3 (Week 5-6): Enrichment & Fusion
```
Priority 3.1: Deduplication Engine
  - Fuzzy address matching
  - Spatial clustering
  - Composite scoring

Priority 3.2: Gemini Enrichment
  - Contractor intelligence
  - Decision maker prediction
  - Timeline estimation
  - Expected lead quality: +50%

Priority 3.3: Real-time Alerting
  - High-value permit detection (<2min after scrape)
  - Automated dialing/email for Tier 1 leads
  - Dashboard updates
```

### Phase 4 (Week 7-8): Optimization
```
Priority 4.1: Performance Tuning
  - Cache optimization
  - DB indexing
  - Scraper efficiency

Priority 4.2: Lead Quality Analysis
  - Conversion rate by source
  - Best timing for contact
  - Refine scoring model

Priority 4.3: Competitive Analysis
  - Monitor what competitors target
  - Identify gaps
  - Expand coverage
```

---

## 8. DATA SOURCES CHECKLIST

### Free/Public APIs (Status Check Required)
```
[ ] Dallas Open Data - e7gq-4sah.json ✅
[ ] Fort Worth ArcGIS ✅
[ ] TABC data.texas.gov (needs query fix)
[ ] Dallas Food Inspections (needs endpoint)
[ ] Arlington Zoning ArcGIS (needs proxy)
[ ] Irving Permits ArcGIS (needs correct endpoint)
[ ] Plano Open Data (needs discovery)
[ ] Texas County Assessor Records (free, searchable)
[ ] City Council Agendas (free, web scrape)
[ ] Commercial property databases (free tier: Zillow, LoopNet)
```

### Paid Services (Optional - Consider Budget)
```
[ ] CoStar Commercial Real Estate Data ($500-2000/mo)
[ ] Dun & Bradstreet Company Intelligence ($200-500/mo)
[ ] Premium IP Rotating Proxy Service ($50-200/mo)
[ ] Building Permits API Aggregator (ConstructionMonitor, etc.) ($300-1000/mo)
```

### Web Scraping Targets (Implementation Priority)
```
[ ] Dallas City Portal (permits page)
[ ] Fort Worth City Portal
[ ] Arlington City GIS
[ ] Irving City Portal
[ ] Plano City Portal
[ ] TABC License Database
[ ] County Tax Assessor Records
[ ] Commercial Real Estate Listing Sites
[ ] News Aggregation (construction bids, new business announcements)
```

---

## 9. SUCCESS METRICS

### Current (Baseline)
- 40 permits/day (Dallas + Fort Worth only)
- 0 zoning signals
- 0 licensing signals
- 0 eviction/vacancy signals
- 2-3 day lag from filing to detection

### Target (Post-Implementation)
- **500-800 leads/week** (8-10x increase)
- **30-60 day pre-filing detection** (zoning/licensing signals)
- **90+ lead score average** (high quality only)
- **<1 hour lag** (automated scraping + alerts)
- **30%+ conversion rate** (vs current ~5-10%)

### Revenue Impact (Estimated)
```
Assumptions:
  - 500 qualified leads/week
  - 30% conversion → 150 jobs/week
  - $5,000 avg job value
  - 35% margin = $1,750/job
  
Annual Revenue:
  150 jobs/week × $1,750/job × 52 weeks = $13.65M
  
Competitive Advantage:
  - Exclusivity: 30% of leads only competitor sees
  - Timing: 40% of leads contacted first
  - Conversion lift: +20% from better intelligence
  
Net Result: $2-4M additional annual revenue
```

---

## 10. TECHNICAL REQUIREMENTS

### Infrastructure
```
Servers:
  - Scraping workers: 2-4 instances (distributed, 1hr/day each)
  - API aggregation: 1 instance
  - Storage: MongoDB (100GB initial, 1GB/week growth)
  - Cache: Redis (geo-distributed permit cache)

Networking:
  - Rotating proxy service (optional, if blocked)
  - VPN for FOIA/legal data access
  - Webhook infrastructure for alerts

Databases:
  - Permits: Indexed by (address, date, contractor, value)
  - Contractors: Indexed by (name, address, frequency)
  - Scores: Real-time aggregation
  - Contact logs: CRM integration
```

### Development
```
Team:
  - Data Engineer (1): Scraping architecture, ETL
  - Backend (1): API aggregation, deduplication
  - Frontend (0.5): Dashboard + alerts
  - DevOps (0.5): Deployment, monitoring

Estimated Effort: 6-8 weeks (1 team)
Maintenance: 20% ongoing (optimization, API changes)
```

---

## 11. NEXT STEPS FOR GEMINI PRO

1. **API Verification**: Test all endpoints listed above
2. **Scraping Analysis**: Evaluate robots.txt and ToS for each target
3. **Query Optimization**: Debug TABC and Food Inspections queries
4. **Endpoint Discovery**: Find correct URLs for missing datasets
5. **Competitive Analysis**: Research competitor data sources
6. **Architecture Design**: Propose optimized data pipeline
7. **Implementation Roadmap**: Detailed sprint plan for phased rollout

---

## 12. REFERENCES & RESEARCH RESOURCES

```
Socrata Open Data:
  - https://dev.socrata.com/
  - Query syntax, rate limits, authentication

ArcGIS REST API:
  - https://developers.arcgis.com/rest/services-reference/query-feature-service/
  - Feature server queries, geometry operations

Commercial Real Estate Data:
  - https://www.zillow.com/research/
  - https://www.costar.com/
  - https://loopnet.com/

Texas Public Records:
  - https://www.texas.gov/business-and-economy/
  - County assessor databases (typically county.tx.us)

Web Scraping Best Practices:
  - https://www.puppeteersharp.dev/
  - https://www.seleniumhq.org/
  - Ethical scraping guidelines

Permit Data Aggregators (Competitive Analysis):
  - ConstructionMonitor.com
  - BuildFax.com
  - BidsandLeads.com
```

---

**End of Document**

---

*This document is designed for Gemini Pro 3 to conduct deep research and identify implementation strategies. Prioritize API discovery and query optimization first, then scale to web scraping for competitive advantage.*
