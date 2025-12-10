# **Technical Blueprint for the DFW Automated Lead Sourcing Engine (ALSE)**

## **1\. Strategic Architecture and System Design**

### **1.1 The Market Imperative: From Reactive to Predictive**

The construction and real estate development market in the Dallas-Fort Worth (DFW) metroplex represents one of the most active, yet technologically fragmented, ecosystems in North America. For general contractors, subcontractors, and material suppliers, the traditional method of sourcing leads—waiting for projects to appear in paid plan rooms or relying on manual relationships—is fundamentally reactive. By the time a project is listed on a commercial bid platform, the decision-makers have often already been engaged, and the competitive margin has compressed.

To achieve a "perfect" lead sourcing mechanism, as requested, one must transition from reactive retrieval to predictive intelligence. This requires the construction of an Automated Lead Sourcing Engine (ALSE) that does not merely scrape data but ingests "Free-First" public data from municipal APIs, normalizes chaotic taxonomies, and enriches raw signals with high-fidelity context. The objective is to identify the "Golden Hour" of a project—the window between the initial filing of a zoning variance or permit application and the issuance of the final building permit.

The technical blueprint detailed herein establishes a comprehensive framework for this proprietary system. It leverages a hybrid ELT (Extract, Load, Transform) architecture designed to handle the specific idiosyncrasies of DFW's municipal data infrastructure—from the RESTful Socrata endpoints of Dallas 1 to the geospatial ArcGIS FeatureServers of Fort Worth and Arlington 1, and the opaque legacy portals of suburban municipalities.

### **1.2 Architectural Philosophy: The Lake-First ELT Approach**

Traditional data pipelines often employ an ETL (Extract, Transform, Load) strategy, where data is cleaned and structured before it ever touches the database. However, in the context of municipal data scraping, this approach is brittle. City schemas change without warning; an API that returns a string for valuation today might return a float tomorrow, breaking the pipeline and causing data loss.

Therefore, the ALSE is architected on a "Lake-First" ELT paradigm.

1. **Extract:** Ingestion nodes ("Connectors") fetch raw data from city sources.  
2. **Load:** The exact, unmodified JSON or HTML payload is immediately dumped into an immutable Data Lake (e.g., AWS S3 or Azure Blob Storage), partitioned by Source, Date, and Ingestion ID. This "Bronze Layer" serves as the source of truth and allows for historical replay.  
3. **Transform:** Only after the data is safely secured does the Processing Core normalize it into the operational database (PostgreSQL/PostGIS).

This architecture ensures resilience. If the City of Dallas changes its permit\_type classification system, the ALSE can simply update its transformation logic and reprocess the historical raw data from the Lake without needing to re-fetch (and potentially miss) ephemeral records.1

### **1.3 The Data Connectivity Landscape**

The DFW metroplex is not a monolith; it is a patchwork of digital fiefdoms, each requiring a distinct technical approach for perfect integration.

| Municipality / Source | Primary Platform | Technical Integration Strategy | Data Latency |
| :---- | :---- | :---- | :---- |
| **City of Dallas** | Socrata (SODA) | Native API with App Tokens and SoQL filtering. | Real-time (\< 1 hr) |
| **City of Fort Worth** | Esri ArcGIS Server | REST API with Object ID paging and Geometry suppression. | Daily Batch |
| **City of Arlington** | Esri ArcGIS Server | Server-side Proxy to bypass CORS; FeatureServer querying. | Daily Batch |
| **State of Texas (TABC)** | Socrata (SODA) | Native API with strict type handling for numeric dates. | Weekly |
| **Dallas Food Inspections** | Vendor (Tyler Tech) | Headless Browser Scraping (Playwright) of myhealthdepartment.com. | Daily |
| **Zoning Boards** | Granicus Legistar | API (webapi.legistar.com) \+ PDF Parsing via LLM. | Bi-Weekly |

This table, derived from deep analysis of the provided research 1, highlights the necessity of a multi-modal ingestion engine. A single "scraper" script cannot handle the diversity of REST, SOAP, and geospatial queries required.

## ---

