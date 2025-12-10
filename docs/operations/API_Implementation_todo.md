
Create a todo based off the document that will be completed by an AI Coding Agent with Human in the loop. Use Human for any account sign ups. Must be detailed and efficie n
Here is a detailed, efficient to‑do list for implementing the ALSE that can be executed by an AI Coding Agent with a human in the loop. Anywhere that requires sign‑ups, sensitive keys, or legal acceptance of terms is clearly marked as Human-only.

0. Clarify Target Stack & Access (Prep)
Confirm core tech stack
[AI] Propose stack:
Backend: Python (FastAPI) or Node.js (Express)
Orchestration: Apache Airflow
DB: PostgreSQL + PostGIS
Cloud: AWS (preferred) or Azure
[Human] Approve/adjust tech stack decision.
Collect existing accounts & constraints
[Human] Provide:
Existing AWS/Azure accounts (if any).
Any existing Socrata, ArcGIS, or proxy infra.
Budget constraints (compute, proxies, LLM usage).

1. Cloud & Infrastructure Setup
Cloud accounts & IAM
[Human] Create/confirm:
Cloud provider account (AWS or Azure).
Root credentials locked down.
[AI] Draft IAM policy templates:
alse-data-lake-access
alse-airflow-access
alse-app-access
[Human] Create IAM roles and users using generated policies.
Data Lake (Bronze Layer)
[AI] Generate IaC (Terraform or CloudFormation):
S3/Blob bucket(s) with folders partitioned by source/date/ingestion_id.
Versioning + server-side encryption enabled.
[Human] Apply Terraform/CloudFormation and verify bucket creation.
PostgreSQL/PostGIS (Operational DB)
[AI] Generate Terraform module or Cloud RDS/Azure SQL template:
Instance sizing recommendations.
PostGIS extension enabled.
[Human]
Provision DB using template.
Store DB credentials in secret manager (e.g., AWS Secrets Manager).
Airflow Orchestrator
[AI] Produce deployment config:
Docker Compose or Helm chart for managed Kubernetes.
Basic DAG folder structure: dags/ingestion, dags/transform, dags/enrichment.
[Human]
Deploy Airflow.
Configure Airflow connections (DB, S3, etc.) using secrets.

2. API Keys, Tokens, and External Access
Socrata (Dallas, TABC)
[AI] Provide instructions and direct URLs to registration pages.
[Human]
Create Socrata developer account.
Generate App Token(s) for:
Dallas Open Data
Texas Open Data (TABC)
Store tokens in secret manager (tag them by dataset).
Proxies & Scraping Infrastructure
[AI] Recommend vendor and plan ranges:
E.g., Bright Data/Smartproxy with estimated GB per month.
[Human]
Create account with proxy provider.
Generate proxy credentials / IP pool.
Store as secrets.
LLM Access for PDF & Text Enrichment
[Human]
Ensure there is an API key for preferred LLM provider.
[AI]
Define usage limits and safety guards in config (rate limits, monthly cap).

3. Data Lake & Schema Design
Raw Lake Schema
[AI] Define folder & file naming conventions:
s3://alse-lake/bronze/{source}/{yyyy}/{mm}/{dd}/{ingestion_id}.json
[AI] Generate JSON metadata schemas per source (Dallas, Fort Worth, etc.) describing expected fields.
Operational DB Schema (Postgres/PostGIS)
[AI] Design normalized schema:
Tables:
raw_ingestions (metadata)
permits (normalized)
co_certificates
zoning_cases
tabc_licenses
economic_incentives
entities (contractors/developers)
leads + lead_scores
Spatial columns with PostGIS (geometry, parcel_id).
[Human]
Run generated SQL migration scripts to create tables and indexes.

