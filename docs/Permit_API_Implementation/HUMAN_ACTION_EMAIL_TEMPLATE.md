# Email Template: Plano IT API Access Request

---

## 📧 How to Send This Email

**STEP 1:** Find the correct contact:
- Visit: https://www.plano.gov/139/Information-Technology
- Look for: IT Department contact or API/Developer Relations
- Alternative: Call main number (972-941-7000) and ask for IT department or EnerGov system administrator

**STEP 2:** Copy the email template below

**STEP 3:** Fill in the [YOUR DETAILS] sections

**STEP 4:** Send and wait for response (typically 3-5 business days)

---

## 📩 Email Template

**SUBJECT:** API Access Request - Building Permit Data Integration

---

**TO:** [Plano IT Department Email]  
**CC:** [Your company contact if applicable]  
**FROM:** [Your Name and Email]

---

Dear City of Plano IT Department,

I am writing to request API access to the City of Plano's building permit data for a commercial lead generation system. Our application, **FinishOutNow**, helps commercial contractors (security systems, signage, low-voltage IT) identify tenant improvement opportunities by analyzing building permit data.

### **Background on Our System**
- **Purpose:** Identify commercial remodel/tenant improvement projects for legitimate business development
- **Data Usage:** Read-only access to public building permit records
- **Frequency:** Daily or weekly synchronization (not real-time polling)
- **Compliance:** Full respect for rate limits, caching policies, and Terms of Service

### **What We've Discovered So Far**
We have tested the following endpoints and documented our findings:

1. **Tyler EnerGov REST API:**
   - `https://aca.planogov.org/api/public/permits` → **401 Unauthorized (OAuth 2.0 required)**
   - `https://aca.planogov.org/EnerGovWebApi/api/energov/v1/permits` → **401 Unauthorized**
   - **Status:** API exists and is functional, but requires OAuth 2.0 authentication

2. **ESRI ArcGIS Feature Service:**
   - `https://gis.plano.gov/arcgis/rest/services/OpenData/BuildingPermits/FeatureServer/0/query` → **404 Not Found**
   - **Status:** Public GIS endpoint not available at tested URL

3. **Open Data Portal:**
   - `https://data.planogov.org/resource/permits.json` → **404 Not Found**
   - `https://plano.data.socrata.com/resource/permits.json` → **404 Not Found**
   - **Status:** No public Socrata portal found

### **Specific Requests**

We respectfully request the following information and access:

#### 1. **API Documentation**
- Is there a public Swagger/OpenAPI specification URL for the EnerGov API?
- Developer documentation or integration guide
- List of available endpoints and their purposes

#### 2. **Authentication Credentials (if required)**
- **OAuth 2.0 Client Registration:**
  - Client ID and Client Secret
  - Token endpoint URL (e.g., `/identity/connect/token`)
  - Required scopes (we need read-only permit access: `energov_api_permits_read`)
- **Alternative:** If simpler API key authentication is available, we can use that instead

#### 3. **Sandbox/Test Environment**
- Access to a test/staging environment for integration testing
- Sample data or test permit records to validate our field mappings
- Sandbox credentials separate from production

#### 4. **Public GIS Data Confirmation**
- Does Plano offer a publicly accessible ArcGIS Feature Service for building permits?
- If yes, what is the correct endpoint URL?
- Is this data refreshed nightly or in real-time?

#### 5. **Rate Limits and Policies**
- What are the rate limits for API calls? (requests per minute/hour/day)
- Are there specific hours when polling is preferred?
- Any restrictions on data caching or storage?

#### 6. **Data Fields Available**
We need the following permit information (if available):
- Permit number
- Permit type (Commercial Remodel, Tenant Improvement, etc.)
- Address/parcel location
- Issue date / Application date
- Project description
- Contractor/applicant name
- Project valuation
- Current status (Issued, Under Review, etc.)

