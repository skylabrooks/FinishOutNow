# Plano API Discovery Results

**Discovery Date:** December 9, 2025  
**Reference:** City of Plano's Tyler EnerGov Permitting System and API Architecture.md  
**Status:** Initial endpoint discovery phase

---

## 🎯 Discovery Objective

Test potential Plano permit data sources to determine:
1. Which endpoints are publicly accessible (no OAuth required)
2. Which endpoints require OAuth 2.0 authentication
3. Field mappings to FinishOutNow schema
4. Next steps for human-in-the-loop

---

## 📊 Endpoints Tested

### 1. Tyler EnerGov REST API

#### Endpoint A: Public API Path
- **URL:** `https://aca.planogov.org/api/public/permits`
- **Expected:** Public access (per some municipality configurations)
- **Status:** ⏳ PENDING TEST
- **Auth Required:** Unknown until tested

#### Endpoint B: EnerGov WebApi v1
- **URL:** `https://aca.planogov.org/EnerGovWebApi/api/energov/v1/permits`
- **Expected:** OAuth 2.0 required (per architecture doc)
- **Status:** ⏳ PENDING TEST
- **Auth Required:** Yes (likely)

**Per Architecture Document:**
- OAuth 2.0 with Bearer tokens (JWT)
- Token expires in 3600 seconds (1 hour)
- Requires Client ID + Client Secret from City registration
- Scopes needed: `energov_api_permits_read` (minimum)
- Rate limiting: ~100 requests/minute
- Response headers: `X-RateLimit-Remaining`, `X-Request-ID`

---

### 2. ESRI ArcGIS Feature Service

#### Endpoint A: Plano GIS Main Portal
- **URL:** `https://gis.plano.gov/arcgis/rest/services/OpenData/BuildingPermits/FeatureServer/0/query`
- **Expected:** Often publicly accessible for TX cities
- **Status:** ⏳ PENDING TEST
- **Auth Required:** Unknown (commonly public)

#### Endpoint B: ArcGIS Online Hosted
- **URL:** `https://services.arcgis.com/PlanoGIS/arcgis/rest/services/Permits/FeatureServer/0/query`
- **Expected:** Public or token-based
- **Status:** ⏳ PENDING TEST
- **Auth Required:** Unknown

**Per Architecture Document:**
- **Comparison to EnerGov API:**
  - **Data Freshness:** Nightly sync (vs real-time in EnerGov)
  - **Performance:** Fast, optimized for spatial queries
  - **Query Type:** Spatial (bounding box, intersects) vs logical (status, date)
  - **Access:** Often public or simple token-based
- **Best for:** Bulk retrieval, mapping, spatial analysis
- **OData Support:** Use `where=1=1&outFields=*&f=json`

---

### 3. Socrata Open Data Portal

#### Endpoint A: Main Data Portal
- **URL:** `https://data.planogov.org/resource/permits.json`
- **Expected:** Public if Plano uses Socrata
- **Status:** ⏳ PENDING TEST
- **Auth Required:** Typically public

#### Endpoint B: Alternative Subdomain
- **URL:** `https://plano.data.socrata.com/resource/permits.json`
- **Expected:** Public
- **Status:** ⏳ PENDING TEST
- **Auth Required:** Typically public

---

## 🔍 Test Methodology

### Automated Discovery Script
Location: `services/ingestion/plano.ts`

**Test Sequence:**
1. **Priority 1:** ArcGIS Feature Service (most likely public)
2. **Priority 2:** EnerGov Public API (may require OAuth)
3. **Priority 3:** Socrata Open Data (if available)
4. **Fallback:** Mock data + flag for human intervention

**Console Output Tracking:**
```typescript
// Success indicators:
✅ "Successfully fetched N permits via [source]"

// Auth required:
🔒 "Authentication required (401/403)"

// Not found:
❌ "Not found (404)" or "CORS error"

// Results logged to console for review
```

---

## 📋 Field Mapping (Preliminary)

### Expected EnerGov API Fields → FinishOutNow Schema

| EnerGov Field | FinishOutNow Field | Notes |
|---------------|-------------------|-------|
| `permitNumber` | `permitNumber` | Direct mapping |
| `permitType` | `permitType` | Normalize via `normalizePermitType()` |
| `address` | `address` | Direct mapping |
| `issuedDate` / `appliedDate` | `appliedDate` | Use `normalizeDate()` |
| `description` | `description` | Direct mapping |
| `contractorName` / `applicant` | `applicant` | Handle Global Entity GUIDs if needed |
| `estimatedValue` / `valuation` | `valuation` | Parse as float, filter ≥ $50,000 |
| Status workflow | `status` | Map workflow state to Issued/Under Review/Pending |

### Expected ArcGIS Feature Service Fields

| ArcGIS Attribute | FinishOutNow Field | Notes |
|------------------|-------------------|-------|
| `PERMIT_NUMBER` / `PERMIT_NO` | `permitNumber` | Common field name |
| `PERMIT_TYPE` | `permitType` | Normalize |
| `ADDRESS` / `SITE_ADDRESS` | `address` | Direct |
| `ISSUE_DATE` / `APPLIED_DATE` | `appliedDate` | Date format varies |
| `DESCRIPTION` / `WORK_DESCRIPTION` | `description` | Direct |
| `CONTRACTOR_NAME` / `APPLICANT` | `applicant` | Direct |
| `VALUATION` / `PROJECT_VALUE` | `valuation` | Parse float |
| Geometry (optional) | Extract lat/lng | May include coordinates |