**2\. The Ingestion Layer: Extracting Municipal Data**

The Ingestion Layer is the sensory system of the ALSE. It is composed of modular, protocol-specific connectors that run on independent schedules via an orchestrator like Apache Airflow.

### **2.1 The Socrata Connector (City of Dallas)**

The City of Dallas utilizes the Socrata Open Data platform, which exposes the Socrata Open Data API (SODA). This is the most technically mature interface in the region, but achieving "perfect" operation requires navigating rate limits and specific query optimizations.

#### **2.1.1 Authentication and Throughput**

While Socrata endpoints are publicly readable, unauthenticated requests are subject to aggressive throttling. To ensure the ALSE can handle the ingestion of historical backfills or high-frequency polling (e.g., every 15 minutes), the connector must implement the X-App-Token header.

* **Mechanism:** Register an application with the Socrata Developer Portal to receive an App Token.  
* **Implementation:** All HTTP GET requests to \*.dallasopendata.com must include:  
  HTTP  
  X-App-Token:  
  Accept: application/json

This creates a stable throughput channel capable of handling the thousands of daily permit updates generated by a city the size of Dallas.1

#### **2.1.2 The "Delta Fetch" Strategy**

To maintain synchronization without downloading the entire database daily, the Socrata Connector utilizes a "Watermark" strategy based on the issued\_date or floating\_timestamp.

1. **Poll State:** The scheduler queries the internal ALSE database for the maximum timestamp of the last successful ingestion for the Dallas dataset.  
   * last\_sync \= SELECT MAX(issued\_date) FROM raw\_permits WHERE source \= 'dallas'  
2. **Request Delta:** The connector constructs a SoQL query to fetch only records created after that watermark.  
   * Query: $where=issued\_date \> '2025-12-09T00:00:00'  
3. **Pagination:** Socrata uses offset-based pagination. The connector must loop through the result set using $limit=1000 and $offset=N until an empty array is returned.

#### **2.1.3 Handling Schema Drift**

Socrata datasets occasionally undergo schema changes (column renames). The Ingestion Layer mitigates this by fetching the dataset metadata (/api/views/\[dataset-id\].json) prior to the data fetch. This metadata outlines the current column IDs and data types. If the connector detects a change in the schema signature (e.g., permit\_valuation changing to est\_project\_cost), it triggers an alert and halts ingestion to prevent data corruption, adhering to the principle of "Fail Safe".1

### **2.2 The GeoService Connector (Fort Worth & Arlington)**

Fort Worth and Arlington operate on the Esri ArcGIS Enterprise stack. Unlike Socrata's tabular focus, ArcGIS is geospatial-first. Data is stored in "FeatureServers," and retrieving it requires traversing a REST API designed for map rendering, not bulk data export.

#### **2.2.1 Object ID Paging: The Robust Approach**

Standard pagination in ArcGIS uses resultOffset. However, purely offset-based pagination on large geospatial datasets can be performant-heavy and unreliable, often leading to timeouts on deep pages (e.g., record 50,000+).  
To get this working perfectly, the GeoService Connector must implement Object ID Paging:

1. **Initial Query:** Request records ordered by the OBJECTID (the primary key in Esri geodatabases).  
   * Params: where=1=1, orderByFields=OBJECTID ASC, resultRecordCount=1000.  
2. **Cursor Tracking:** Record the maximum OBJECTID from the returned batch.  
3. **Subsequent Queries:** Modify the where clause to request only records following the cursor.  
   * Params: where=OBJECTID \>.

This method is strictly linear, highly performant, and immune to the "deep paging" timeouts that plague amateur scrapers.1

#### **2.2.2 Geometry Suppression**

For lead generation, the precise polygon geometry of a parcel is often secondary to the tabular attribute data (Owner Name, Contractor, Valuation). ArcGIS payloads can be massive if complex polygon geometries are included.

* **Optimization:** The connector must explicitly set returnGeometry=false in the API request parameters unless the specific pipeline stage requires spatial data. This reduces the payload size by 90% and significantly increases ingestion speed.

#### **2.2.3 The Arlington Proxy Solution (CORS Bypass)**