### **Our Technical Setup**
- **Application:** React/TypeScript web application
- **Hosting:** [Specify: Cloud/Local/etc.]
- **Integration Method:** RESTful API calls with proper error handling, rate limiting compliance
- **Data Security:** All API credentials stored securely using [Azure Key Vault / AWS Secrets Manager / etc.]

### **Regulatory Compliance**
We understand and will comply with:
- Texas Public Information Act (TPIA) - public records only
- Any PII redaction requirements
- City of Plano's Terms of Service
- Rate limiting and responsible polling practices

### **Expected Timeline**
We hope to complete integration within **[specify: 2-4 weeks]** after receiving API credentials. We will provide progress updates and coordinate testing with your team.

### **Contact Information**
**Primary Contact:** [Your Name]  
**Email:** [Your Email]  
**Phone:** [Your Phone]  
**Company:** [Your Company Name]  
**Website:** [If applicable]

### **Next Steps**
Could you please provide:
1. Confirmation of whether API access is available for external developers
2. The appropriate process for requesting credentials
3. Any forms or agreements we need to complete
4. Expected timeline for approval

We are happy to schedule a call or meeting to discuss our integration in more detail if that would be helpful.

Thank you for your time and assistance. We look forward to working with the City of Plano to build a responsible and compliant data integration.

Best regards,

[Your Name]  
[Your Title]  
[Your Company]  
[Contact Information]

---

**ATTACHMENTS TO CONSIDER ADDING:**
- [ ] Company/organization overview (1-page PDF)
- [ ] Technical architecture diagram showing data flow
- [ ] Sample screenshots of your application
- [ ] References from other cities you've integrated with

---

## 🔄 After Sending - Next Steps

### Scenario A: Positive Response (API Access Granted) ✅
**You'll receive:**
- OAuth Client ID and Client Secret
- API documentation URL
- Sandbox environment credentials

**Your next actions:**
1. ✅ Store credentials securely (add to `.env.local`, never commit to git)
2. ✅ Return to development team with credentials
3. ✅ Move to Task 5: "Build OAuth Token Management Service"

### Scenario B: Alternative Offered (Public GIS Only) 🟡
**You'll receive:**
- Confirmation that ArcGIS Feature Service is public
- Correct endpoint URL
- No OAuth needed for GIS data

**Your next actions:**
1. ✅ Update `services/ingestion/plano.ts` with correct GIS URL
2. ✅ Use GIS as primary data source
3. ⏭️ Skip OAuth tasks, proceed with GIS-based implementation

### Scenario C: No Public API Available ❌
**You'll receive:**
- Statement that API is not publicly available
- Alternative suggestions (manual export, portal access, etc.)

**Your next actions:**
1. 🔄 Explore alternative:
   - Manual CSV/Excel export from Plano portal
   - Web scraping (last resort, legal review required)
   - Partner with another service that has access
2. 📋 Document decision in project notes
3. ⏸️ Pause Plano integration, focus on other cities

### Scenario D: No Response After 7 Days ⏳
**Follow-up actions:**
1. Send polite follow-up email (use shorter version of original)
2. Try calling IT department directly
3. Research if Plano has Developer Relations or Open Data program
4. Check for any existing API partnerships or third-party data providers

---

## 📋 Email Tracking Checklist

- [ ] Email drafted with all [YOUR DETAILS] filled in
- [ ] Updated discovery results from testing (Section: "What We've Discovered So Far")
- [ ] Proofread for professionalism and clarity
- [ ] Attachments prepared (if applicable)
- [ ] Sent to correct IT department contact
- [ ] Added reminder to calendar for 7-day follow-up
- [ ] Documented in project notes: `Permit_API_Implementation/communication_log.md`

---

## 🎯 Expected Response Time

**Typical timeline:**
- **Initial acknowledgment:** 1-3 business days
- **Decision/response:** 5-10 business days
- **Credentials provisioned:** 1-2 weeks after approval

**If urgent:** Mention a deadline in your email and offer to follow up via phone.

---

*Template created: December 9, 2025*  
*For use with: City of Plano Tyler EnerGov API Access Request*