4. Ingestion Layer – Connectors
4.1 Dallas (Socrata) Connector
Core Fetcher
[AI]
Implement Python module:
Auth using X-App-Token header (from secrets).
delta_fetch using issued_date watermark:
Read last_sync from DB or metadata.
Build $where query string.
Pagination with $limit and $offset.
Implement metadata fetch from /api/views/{dataset-id}.json and schema signature hashing.
[Human]
Provide dataset IDs and confirm any city-specific throttling documents.
Schema Drift Handling
[AI]
Implement automatic comparison of current metadata vs stored schema signature.
On change:
Log event.
Push record set to DLQ path in S3.
Emit Airflow task failure with clear error.
Airflow DAG
[AI]
Create DAG: ingest_dallas_permits
Tasks:
fetch_metadata
fetch_delta
write_to_s3
update_watermark
[Human]
Activate DAG and set schedule (e.g., every 15–30 minutes).
4.2 Fort Worth & Arlington (ArcGIS) GeoService Connector
ArcGIS Generic Client
[AI]
Implement module for:
object_id_paging:
Step-by-step: max OBJECTID tracking.
returnGeometry=false default.
Handles resultRecordCount & timeout retries.
[Human]
Provide exact ArcGIS service URLs and layer indexes.
Fort Worth Permits Connector
[AI]
Build ingest_fortworth_permits:
where=1=1 baseline.
Status sanitization:
Include only Applied, In Review, Issued, Amendment.
Skip others.
Construct normalized derived fields:
normalized_type from Permit_Type + Permit_SubType.
Wire into Airflow DAG.
Arlington Proxy Connector
[AI]
Implement backend proxy API (Node.js or Python) endpoint:
GET /api/proxy/arlington/{resource}
Forwards to Arlington ArcGIS with required headers.
Rate-limiting and logging.
[Human]
Deploy proxy service (e.g., behind API Gateway / ALB).
[AI]
Build ingest_arlington_permit_applications using proxy, targeting:
STATUSDESC values: Application Incomplete, In Review, Resubmittal Required.
4.3 Scraper Node (Legacy Portals & Static Reports)
Headless Browser Container
[AI]
Define Dockerfile with:
Python + Playwright or Node + Playwright.
Entrypoint script for job execution.
[Human]
Build & push image to container registry.
Dallas Food Inspections Scraper
[AI]
Implement Playwright script:
Navigate to inspections portal.
Apply “Last 7 days” filter.
Intercept XHR calls and capture JSON payload.
Save raw JSON to S3 Bronze.
[AI]
Add anti-bot behaviors (rotating User-Agent, delays, optional proxy).
[Human]
Configure Airflow DAG to call this container periodically.
Plano Weekly Excel Parser
[AI]
Script:
Download .xlsx reports.
Use pandas with header keyword matching, not fixed column indices.
Store raw file in S3 + normalized rows to staging table.
[Human]
Provide URLs for weekly reports or portal navigation steps if manual login is required.
MGO (My Government Online) Connector
[AI]
Implement Playwright-based scraping pattern driven by:
Date range filters.
DOM selectors resilient to dynamic IDs.
[Human]
Perform any login steps and share session cookies / method only if allowed and secure, or perform interactive login when script triggers.

5. Transformation & Normalization Layer
Normalization Engine
[AI]
Implement processing job (dbt models or Python ETL) to:
Read raw S3 data.
Map to unified permits schema using the LeadType ontology from document (COMMERCIAL_NEW, COMMERCIAL_REMODEL, TENANT_TURNOVER, etc.).
[AI]
Maintain mapping tables:
source_field_mappings
lead_type_mappings
[Human]
Approve and adjust business rules (e.g., valuation thresholds, included permit classes).
CO Proxy Pipeline
[AI]
Build transform for CO dataset:
Filter land_use in {OFFICE, RETAIL, RESTAURANT, MEDICAL}.
Tag Clean & Show CO as TENANT_TURNOVER leads.
[AI]
Insert records into co_certificates and generate linked entries in leads table.
Lead Scoring
[AI]
Implement scoring function:
Inputs: valuation, signal match, entity verification, project type, decay.
Produce score 0–100.
[AI]
Create scheduled job to recalculate scores weekly (to apply decay).