A specific technical hurdle identified in the research is the Cross-Origin Resource Sharing (CORS) configuration on Arlington's GIS servers. Direct requests from a browser-based dashboard to gis.arlingtontx.gov will be blocked.

* **The Fix:** The ALSE must implement a server-side proxy. The ingestion script runs largely server-side (Node.js/Python), which is not subject to browser CORS policies. However, if a user-facing dashboard needs to query this data live, the application API acts as the middleman:  
  * **Frontend Request:** GET /api/proxy/arlington/zoning  
  * **Backend Action:** The server makes the request to the ArcGIS endpoint, forwarding the appropriate User-Agent and potentially a Referer header spoofing the city's own GIS viewer to ensure access.1

### **2.3 The Scraper Node (Legacy Portals)**

Not all data is available via API. The Scraper Node handles "Tier 3" sources like the new Dallas Food Inspection portal and suburban static reports.

#### **2.3.1 Headless Browser Architecture**

The move of Dallas Food Inspections to inspections.myhealthdepartment.com 4 necessitates a headless browser approach using tools like **Playwright** or **Puppeteer**. Simple curl or requests libraries will fail because these sites rely on heavy client-side JavaScript (Angular/React) and dynamic hydration of the DOM.

* **Technique:** The Scraper Node spins up a Dockerized Chromium instance.  
* **Interaction:** It programmatically navigates to the search page, interacts with the date picker (selecting "Last 7 Days"), and waits for the specific network request (XHR/Fetch) that populates the results table.  
* **Interception:** Instead of parsing the HTML, the scraper intercepts the JSON response from the underlying internal API (often hidden but visible in network traffic) to extract clean data.

#### **2.3.2 Anti-Bot Mitigation**

To maintain "perfect" uptime, the Scraper Node must employ defensive measures:

* **User-Agent Rotation:** Cycling through legitimate browser signatures.  
* **Residential Proxies:** If the target site implements IP blocking, traffic is routed through a pool of residential IPs.  
* **Randomized Delays:** Inserting human-like pauses between actions to avoid heuristic detection.

## ---

**3\. Core Data Pipelines: Building the Permit Backbone**

With the Ingestion Layer established, the focus shifts to the specific data pipelines that constitute the backbone of the ALSE.

### **3.1 City of Dallas: The "Noise" Filter Pipeline**

The Dallas building permit dataset (e7gq-4sah) is voluminous but noisy. It includes permits for minor residential work (fences, pools, lawn sprinklers) that dilute the value of the lead stream. The pipeline must filter this noise at the source to maximize efficiency.

#### **3.1.1 Advanced SoQL Filtering**

Rather than ingesting everything and filtering locally, the ALSE pushes the logic to the Socrata edge using SoQL (Socrata Query Language).

**Operational Query:**

SQL

SELECT  
    permit\_number, permit\_type, work\_description,  
    valuation, contractor\_name, issued\_date, job\_address  
WHERE  
    issued\_date \> ''  
    AND valuation \> 50000  
    AND permit\_type NOT IN ('Fence', 'Driveway', 'Demolition', 'Swimming Pool', 'Lawn Sprinkler')  
    AND permit\_class IN ('COMMERCIAL', 'MULTI-FAMILY')  
ORDER BY  
    issued\_date DESC

**Implication:** This query immediately excludes low-value noise. The valuation \> 50000 threshold is a strategic variable; it can be adjusted based on the user's specific target market (e.g., lowering it to $10k for small MEP contractors).

#### **3.1.2 The Certificate of Occupancy (CO) Proxy**

The CO dataset (9qet-qt9e) serves as a critical proxy for tenant improvement work and utility connections. A CO is often the first public signal that a new tenant has leased a space, triggering needs for cabling, security, and moving services.1

* **Filtering Strategy:** The pipeline filters for specific land\_use codes: OFFICE, RETAIL, RESTAURANT, MEDICAL.  
* **Insight Generation:** A CO with the type "Clean & Show" is a specific signal used by landlords to prepare a vacancy for viewing. This is a **pre-lease signal**—the space is empty and actively being marketed.