---

## ⚠️ Known Constraints (from Architecture Doc)

### EnerGov API Limitations
1. **Business Object Layer:** Cannot directly query database—must use API
2. **GUID Requirements:** 
   - Permit Types require GUID (not free text)
   - Global Entities (contractors) require pre-creation + GUID retrieval
   - Requires multi-step orchestration
3. **Workflow State Machine:** Status changes via workflow actions, not field updates
4. **GIS Dependency:** Address validation depends on ESRI ArcGIS availability
5. **Rate Limiting:** 429 errors require exponential backoff
6. **Pagination:** 50-100 records per page maximum

### Authentication Complexity
- **OAuth 2.0 Flow Required:**
  ```
  POST /identity/connect/token
  Body: grant_type, client_id, client_secret, scope
  Response: access_token (JWT), expires_in (3600s)
  ```
- **Token Refresh:** Must implement auto-refresh before 1-hour expiry
- **Scope Validation:** Ensure `energov_api_permits_read` is granted

---

## 🚦 Next Steps Based on Discovery Results

### Scenario A: Public ArcGIS Feature Service Found ✅
**If ArcGIS endpoint works without auth:**
1. ✅ Use for immediate lead retrieval (nightly sync acceptable)
2. ⏭️ Proceed to Task 3: Document field mappings
3. ⏭️ Continue with OAuth setup in parallel (for real-time data later)
4. **No immediate human action needed** for basic functionality

### Scenario B: All Endpoints Require Auth 🔒
**If all endpoints return 401/403:**
1. ⏸️ **STOP - Human intervention required**
2. 📋 Generate email template for Plano IT
3. 🎯 Request: OAuth credentials, Swagger docs, sandbox access
4. ⏳ Wait for City response before proceeding

### Scenario C: Mixed Results (Some public, some auth) 🟡
**If GIS works but EnerGov requires auth:**
1. ✅ Use GIS for MVP (nightly data acceptable)
2. 📋 Request EnerGov OAuth for real-time updates (optional enhancement)
3. ⏭️ Proceed with implementation using available data source

### Scenario D: All Endpoints 404/CORS ❌
**If no endpoints respond:**
1. ⏸️ **STOP - Human intervention required**
2. 🔍 Investigate: 
   - Is Plano using different software? (Not EnerGov?)
   - Is API behind firewall/VPN?
   - Does public portal exist at different URL?
3. 📋 Generate detailed research request for human

---

## 📧 Human Action Template (If Auth Required)

**TO BE GENERATED AFTER DISCOVERY TEST COMPLETES**

This section will contain:
- Email template for Plano IT contact
- List of specific URLs tested
- Error codes received
- Specific asks (OAuth credentials, API docs, sandbox)

---

## 🔄 Status: Awaiting Test Execution

**How to Run Discovery:**
1. Open application: http://localhost:3000
2. Navigate to Diagnostic Panel
3. Click "Test Plano Ingestion" or "Refresh Data"
4. Review console logs for discovery results
5. Return to this document to document findings

**OR**

Run in dev tools console:
```javascript
// Test Plano ingestion directly
import { fetchPlanoPermits } from './services/ingestion/plano';
const results = await fetchPlanoPermits();
console.log('Discovery complete. Results:', results);
```

---

## 📝 Test Results

**Date Tested:** December 9, 2025  
**Tester:** Human User

### Results Summary:
- [x] ArcGIS Feature Service: ❌ **404 Not Found**
- [x] EnerGov Public API: 🔒 **401 Unauthorized (OAuth Required)**
- [x] Socrata Open Data: ❌ **404 Not Found**

### Actual Errors Received:
```
index.tsx:1  Failed to load resource: the server responded with a status of 404 (Not Found)
index.tsx:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

### Analysis:
1. **404 Errors:** ArcGIS Feature Service and Socrata endpoints do not exist at tested URLs
2. **401 Error:** EnerGov API exists but requires OAuth 2.0 authentication (expected per architecture doc)
3. **No publicly accessible endpoints found**

### Successful Endpoint:
**NONE** - All tested endpoints require authentication or do not exist

### Conclusion:
OAuth 2.0 credentials from Plano IT are required to proceed with EnerGov API integration.

---

## 🎯 Recommendation After Testing

### ✅ **DECISION: PATH B - OAuth Required**

**Status:** 🔒 **PAUSE - Human must contact Plano IT**

**Rationale:**
- EnerGov API returned **401 Unauthorized** (expected per architecture documentation)
- This confirms the API exists and is operational
- No public GIS or Open Data endpoints available
- OAuth 2.0 authentication is the only path forward

**Next Steps:**
1. ✅ **Send email to Plano IT** using template: `HUMAN_ACTION_EMAIL_TEMPLATE.md`
2. ⏸️ **Pause Plano integration** until credentials received
3. ✅ **Continue with other cities** (Dallas, Fort Worth, Arlington already functional)
4. ⏳ **Wait 5-10 business days** for Plano IT response

**What to Request in Email:**
- OAuth 2.0 Client ID and Client Secret
- Token endpoint URL: `/identity/connect/token`
- Required scope: `energov_api_permits_read`
- Swagger/OpenAPI documentation URL
- Sandbox environment credentials for testing

**Timeline Estimate:**
- Email response: 5-10 business days
- Credentials provisioned: 1-2 weeks after approval
- Development after credentials: 2-3 days

---

*Test completed: December 9, 2025*  
*Result: OAuth authentication required - proceed with IT contact*