6. Creative Signals & Enrichment
6.1 TABC Liquor Licenses
TABC Ingestion
[AI]
Implement Socrata query using numeric comparison:
obligation_end_date_yyyymmdd > 20250101 without quotes.
Filter by:
Application Type = Original
License Type in {MB, BG}
[AI]
Match TABC location address against existing permits:
If match → link as multi-signal lead.
If no match → create “Ghost Lead”.
6.2 Zoning & Legistar
Legistar API Ingestion
[AI]
Implement client for webapi.legistar.com/v1/{Client}/Matters:
Filter: zoning cases after specific date.
Persist metadata and attachment URLs.
[AI]
Implement PDF download + extraction pipeline.
LLM PDF Enrichment
[AI]
Create enrichment function:
Send PDF text to LLM with defined prompt.
Extract: Proposed Use, Acreage, Developer Name, Project Description.
Store in zoning_cases and associated leads.
[Human]
Review first batch of enriched zoning cases for accuracy and adjust prompts as needed.
6.3 Economic Incentives (Chapter 380)
Comptroller Scraper
[AI]
Implement scraper against Comptroller’s search portal:
Iterate for select cities.
Extract: agreement value, business name, city.
Save raw HTML/JSON to S3 and normalized entries into economic_incentives.
[AI]
Tag “Strategic Priority” leads where agreement value exceeds configured threshold.
[Human]
## Set incentives threshold & priority labeling rules

- Default threshold:
    - Strategic Priority threshold: USD 5,000,000
    - Configurable in `config/economic_incentives.yml` or env var `INCENTIVE_STRATEGIC_THRESHOLD`
- Priority labels and rules:
    - Strategic Priority — agreement_value >= threshold (default >= $5M)
    - High — agreement_value >= 1M and < threshold
    - Medium — agreement_value >= 250k and < 1M
    - Low — agreement_value < 250k
- Implementation notes:
    - [AI] Add tagging logic in ingestion/enrichment pipeline to set:
        - `lead.priority_label` (one of Strategic/High/Medium/Low)
        - `lead.priority_score` — normalized numeric score (0–100)
        - `lead.priority_reason` — e.g., `chapter_380_agreement_value`
    - [AI] Make threshold values configurable and stored in config/Secrets Manager for human override.
    - [Human] Approve final thresholds, label names, and score weighting.
    - [AI] Add a scheduled job to re-evaluate priorities (e.g., weekly) and re-tag leads if incentives change.
    - [AI] Add tests/diagnostics to ensure tagging behaves as expected around boundary values.

---

## 7. Entity Resolution (“Truth Layer”)

### Contractor Entity Model
- Table: `entities` (or `contractors`)
    - id (uuid)
    - canonical_name (string)
    - name_variants (json[] or jsonb) — array of known aliases
    - tin (string) — nullable (TIN/EIN)
    - mailing_address (text)
    - phone, email (nullable)
    - status (enum: Active, Inactive, Unknown)
    - source_links (jsonb) — array of linked permits/lead ids
    - confidence_score (float) — 0–1 match confidence
    - first_seen, last_seen (timestamps)

### [AI] Matching algorithm & enrichment
- Implement fuzzy matching pipeline:
    - Use token-based normalization: lowercasing, strip punctuation, strip business suffixes (LLC, INC, CO, LTD).
    - Matching phases:
        1. Exact canonical match on normalized name + TIN (if available).
        2. High-confidence fuzzy match (token-set ratio >= 95).
        3. Medium/low-confidence fuzzy match (token-set ratio >= 75) — flagged for Human review.
    - Use multiple metrics:
        - Levenshtein distance, token_set_ratio, Jaro-Winkler.
        - Combine with address proximity and phone/email match for higher confidence.