### **3.2 City of Fort Worth: The "Status" Lifecycle Pipeline**

Fort Worth's ArcGIS data presents a specific trap: it exposes the entire history of permit applications, including those that were withdrawn, expired, or voided.

#### **3.2.1 Status Sanitization**

A perfect pipeline must sanitize these records to prevent the sales team from chasing dead leads. The ingestion query filters against the Status field.

* **Valid Statuses:** Applied, In Review, Issued, Amendment.  
* **Invalid Statuses:** Finaled, Expired, Withdrawn, Void.  
* **Logic:**  
  JavaScript  
  const activeStatuses \=;  
  if (\!activeStatuses.includes(record.attributes.Status)) {  
      return null; // Skip ingestion  
  }

#### **3.2.2 The "Two-Column" Taxonomy**

Fort Worth classifies work using two columns: Permit\_Type (Category) and Permit\_SubType (Specifics). The pipeline must concatenate these to form a meaningful description.

* *Raw:* Type="Commercial", SubType="New Building" $\\rightarrow$ *Normalized:* COMMERCIAL\_NEW  
* Raw: Type="Commercial", SubType="Shell Building" $\\rightarrow$ Normalized: COMMERCIAL\_SHELL  
  This distinction is vital. A "Shell" building offers different opportunities (concrete, steel) compared to a "Remodel" (drywall, paint, flooring).

### **3.3 City of Arlington: The "Golden Hour" Pipeline**

Arlington provides a unique strategic advantage via its **Permit Applications** dataset, which is separate from issued permits.

#### **3.3.1 Pre-Approval Monitoring**

By targeting the Permit\_Applications FeatureServer, the ALSE accesses leads in the "Golden Hour"—the period between application and issuance.

* **Target Field:** STATUSDESC  
* **Trigger Values:** Application Incomplete, In Review, Resubmittal Required.  
* **Strategic Value:** Identifying a project in "Resubmittal" allows a savvy contractor or architect to reach out and offer assistance in getting the plans approved, positioning themselves as a partner before the bid process formally begins.1

### **3.4 Suburban Frontiers: Handling the Long Tail**

Surrounding DFW are high-growth suburbs like Plano, Frisco, and Irving. These often use less standardized systems.

* **Plano:** Publishes static Excel reports weekly. The Scraper Node must download these .xlsx files, and use a Python pandas script to parse them. The parser must be robust to "column drift," finding headers by keyword matching rather than fixed indices.  
* **MGO (My Government Online):** Used by many smaller municipalities. This platform is notoriously difficult to scrape due to dynamic field IDs. The ALSE uses a specialized "MGO Connector" in the Scraper Node that navigates the search UI to extract permit details by date range.

## ---

**4\. Creative Signal Engineering: Beyond the Permit**

To achieve market dominance, the ALSE ingests "Creative Signals"—data points that indicate intent *before* a permit is filed or after a project is complete but requires services.

### **4.1 TABC Liquor Licenses (The Hospitality Signal)**

A new "Original" liquor license application is a definitive signal of a new restaurant, bar, or hotel. This often occurs 60 days before the interior finish-out permit is issued.

#### **4.1.1 Fixing the Endpoint Logic**

Research 1 identified that the TABC dataset naix-2893 on data.texas.gov typically returns 400 errors for standard queries. The root cause is data type handling. The field obligation\_end\_date\_yyyymmdd is stored as a **Number**, not a string.

* **Broken Query:** obligation\_end\_date\_yyyymmdd \> '20250101' (String comparison).  
* **Perfect Query:** obligation\_end\_date\_yyyymmdd \> 20250101 (Numeric comparison).

#### **4.1.2 Signal Logic**

The pipeline filters for:

* Application Type: "Original" (New business).  
* License Type: "MB" (Mixed Beverage), "BG" (Wine and Beer).  
* **Enrichment:** The ALSE links the Location Address from the TABC record to the permit database. If no permit exists, a "Ghost Lead" is created—a high-probability construction project that hasn't hit the permit system yet.

### **4.2 Utility Connections (The Occupancy Signal)**

