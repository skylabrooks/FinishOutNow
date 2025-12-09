# FinishOutNow API Endpoints & Data Sources Reference

**Last Updated**: December 8, 2025  
**Purpose**: Comprehensive guide to all public data sources for early commercial lead discovery in Dallas-Fort Worth metroplex

---

## Quick Reference Table

| Signal Type | Primary Source | Cities Covered | Data Format | Auth Required | Implementation Status |
|------------|----------------|----------------|-------------|---------------|---------------------|
| **Building Permits** | City Open Data APIs | All 5 | JSON/CSV (API) | No | ✅ Implemented |
| **Certificates of Occupancy** | Dallas/FW Open Data | Dallas, FW | JSON (API) | No | ✅ Implemented (Utility proxy) |
| **Utility Hookups** | CO data (proxy) | Dallas | JSON (API) | No | ✅ Implemented |
| **Zoning Cases** | Arlington ArcGIS | Arlington only | GeoJSON (API) | No | ⚠️ Endpoint needs verification |
| **Eviction Data** | Eviction Lab CSV | All (county-level) | CSV (download) | No | 🔄 Requires CSV ingestion |
| **Liquor Licenses** | TABC Open Data | Statewide | JSON (API) | No | ✅ Implemented |
| **Health Permits** | Dallas Food Inspections | Dallas only | JSON (API) | No | 🔄 Partially implemented |
| **Fire Alarms** | None available | N/A | N/A | N/A | ❌ No public data |
| **Incentives** | TX Comptroller SB 1340 | Statewide | Web portal (scraping) | No | 🔄 Requires scraping |

---

## 1. Building Permits (Core Data)

### Dallas
- **Source**: Dallas OpenData (Socrata)
- **Endpoint**: `https://www.dallasopendata.com/resource/e7gq-4sah.json`
- **Dataset ID**: `e7gq-4sah`
- **Format**: JSON, CSV (Socrata API)
- **Update Frequency**: Daily
- **Auth**: None required (public)
- **Key Fields**:
  - `permit_type`: Filter for "BU Commercial New", "BU Commercial Alteration"
  - `work_description`: Unstructured text for AI analysis
  - `value`: Declared valuation (often understated)
  - `contractor`: Business name for enrichment
  - `issued_date`: For watermark-based incremental updates
- **Pagination**: Use `$limit`, `$offset`, or `$where=issued_date > 'YYYY-MM-DD'`
- **Status**: ✅ Fully implemented in `services/ingestion/dallas.ts`

### Fort Worth
- **Source**: City of Fort Worth Open Data (ArcGIS/Socrata hybrid)
- **Endpoint**: `https://data.fortworthtexas.gov/resource/qy5k-jz7m.json`
- **Format**: JSON (Socrata), GeoJSON (ArcGIS FeatureServer)
- **Update Frequency**: Hourly
- **Auth**: None required
- **Key Fields**:
  - `Permit_Type` + `Permit_SubType`: Two-level classification
  - `Status`: Filter for 'Applied', 'Issued' (exclude 'Finaled', 'Expired')
  - Schema differs from Dallas—requires normalization
- **Status**: ✅ Fully implemented in `services/ingestion/fortWorth.ts`

### Arlington
- **Source**: Arlington Open Data Portal (ArcGIS Hub)
- **Endpoint**: `https://opendata.arlingtontx.gov` (3-year rolling dataset)
- **Format**: CSV, GeoJSON (ArcGIS REST API)
- **Update Frequency**: Monthly
- **Key Feature**: **Separate "Permit Applications" dataset** (pre-approval leads - "Golden Hour")
- **Fields**:
  - `FOLDERSEQUENCE`: Unique permit ID
  - `STATUSDESC`: "Application Incomplete", "In Review", "Payment Pending"
  - `ConstructionValuationDeclared`: Project value
  - `MainUse` / `LandUseDescription`: For categorization
- **Status**: ✅ Fully implemented in `services/ingestion/arlington.ts`

### Plano
- **Source**: Plano Building Inspections Reports (Static Excel)
- **Endpoint**: `https://dashboard.plano.gov` (Weekly reports)
- **Format**: `.xlsx` files (manual download)
- **Update Frequency**: Weekly
- **Note**: Plano separates "Interior Finish Out" reports—high value for interior trades
- **Ingestion Strategy**:
  1. Weekly crawler checks for new report links
  2. Download `.xlsx` files
  3. Parse with robust column detection (headers drift)