- Integrate Texas Comptroller FTAS search:
    - Query by name and/or TIN to fetch:
        - Active status, canonical name, TIN, mailing address.
    - On match:
        - Confirm “Active” status.
        - Attach TIN, canonical name, mailing address to entity record.
        - Update confidence_score and store source metadata.
- Conflict resolution:
    - If differing TINs are found for same normalized name — mark as ambiguous and flag for Human review.
    - If TIN matches but address mismatch: mark as possible branch and attach both (store `organization_group_id` linking siblings).
- Store match metadata:
    - `match_sources` (jsonb): list of sources (Comptroller, FTAS, permit id, TABC, etc.) with timestamps and confidence.

### [AI] Workflow & Automation
- Create a nightly batch job:
    - Read unlinked contractor names from `permits`/`leads`.
    - Attempt canonicalization and matching.
    - Insert or update `entities` table.
    - Link permits/leads → entities with `entity_id` and `link_confidence`.
- Create a human-review queue:
    - Rules to queue if:
        - confidence_score < 0.80 but > 0.65 (manual verification recommended).
        - conflicting TINs discovered.
        - entity candidate appears to represent multiple companies (branch vs main).
    - Queue stored in `entities_review_queue` for manual triage UI.

### [Human] Review & overrides
- Human responsibilities:
    - Validate ambiguous matches.
    - Approve canonical name and TIN assignments.
    - Correct and merge duplicate entity records.
    - Provide whitelists/blacklists for frequent false positives (e.g., “ABC Property Management” vs “ABC Cleaning”).
- After approval, the system should:
    - Lock approved canonical records from auto-changes or record audit history when auto-update attempted.

### Aggregation Views (reporting & downstream)
- [AI] Create SQL views/materialized views:
    - `vw_contractor_profile`:
        - fields: entity_id, canonical_name, tin, status, total_active_jobs, total_value_of_active_jobs, geography_coverage (array), recent_activity_date
        - Joins: `entities` ← `permits` / `leads` / `economic_incentives`
    - `vw_leads_by_entity`:
        - fields: entity_id, lead_id, lead_score, lead_type, created_at, last_updated
    - `vw_entity_summary`:
        - fields: entity_id, avg_lead_score, highest_value_lead, count_leads_by_type
- [AI] Materialize heavy aggregations:
    - Use materialized views refreshed nightly or incremental updates for:
        - Top contractors by total valuation in the last 12 months.
        - Strategic Priority-linked contractors.
- [Human] Confirm KPIs for downstream users:
    - e.g., average project size, number of active permits in last 12 months, strategic leads count.
    - Provide which fields are critical for downstream dashboards or automated alerts.

### Additional gotchas & constraints
- Respect privacy and legal constraints when storing TINs and personal information.
- Add rollback/merge routines:
    - When a Human merges entities, run a reconciliation job to move linked permits/leads and rebuild derived fields.
- Provide tests:
    - Unit tests for various fuzzy-match cases.
    - Integration tests against FTAS search results (mocked for CI).
- Add logging and audit:
    - All auto matches and manual overrides logged with user id, timestamp, and reason.

[AI]
Build SQL views or materialized views:
contractor_profile showing all active jobs, valuations, geographies.
[Human]
Confirm which contractor KPIs are important for downstream users (e.g., average project size, recent activity).

8. Geospatial Resolution
Geocoding & Parcel Assignment
[AI]
Integrate with geocoding service (Nominatim, AWS Location, or vendor).
Normalize address strings and generate geometry.
[Human]
Set up account for any paid geocoding provider if used.
[AI]
Implement spatial joins in PostGIS to assign parcel_id and overlay districts (e.g., TIF).
Complex Queries
[AI]
Implement stored procedures or API endpoints to answer:
“Permits in this polygon / TIF district.”
“TABC within 500 ft. of zoning case geometry.”