Oncor and CenterPoint do not provide open APIs for new meter sets. The ALSE implements a "Proxy Strategy" using the Certificate of Occupancy (CO) data discussed in Section 3.1.2.

* **Mechanism:** A "Clean & Show" CO is the specific administrative trigger required for Oncor to energize a meter for a vacant commercial suite.  
* **Action:** When this signal is detected, the system generates a "Utility Lead" for commercial ISPs, low-voltage cabling vendors, and security monitoring companies, knowing that a new tenant is imminent.

### **4.3 Zoning and Entitlements (The Concept Signal)**

Zoning changes represent the genesis of a project, often occurring 6-18 months before ground-breaking. Monitoring this provides the longest lead time.

#### **4.3.1 Legistar API Integration**

Both Dallas and Fort Worth manage city council agendas via Granicus Legistar.

* **Endpoint:** https://webapi.legistar.com/v1/{Client}/Matters.6  
* **Client Discovery:** While not explicitly documented, the client strings are standard: Dallas and FortWorth.  
* **Query Filter:** $filter=MatterType eq 'Zoning Case' and MatterDate gt datetime'2025-01-01'.

#### **4.3.2 LLM-Driven PDF Extraction**

The Legistar API returns metadata and links to PDF attachments (the actual zoning staff reports). The metadata is often sparse (e.g., "Z212-345").

* **The Intelligence Step:** The ALSE downloads the PDF and passes the text to an LLM (e.g., GPT-4 via API).  
* **Prompt:** "Analyze this zoning report. Extract the 'Proposed Use', 'Acreage', 'Developer Name', and 'Project Description'. Summarize the development intent."  
* **Result:** The system populates a Concept Lead with rich details like "Proposed 300-unit multifamily complex by Trammell Crow," derived entirely from the unstructured PDF text.

### **4.4 Economic Incentives (Chapter 380 Agreements)**

Texas Local Government Code Chapter 380 allows cities to offer grants and loans for economic development. These agreements signal massive, high-capital projects.

* **Data Source:** The Texas Comptroller maintains a database of these agreements as mandated by HB 2404\.7  
* **Scraping Strategy:** As there is no direct CSV export URL, the Scraper Node targets the Comptroller's search portal. It iterates through "City of Dallas" and "City of Fort Worth" entries, extracting the agreement value and the counterparty (Business Name).  
* **Insight:** A Chapter 380 agreement with "Amazon" or "Toyota" is a flagship lead. The ALSE flags these as "Strategic Priority" for executive review.

## ---

**5\. Data Transformation and Intelligence Layer**

Once data is ingested from these diverse sources, it must be normalized and enriched to be actionable.

### **5.1 The Normalization Engine**

This engine is the "Rosetta Stone" of the ALSE. It maps the chaotic external taxonomies to a clean internal ontology.

| Source Field (Dallas) | Source Field (Fort Worth) | Internal Normalized LeadType |
| :---- | :---- | :---- |
| Commercial Building Permit | Type: Commercial, Sub: New | COMMERCIAL\_NEW |
| Commercial Remodel | Type: Commercial, Sub: Remodel | COMMERCIAL\_REMODEL |
| Certificate of Occupancy | Type: CO, Sub: Clean & Show | TENANT\_TURNOVER |
| Demolition | Type: Demolition | DEMOLITION |

This normalization allows a user to query "All New Commercial Projects" and receive results from Dallas, Fort Worth, and Arlington without worrying about the underlying data differences.

### **5.2 Entity Resolution: The Truth Layer**

A major challenge in permit data is the ambiguity of applicant names. "J. Smith Const." and "John Smith Construction LLC" are likely the same entity.

* **Solution:** The ALSE integrates with the **Texas Comptroller Franchise Tax Account Status (FTAS)** system.1  
* **Workflow:**  
  1. **Extract:** Take the contractor\_name from the permit.  
  2. **Query:** Hitting the Comptroller's search (via API or scraper) for the entity.  
  3. **Verify:** Confirm the entity status is "Active" (Right to transact business).  
  4. **Enrich:** Retrieve the registered Mailing Address. This is crucial because the permit often lists the *job site* address, but the decision-makers are at the *HQ address*.  
  5. **Dedup:** Use the 11-digit Taxpayer ID Number (TIN) as the unique identifier for contractors in the ALSE database, enabling a "Contractor Profile" view that aggregates all their active jobs across the metroplex.