- **Status**: ✅ Implemented in `services/ingestion/plano.ts`

### Irving
- **Source**: Irving Open Data Portal (ArcGIS)
- **Endpoint**: `https://data-cityofirving.opendata.arcgis.com`
- **Format**: ArcGIS Open Data (CSV/JSON download)
- **Note**: Irving uses MGO (My Government Online) internally but republishes via ArcGIS
- **Datasets**: "Residential Permits Issued", "Commercial Permits Issued", "Certificates of Occupancy"
- **Status**: ✅ Implemented in `services/ingestion/irving.ts`

---

## 2. Certificates of Occupancy (Utility Hookup Proxy)

### Dallas CO API
- **Endpoint**: `https://www.dallasopendata.com/resource/9qet-qt9e.json`
- **Dataset ID**: `9qet-qt9e`
- **Purpose**: COs indicate new tenant move-ins and new utility service connections
- **Key Fields**:
  - `type_of_co`: 
    - "CO-New Building" → New construction completed
    - "CO-Change of Tenant" → New business moving into existing space
    - "CO-Clean & Show" → Landlord preparing vacant space (future lease opportunity)
  - `land_use`: "OFFICE", "RETAIL", "RESTAURANT", etc.
  - `issued_date`: For filtering recent COs (e.g., last 30 days)
- **Query Example**:
  ```
  $where=issued_date > '2024-11-01' AND (land_use = 'OFFICE' OR land_use = 'RETAIL' OR land_use = 'RESTAURANT')
  $order=issued_date DESC
  ```
- **Status**: ✅ Implemented in `services/ingestion/utilityConnections.ts` as utility hookup proxy

### Fort Worth CO
- **Source**: CFW Certificates of Occupancy Table
- **Format**: ArcGIS Table endpoint
- **Update Frequency**: Hourly
- **Note**: Similar to Dallas but with IBC occupancy classes (A, B, E, M, R)
- **Status**: 🔄 Can be added to utilityConnections.ts

---

## 3. Zoning Cases (Early Concept-Stage Signals)

### Arlington (Best Source)
- **Source**: Active Zoning Cases Interactive Map
- **Endpoint**: `https://opendataupdate-arlingtontx.hub.arcgis.com`
- **Format**: ArcGIS Feature Layer (CSV, GeoJSON via REST API)
- **Update Frequency**: Per zoning cycle (typically monthly)
- **Access**: Direct download or REST API query
- **Status**: ⚠️ **Endpoint URL needs verification** - visit portal and identify exact FeatureServer URL

### Dallas
- **Source**: City Council & Plan Commission Agendas (Legistar)
- **Format**: HTML/PDF (no API)
- **Access Method**: Scrape agenda items labeled "Z#-xxx" with case attachments
- **Note**: Dallas planned Accela portal in 2024—check if now available
- **Civic Tech Alternative**: "Civic Atlas" project scraped zoning data (dallasfreepress.com)
- **Status**: ❌ Requires scraping implementation

### Fort Worth
- **Source**: Zoning Cases webpage
- **Endpoint**: `https://fortworthtexas.gov` (Zoning Cases by District)
- **Format**: Web page with PDF case details
- **Access Method**: Scrape HTML list, download PDF staff reports
- **Alternative**: Fort Worth Zoning Commission meeting agendas
- **Status**: ❌ Requires scraping implementation

### Plano
- **Source**: Interactive Zoning Map
- **Endpoint**: `https://share.plano.gov` (Active Zoning Petitions layer)
- **Format**: Web GIS application (no direct download)
- **Access Method**: Extract REST endpoint from map or scrape Planning & Zoning Commission agendas
- **Status**: ❌ Requires scraping implementation

### Irving
- **Source**: Planning & Zoning Commission agendas
- **Endpoint**: `https://irvingtx.gov` (Zoning Cases page)
- **Format**: Website text/PDFs
- **Access Method**: Scrape web pages or monitor agenda packets
- **Status**: ❌ Requires scraping implementation

---

## 4. Legal Vacancy Signals (Eviction Data)