9. Reliability, Monitoring, and DLQ
DLQ Implementation
[AI]
Implement DLQ paths in S3:
s3://alse-lake/dlq/{source}/{ingestion_id}.json
Modify ingestion to route invalid records to DLQ instead of discarding.
[AI]
Build Airflow DAG: replay_dlq to reprocess after logic fixes.
Monitoring & Alerting
[AI]
Integrate Airflow with alerting (email/Slack/Webhook).
Define alerts on:
DAG failures.
Schema drift detection.
Sudden drops to near-zero in expected daily record counts.
[Human]
Provide notification channels and recipients.
Rate Limiting Controls
[AI]
Implement client-side throttling for Socrata, ArcGIS, and scrapers.
[Human]
If municipalities publish explicit limits, feed limits to config.

10. Application & UX Layer (Optional Initial Scope)
Internal API / Backend
[AI]
Implement REST API endpoints:
/leads with filters (city, valuation, type, score).
/contractors/{id} profile endpoint.
/zoning/{id} detailed view.
[Human]
Approve which endpoints must be exposed first for internal users.
Basic Web Dashboard
[AI]
Sketch React or similar SPA:
Lead list with filters & scoring.
Map view of permits.
Drill-down to contractor and project detail.
[Human]
Provide branding requirements, if any.

11. Human-in-the-Loop Checkpoints
To keep this efficient but safe, enforce explicit Human review at these steps:
Creation of all external accounts and acceptance of any ToS.
Setting final business rules:
Valuation thresholds.
Priority definitions (Strategic, Normal, Low).
Reviewing:
First 50–100 leads from each new pipeline.
First 20 LLM-enriched zoning cases for correctness.
First batch of entity matches (contractor resolution).
Approving production deployment after staging tests.

If you want, I can now convert this into a structured checklist (Markdown table, Notion-ready, or directly into a Google Tasks / Calendar plan) optimized for an AI agent to tick off step by step.
Turn this todo into a phased Gantt-style timeline with week-by-week milestones and dependencies.
Below is a phased, Gantt‑style implementation plan over ~16 weeks, based directly on the todo. Each phase is broken into weekly milestones with explicit dependencies and clear “AI vs Human” responsibilities.
You can paste this into a PM tool (e.g., Linear, Jira, Notion, Asana) or a spreadsheet and map it to actual calendar dates.

Phase 0 – Planning & Stack Confirmation (Week 1)
Week 1 – Foundation & Decisions
W1.1 – Tech Stack & Scope Confirmation
[AI] Propose detailed stack and architecture:
Backend (FastAPI or Express), Airflow, PostgreSQL + PostGIS, S3/Bucket structure, proxies, LLM provider.
[Human] Approve or adjust stack and confirm:
Cloud provider (AWS/Azure).
Permissible tools/vendors (proxy, LLM, geocoding).
W1.2 – Requirements & Priority Rules
[AI] Draft:
LeadType ontology (COMMERCIAL_NEW, TENANT_TURNOVER, etc.).
Initial lead scoring rules.
Valuation thresholds by role (GC vs specialty trades).
[Human] Review and finalize:
Business rules for scoring, valuation filters, and “Strategic Priority” thresholds.
Dependencies: None – starting point.

Phase 1 – Core Infrastructure (Weeks 2–3)
Week 2 – Cloud, Data Lake, and DB
W2.1 – Cloud & IAM Setup
[AI] Generate Terraform/CloudFormation for:
S3/Blob Data Lake buckets with Bronze/Landing/DLQ paths.
Minimal IAM policies for ALSE services.
[Human]
Create cloud account (if needed).
Apply IaC, create IAM roles/users, and verify access.
W2.2 – PostgreSQL/PostGIS Provisioning
[AI] Generate:
DB creation script with PostGIS.
Initial schema draft (core tables: permits, co_certificates, zoning_cases, tabc_licenses, entities, leads, lead_scores).
[Human]
Provision DB (RDS or similar) and run migration scripts.
Store credentials in secret manager.
Week 3 – Airflow & Baseline Project Structure
W3.1 – Airflow Orchestrator Deployment
[AI] Provide:
Docker Compose / Helm values.
Connection setup guidelines (S3, DB).
[Human]
Deploy Airflow (staging environment).
Configure Airflow connections and variables (DB URI, S3 buckets, secret paths).
W3.2 – Repo & Project Structure
[AI] Scaffold codebase:
ingestion/ (connectors),
transform/,
enrichment/,
dags/ (Airflow DAGs),
infra/ (Terraform).
[Human]
Review repo structure and approve CI/CD basics (lint, tests).
Dependencies:
Phase 1 depends on Phase 0 (stack & provider decisions).