### **5.3 Geospatial Resolution (PostGIS)**

Addresses are notoriously messy strings. The ALSE employs a PostGIS database to handle spatial resolution.

* **Canonicalization:** Incoming addresses ("123 N Main", "123 North Main St") are geocoded against a reference parcel map.  
* **Spatial Join:** This allows the system to answer complex questions: "Show me all permits issued within the 'Deep Ellum' TIF District" or "Show me all TABC licenses within 500 feet of this Zoning Case."  
* **Parcel ID:** The system attempts to assign a unique Parcel ID (CAD ID) to every record, linking permits, zoning, and licenses to the physical land.

## ---

**6\. Operational Reliability and Infrastructure**

Building a "perfect" system requires addressing reliability, scaling, and error handling.

### **6.1 Orchestration and Scheduling**

**Apache Airflow** is the recommended orchestrator. It allows for the definition of complex Directed Acyclic Graphs (DAGs) for each pipeline.

* **DAG Dependency:** The Enrichment DAG only runs after the Ingestion DAG has successfully completed.  
* **Retry Logic:** If the Socrata API returns a 500 error, Airflow automatically retries the task with an exponential backoff strategy (wait 1 minute, then 5, then 15).

### **6.2 Error Handling and Dead Letter Queues**

Data that fails validation (e.g., a permit with a negative valuation or a missing date) is not discarded. It is routed to a **Dead Letter Queue (DLQ)** in the Data Lake.

* **Review:** Engineers can review the DLQ to identify new edge cases or schema changes.  
* **Reprocessing:** Once the parsing logic is fixed, the data in the DLQ can be "replayed" into the main pipeline.

### **6.3 Rate Limiting and Proxies**

To respect municipal resources and avoid IP bans:

* **Socrata:** Adheres to the limits granted by the App Token (typically 1000 requests/hour).  
* **ArcGIS:** Requests are serialized (one after another) rather than parallelized, as ArcGIS servers are CPU-bound and prone to crashing under heavy concurrent load.  
* **Scrapers:** Use a pool of rotating residential proxies (e.g., Bright Data or Smartproxy) to distribute traffic and appear as varied residential users.

## ---

**7\. Implementation Roadmap**

### **Phase 1: Foundation (Weeks 1-4)**

* **Infrastructure:** Deploy the PostgreSQL/PostGIS database and the Airflow orchestration server. Set up S3 buckets for the Data Lake.  
* **Core Ingestion:** Build and deploy the Socrata Connector (Dallas) and GeoService Connector (Fort Worth).  
* **Objective:** Achieve a steady stream of raw, daily permit data landing in the Lake.

### **Phase 2: Normalization & Proxy (Weeks 5-8)**

* **Normalization:** Develop the LeadType ontology and map the initial city codes.  
* **Arlington Proxy:** Deploy the Node.js server-side proxy to handle Arlington's CORS blocking.  
* **Objective:** A unified, searchable database of permits from the "Big Three" cities.

### **Phase 3: Creative Signals (Weeks 9-12)**

* **TABC Integration:** Implement the numeric-date query fix and start ingesting liquor licenses.  
* **Scrapers:** Deploy the Playwright scraper for MyHealthDepartment (Dallas Food) and the Excel parser for Plano.  
* **Objective:** Enrich the database with pre-permit signals.

### **Phase 4: Intelligence & Intelligence (Weeks 13+)**

* **Truth Layer:** Integrate the Texas Comptroller scraping/API for entity resolution.  
* **LLM Enrichment:** Connect the Zoning pipeline to GPT-4 for PDF analysis.  
* **Objective:** A fully automated, intelligent market monitor that identifies leads, verifies actors, and provides deep context.

## ---

**8\. Appendix: Technical Reference Catalog**

### **8.1 Key Endpoint Summary**