### Dallas County (covers Dallas, Irving)
- **Primary Source**: Eviction Lab - Dallas-Fort Worth Dataset
- **Endpoint**: `https://evictionlab.org/eviction-tracking/dallas-fort-worth-tx/`
- **Format**: Downloadable CSV (updated weekly)
- **Provider**: January Advisors (in partnership with Eviction Lab)
- **Alternative**: North Texas Eviction Project (NTEP) dashboard
  - `https://childpovertyactionlab.org` (aggregated data from Dallas County)
- **Status**: 🔄 **Requires CSV ingestion pipeline**

### Tarrant County (covers Fort Worth, Arlington)
- **Source**: Eviction Lab (same as Dallas County)
- **Data Provider**: January Advisors
- **Note**: NTEP also includes Tarrant County aggregated data
- **Status**: 🔄 **Requires CSV ingestion pipeline**

### Collin County (covers Plano)
- **Source**: North Texas Eviction Project
- **Endpoint**: `https://childpovertyactionlab.org` (Collin County data from 2019+)
- **Format**: Web dashboard (aggregated stats)
- **Alternative**: Eviction Lab (if county-level data available)
- **Status**: 🔄 **Requires CSV ingestion pipeline**

### Implementation Notes
- No real-time APIs available; data via weekly CSV downloads
- Filtering for commercial addresses requires:
  - Keyword matching on business names
  - Geocoding to commercial zones
  - Cross-referencing with permit data
- Privacy considerations: Eviction data is public but sensitive
- Use as **secondary signal only** to boost existing leads, not create new leads

---

## 5. Licensing Signals

### Liquor Licenses (All Cities)
- **Source**: Texas Alcoholic Beverage Commission (TABC)
- **Endpoint**: `https://data.texas.gov/resource/naix-2893.json`
- **Dataset**: TABC License Information (Socrata)
- **Format**: JSON (Socrata API)
- **Auth**: None required
- **Coverage**: Statewide (filter by city)
- **Key Fields**:
  - `city`: Filter for "DALLAS", "FORT WORTH", "ARLINGTON", "PLANO", "IRVING"
  - `type_of_license`: "Mixed Beverage", "Food and Beverage", etc.
  - `trade_name`: Business name
  - `obligation_end_date_yyyymmdd`: License expiration (active if future date)
- **Query Example**:
  ```
  $where=(city='DALLAS' OR city='FORT WORTH') AND obligation_end_date_yyyymmdd > '2024-12-08'
  $order=obligation_end_date_yyyymmdd DESC
  ```
- **Status**: ✅ **Fully implemented** in `services/ingestion/licensingSignals.ts`

### Health/Food Permits

#### Dallas
- **Source**: Dallas Consumer Health Division
- **Endpoint**: `https://www.dallasopendata.com/resource/food-inspections.json`
- **Dataset**: Food Establishment Inspections
- **Format**: JSON (Socrata API)
- **Note**: Inspection data implies active permits; monitor for new establishments
- **Status**: 🔄 Can be added to licensingSignals.ts

#### Fort Worth, Arlington, Plano, Irving
- **Source**: City health inspection portals (if available)
- **Format**: Varies (likely requires scraping)
- **Alternative**: Use CO data or building permits for "Restaurant" or "Food Service" types
- **Status**: ❌ Requires investigation and scraping

### Fire Alarm Permits (All Cities)
- **Source**: None publicly available
- **Access Method**: Public records request to city alarm permit units (Dallas, Fort Worth, etc.)
- **Alternative**: Monitor city council reports on alarm permit statistics (aggregate trends only)
- **Status**: ❌ **No viable public data source**

---

## 6. Economic Development Incentives

### Texas Comptroller SB 1340 Database (All Cities)
- **Source**: Texas Comptroller of Public Accounts
- **Endpoint**: `https://comptroller.texas.gov/economy/local/ch313/` (SB 1340 Database Search)
- **Format**: Web portal (searchable, no API)
- **Coverage**: Statewide (all Chapter 380/381 agreements, tax abatements, etc.)
- **Reporting Requirement**: Cities must report within 14 days of agreement
- **Fields Available**:
  - Company name
  - Agreement type (Chapter 380 grant, tax abatement, etc.)
  - Value/investment amount
  - Date approved
- **Access Method**: **Web scraping required** (search form automation)
- **Status**: 🔄 **Requires scraping implementation**

### City-Specific Supplements