Phase 2 – Core Ingestion Connectors (Weeks 4–7)
Week 4 – Dallas Socrata Connector
W4.1 – External Accounts & Secrets
[AI] Provide step-by-step instructions for:
Socrata developer registration.
[Human]
Create Socrata accounts and App Tokens (Dallas + Texas).
Provide dataset IDs and store tokens in secrets manager.
W4.2 – Dallas Connector Implementation
[AI] Implement:
Delta fetch logic using issued_date watermark.
Pagination with $limit/$offset.
Metadata fetch and schema signature hashing.
Write raw responses to S3 Bronze with source/date/ingestion_id.
[AI] Build Airflow DAG: ingest_dallas_permits with tasks:
fetch_metadata → fetch_delta → write_to_s3 → update_watermark.
[Human]
Enable DAG, run first manual execution, verify sample data in S3.
Dependencies:
Requires Airflow, S3, DB, and Socrata token from Weeks 2–3.

Week 5 – Fort Worth ArcGIS Connector
W5.1 – Generic ArcGIS Client
[AI] Implement:
ObjectID paging (where=1=1 + orderByFields=OBJECTID ASC).
returnGeometry=false default.
Configurable batch size and retry logic.
W5.2 – Fort Worth Permits Ingestion
[AI] Build:
Fort Worth-specific connector using generic client.
Status filter: include Applied, In Review, Issued, Amendment; exclude Finaled, Expired, Withdrawn, Void.
Derived normalized_type (e.g., COMMERCIAL_SHELL).
[AI] Add Airflow DAG: ingest_fortworth_permits.
[Human]
Provide exact ArcGIS endpoint URLs & layer IDs.
Validate sample data in S3 and DB staging.
Dependencies:
Requires ArcGIS endpoints and infrastructure from earlier weeks.

Week 6 – Arlington Proxy & Permit Applications
W6.1 – Proxy Service
[AI] Implement backend proxy:
GET /api/proxy/arlington/{resource} that forwards to Arlington ArcGIS with safe headers, logging, and rate limiting.
[Human]
Deploy proxy (API Gateway / ALB).
Configure auth if needed and share internal URL.
W6.2 – Arlington Permit Applications Connector
[AI] Build connector using proxy:
Query Permit_Applications FeatureServer.
Filter STATUSDESC in Application Incomplete, In Review, Resubmittal Required.
Store raw data in S3 Bronze.
[AI] Add DAG: ingest_arlington_permit_applications.
[Human]
Test DAG, verify Golden-Hour records ingested.
Dependencies:
Needs Airflow, S3, and deployed proxy; builds on ArcGIS client patterns.

Week 7 – Scraper Node (Dallas Food, Plano, MGO Skeleton)
W7.1 – Headless Scraper Container
[AI] Provide Dockerfile for Playwright-based scraper (Python or Node).
[Human]
Build and push image to container registry.
Give Airflow permission to run this image (KubernetesPodOperator/Celery).
W7.2 – Dallas Food Inspections Scraper
[AI] Implement Playwright script:
Navigate to portal, apply “Last 7 Days”.
Intercept XHR JSON responses, store as raw JSON in S3 Bronze.
Add lightweight anti-bot patterns (User-Agent rotation, delays, proxy toggle).
[AI] DAG: ingest_dallas_food_inspections.
[Human]
Run on low frequency first, validate data, then schedule daily.
W7.3 – Plano Excel Parser (V1)
[AI] Implement:
Downloader for weekly .xlsx.
pandas parser that identifies columns by header keyword.
Writes normalized rows to staging tables.
[Human]
Provide URLs or navigation steps; confirm schedule (weekly).
(MGO connector can be started here and finished in a later iteration if needed.)
Dependencies:
Airflow, S3, container infrastructure, proxies.