| Source | Data Type | Endpoint / URL | Key Technical Note |
| :---- | :---- | :---- | :---- |
| **Dallas** | Permits | https://www.dallasopendata.com/resource/e7gq-4sah.json | Requires X-App-Token; Filter permit\_type noise. |
| **Dallas** | Occupancy | https://www.dallasopendata.com/resource/9qet-qt9e.json | Filter land\_use for commercial types. |
| **Fort Worth** | Permits | https://services5.arcgis.com/.../FeatureServer/0/query | Use where=OBJECTID \> paging; Sanitise Status. |
| **Arlington** | Zoning | https://gis.arlingtontx.gov/.../FeatureServer | **CORS Blocked.** Requires Server-Side Proxy. |
| **State (TABC)** | Liquor | https://data.texas.gov/resource/naix-2893.json | **Critical:** date is Number, not String. No quotes. |
| **Legistar** | Zoning Agendas | https://webapi.legistar.com/v1/{Client}/Matters | Clients: Dallas, FortWorth. PDF parsing required. |
| **Dallas Food** | Inspections | https://inspections.myhealthdepartment.com/dallas | **No API.** Requires Playwright headless scraper. |

### **8.2 Lead Scoring Reference**

To prioritize the output, the ALSE calculates a score (0-100) for every lead.

| Factor | Logic | Weight |
| :---- | :---- | :---- |
| **Valuation** | \+1 per $10k (Cap 50\) | High |
| **Signal Match** | Zoning \+ Permit or Permit \+ TABC | \+20 (Critical) |
| **Entity Verified** | Comptroller Status \= Active | \+10 |
| **Project Type** | COMMERCIAL\_NEW | \+15 |
| **Decay** | \-10% per week since issued\_date | Negative |

This scoring system ensures that a $5M new warehouse project with a verified contractor appears at the top of the dashboard, while a $500 fence repair (noise) is filtered out or ranked at the bottom.

## **9\. Conclusion**

The implementation of the ALSE as described in this blueprint transforms the chaotic landscape of DFW municipal data into a structured, strategic asset. By respecting the unique technical requirements of each source—from Socrata's app tokens to ArcGIS's object paging and Arlington's proxy needs—the system achieves a level of reliability and depth that off-the-shelf tools cannot match. The integration of creative signals and entity resolution further elevates the platform, providing users with the ability to see not just what *is* being built, but what *will* be built, granting a decisive competitive edge in the marketplace.

#### **Works cited**

1. API\_ENDPOINT\_RESEARCH.md  
2. Access the Legislative API \- New York City Council, accessed December 9, 2025, [https://council.nyc.gov/legislation/api/](https://council.nyc.gov/legislation/api/)  
3. Legistar Scraper is a python library for scraping Legistar sites \-- legislation management sites hosted by by Granicus. \- GitHub, accessed December 9, 2025, [https://github.com/fgregg/legistar-scrape](https://github.com/fgregg/legistar-scrape)  
4. Restaurant and Food Establishment Score Range | Dallas OpenData, accessed December 9, 2025, [https://www.dallasopendata.com/Services/Restaurant-and-Food-Establishment-Score-Range/7k7c-4kxi](https://www.dallasopendata.com/Services/Restaurant-and-Food-Establishment-Score-Range/7k7c-4kxi)  
5. Restaurant and Food Establishment Inspections (October 2016 to January 2024\) | Dallas OpenData, accessed December 9, 2025, [https://www.dallasopendata.com/Services/Restaurant-and-Food-Establishment-Inspections-Octo/dri5-wcct](https://www.dallasopendata.com/Services/Restaurant-and-Food-Establishment-Inspections-Octo/dri5-wcct)  
6. Examples \- Legistar Web API \- Granicus, accessed December 9, 2025, [https://webapi.legistar.com/Home/Examples](https://webapi.legistar.com/Home/Examples)  
7. Local Development Agreement Search \- Texas Comptroller, accessed December 9, 2025, [https://comptroller.texas.gov/economy/development/search-tools/sb1340/search.php](https://comptroller.texas.gov/economy/development/search-tools/sb1340/search.php)