#### Dallas
- **Source**: Office of Economic Development press releases
- **Endpoint**: `https://dallasecodev.org` (news page)
- **Format**: HTML press releases
- **Note**: Timely announcements before Comptroller reporting
- **Access Method**: RSS feed or web scraping

#### Fort Worth, Arlington, Plano, Irving
- **Source**: City Council agenda packets
- **Format**: PDF agenda items (IR or M&C items)
- **Access Method**: Monitor city council meeting agendas for keywords ("Chapter 380", "economic development incentive", "tax abatement")
- **Note**: All formal agreements eventually appear in Comptroller database

---

## 7. State-Level Enrichment

### Texas Comptroller Franchise Tax API
- **Endpoint**: `https://api.comptroller.texas.gov/public-data/v1/public/franchise-tax-list`
- **Purpose**: Entity verification and enrichment (already implemented)
- **Auth**: API Key required
- **Fields**:
  - `taxpayerId`: Unique state ID
  - `right_to_transact_business`: Business status verification
  - `mailingAddress`: HQ address (distinct from project site)
  - NAICS code (via separate lookup)
- **Status**: ✅ Fully implemented in `services/enrichment/comptroller.ts`

---

## Implementation Priority Matrix

| Priority | Signal Type | Difficulty | Impact | Status |
|----------|------------|------------|--------|--------|
| **P0** | Building Permits | Low | High | ✅ Done |
| **P0** | Certificates of Occupancy | Low | High | ✅ Done |
| **P1** | Liquor Licenses (TABC) | Low | Medium | ✅ Done |
| **P1** | Eviction Data (CSV ingestion) | Medium | Medium | 🔄 Next |
| **P2** | Arlington Zoning Cases (ArcGIS) | Low | Medium | ⚠️ Verify endpoint |
| **P2** | Dallas Food Inspections | Low | Low | 🔄 Optional |
| **P3** | Incentives (Comptroller scraping) | High | Medium | 🔄 Future |
| **P3** | Dallas/FW/Plano Zoning (scraping) | High | Medium | 🔄 Future |
| **P4** | Fire Alarms | Very High | Low | ❌ Skip |

---

## Next Steps

### Immediate (P1)
1. **Verify Arlington Zoning ArcGIS endpoint**
   - Visit `opendataupdate-arlingtontx.hub.arcgis.com`
   - Identify REST FeatureServer URL for Active Zoning Cases
   - Update `services/ingestion/zoningCases.ts`

2. **Implement Eviction Lab CSV ingestion**
   - Download weekly CSV from evictionlab.org
   - Parse and filter for commercial addresses
   - Integrate into lead scoring pipeline

3. **Test TABC liquor license integration**
   - Verify data quality and update frequency
   - Tune city filters and license type filtering

### Short-term (P2)
4. **Add Dallas Food Inspections to health permit signals**
5. **Expand utility connections to Fort Worth CO data**
6. **Document scraping requirements for Dallas/FW/Plano zoning**

### Long-term (P3)
7. **Build Texas Comptroller database scraper for incentives**
8. **Implement zoning case scrapers for Dallas, Fort Worth, Plano**
9. **Evaluate ROI of fire alarm permit FOIA requests**

---

## Technical Notes

### Rate Limiting
- **Socrata APIs**: No documented limits for public datasets; respect 1 req/sec guideline
- **TABC**: Part of Texas Open Data Portal; same as Socrata
- **ArcGIS**: Feature services have query limits (typically 1000-2000 records per request)
- **Web Scraping**: Implement delays (2-5 sec between requests) and respect robots.txt

### Data Freshness
- Building permits: Daily (Dallas, Fort Worth)
- COs: Daily to hourly
- TABC licenses: Weekly updates
- Eviction data: Weekly CSV updates
- Zoning cases: Monthly (varies by city)

### Storage Recommendations
- Cache all API responses with timestamps
- Store raw JSON/CSV in Data Lake (AWS S3, Azure Blob)
- Implement watermark-based incremental updates for permit data
- Archive historical data for AI model training

### Error Handling
- All connectors should fail gracefully (return empty array)
- Log all API errors with timestamps and status codes
- Implement exponential backoff for transient failures
- Alert on sustained API downtime (>24 hours)

---

**Document Owner**: FinishOutNow Engineering  
**Last Reviewed**: December 8, 2025  
**Next Review**: March 2026 (or upon new data source discovery)