Phase 3 – Normalization, Leads, and Scoring (Weeks 8–10)
Week 8 – Normalization Engine & Core Tables
W8.1 – Normalization Logic
[AI] Implement ETL jobs (dbt / Python) to:
Read raw Dallas/Fort Worth/Arlington datasets from S3.
Map them into unified permits schema.
Apply LeadType ontology.
[AI] Create mapping tables & scripts:
source_field_mappings, lead_type_mappings.
W8.2 – CO Proxy & Tenant Turnover
[AI] Build CO pipeline:
Ingest Dallas CO dataset (Socrata).
Filter land_use ∈ {OFFICE, RETAIL, RESTAURANT, MEDICAL}.
Tag “Clean & Show” as TENANT_TURNOVER and insert into co_certificates and leads.
[Human]
Review first 100 normalized permit rows & CO leads; approve mappings.
Dependencies:
Core ingestion from Phase 2; DB schemas from Phase 1.

Week 9 – Lead Scoring & Basic Geo Foundation
W9.1 – Lead Scoring Implementation
[AI] Implement scoring function & job:
Apply valuation, signal matching, entity verification, project type, and decay rules.
Store scores in lead_scores.
[AI] Airflow DAG score_leads (weekly or daily).
W9.2 – Geocoding Integration (Phase 1)
[AI] Choose geocoding strategy and implement client (Nominatim/AWS/other).
[Human]
If paid provider: create account, API keys, and rate limits.
[AI] Implement batch geocoding for new permits, store geometry in DB.
Dependencies:
Normalization Engine functional; DB & Airflow in place.

Week 10 – DLQ, Monitoring, and Reliability
W10.1 – DLQ Implementation
[AI] Update ingestion connectors to:
Route invalid records (schema errors, missing critical fields) to s3://.../dlq/{source}/{ingestion_id}.json.
[AI] Airflow DAG: replay_dlq to reprocess after fixes.
W10.2 – Monitoring & Alerts
[AI] Configure:
Metrics for record counts, task success/failure.
Anomaly detection on volume drops.
[Human]
Provide alert channels (Slack/email) and recipients.
Validate alerts for a test failure scenario.
Dependencies:
All earlier ingestion pipelines; Airflow and S3.

Phase 4 – Creative Signals & Entity Resolution (Weeks 11–14)
Week 11 – TABC Integration & Ghost Leads
W11.1 – TABC Ingestion
[AI] Implement Socrata connector for naix-2893:
Numeric query: obligation_end_date_yyyymmdd &gt; 20250101 (no quotes).
Filter Application Type = Original, License Type in MB, BG.
Store raw and normalized records (tabc_licenses).
[AI] Airflow DAG: ingest_tabc_licenses.
W11.2 – Ghost Lead Generation
[AI] Enrichment job:
Match TABC locations to permits by address proximity.
If no matching permit → create Ghost Lead in leads.
[Human]
Review a sample set of matches/non-matches, adjust matching thresholds.
Dependencies:
Normalization & Geo (basic geocoding helpful); Socrata token.

Week 12 – Legistar Zoning & LLM Enrichment
W12.1 – Legistar API Ingestion
[AI] Implement client for webapi.legistar.com/v1/{Client}/Matters:
Clients: Dallas, FortWorth.
Filter: MatterType = 'Zoning Case' and MatterDate &gt; .
Save metadata and PDF URLs to zoning_cases_raw.
[AI] DAG: ingest_zoning_matters.
W12.2 – PDF Download & Text Extraction
[AI] Implement:
PDF downloader.
Text extractor (e.g., PyPDF).
Store text in S3 and link to DB records.
W12.3 – LLM Enrichment
[AI] Build enrichment module:
Send text to LLM with prompt to extract: Proposed Use, Acreage, Developer Name, Project Description.
Store structured fields in zoning_cases and create/upgrade leads.
[Human]
Review first 20–30 zoning cases for quality and adjust prompt logic.
Dependencies:
LLM API key, Airflow, S3, DB.

Week 13 – Economic Incentives (Chapter 380)
W13.1 – Comptroller Scraper
[AI] Implement Playwright/requests scraper:
Query for “City of Dallas” and “City of Fort Worth”.
Extract: agreement value, business name, dates, city.
Store raw in S3 + normalized economic_incentives.
[AI] DAG: ingest_economic_incentives.
W13.2 – Strategic Priority Tagging
[AI] Logic to:
Tag leads as “Strategic Priority” when linked to 380 agreements above threshold (e.g., > $5M).
[Human]
Confirm thresholds and tagging rules; adjust scoring weight if needed.
Dependencies:
Scraper infra & DLQ; DB & leads table.

Week 14 – Entity Resolution (Truth Layer)
W14.1 – Contractor Matching & FTAS Integration
[AI] Implement:
Fuzzy matching routine for contractor names across permits.
Connector to Texas Comptroller FTAS search.
Enrichment pipeline: assign TIN, canonical name, mailing address, status.
[AI] Populate entities table and link permits/leads.
W14.2 – Manual Review Loop
[Human]
Review ambiguous matches (below/above similarity threshold).
Approve or correct entity linkages.
[AI]
Integrate manual decisions back into matching logic (whitelists/blacklists).
Dependencies:
Sufficient permit data volume; Comptroller site accessible.

Phase 5 – Geospatial & App Layer (Weeks 15–16)
Week 15 – Advanced Geospatial & District Overlays
W15.1 – Spatial Joins & District Mapping
[AI] Implement PostGIS operations:
Assign parcel_id via parcel maps (if available).
Overlay permits/TABC/zoning with polygons (e.g., TIF districts, neighborhoods).
[AI] Create queries or views for:
“All leads within district X”.
“TABC within 500 ft of zoning case Y”.
W15.2 – Performance Tuning
[AI] Add indexes (spatial, btree on critical fields).
[Human]
Provide typical query patterns so tuning can match real usage.
Dependencies:
Core geocoding and DB.

Week 16 – Internal API & Minimal Dashboard (Optional but Recommended)
W16.1 – Internal REST API
[AI] Implement service (FastAPI/Express):
/leads with filters (city, valuation, type, score, date).
/contractors/{id} – contractor profile view.
/zoning/{id} – enriched zoning details.
[Human]
Approve which endpoints are exposed outside engineering.
W16.2 – Minimal Web Dashboard
[AI] Build simple SPA:
Table: sorted leads by score with filters.
Detail drawer: lead details, related permits, signals (zoning, TABC, CO, incentives).
Basic map view of current leads.
[Human]
Provide branding, confirm user roles, and help run UAT with internal users.
Dependencies:
Leads, scoring, entities, and geospatial features finished.

Human-in-the-Loop Checkpoints (Across Phases)
Insert explicit “Human Review” milestones at:
End of Week 1 – stack & business rules signed off.
End of Week 4–6 – ingestion output sanity checks (Dallas, Fort Worth, Arlington).
End of Week 8–9 – normalization and scoring validated.
End of Week 11–12 – TABC & zoning/LLM enrichment accuracy checks.
End of Week 14 – entity resolution quality confirmed.
End of Week 16 – go/no‑go decision for internal rollout.

If you tell me your desired start date, I can map these weeks to exact calendar dates and generate a table you can paste directly into Excel/Sheets with start/end dates and tly.
RetryContact support

