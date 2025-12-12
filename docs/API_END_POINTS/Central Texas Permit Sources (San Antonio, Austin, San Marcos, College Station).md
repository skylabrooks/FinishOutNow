**Central Texas Permit Sources (San Antonio, Austin, San Marcos, College Station)** 

Central Texas cities publish a variety of open datasets and reports. This document summarises the best channels for early access to permit information across San Antonio, Austin, San Marcos and College Station. 

**San Antonio** 

•    
**Applications Submitted CSV (high value)** – The city’s open‑data portal hosts two CSVs: **Permits Issued** and **Applications Submitted**. The **Applications Submitted** file lists all building and trade 1   
permit applications filed during the current year . Key fields include application date, permit type, project value and address. Because it captures applications before issuance, this dataset provides one of the earliest signals available. 

•    
**Permits Issued CSV** – Once permits are approved, they appear in the issued permits file. Use this to 

confirm when an application becomes active. 

•    
**Legacy permit portal** – For older records (pre‑2020), San Antonio maintains a legacy permit data 

portal. Scraping or downloading archived reports can fill historical gaps. 

**Austin** 

•    
**Socrata API (Issued Construction Permits)** – https://data.austintexas.gov/resource/ 3syk-w9eu.json returns fields such as permit type, permit number, issue date,  2   
work\_description , contractor information and declared valuation . Filter by issue\_date and permit\_type to isolate commercial remodels or tenant finish‑outs. Austin does not currently 3   
publish permit applications, but the issue dates allow fairly prompt targeting . 

•    
**Historic building permits** – Dataset 3z4i-4ta5 contains historic issued permits (back to 2006). Useful for trend analysis and training models, though not for real‑time leads. •    
**Permit portal scraping** – Austin’s AMANDA permitting portal lists permit stages such as “In Review,” 

“Returned” and “Ready for Issuance.” A headless browser can be used to extract these statuses for early intelligence. 

**San Marcos** 

•    
**ArcGIS API** – The CoSM\_BuildingPermits layer on the city’s ArcGIS server includes fields  4 5   
STATUS , LANDUSE , TYPE , APPLIED , ISSUED , VALUE and DESCRIPTION . Because the data originates from the MyPermitNow system, the APPLIED date captures the application stage, and STATUS values such as “Applied” and “In Review” reveal projects before they are issued. 

•    
**MyPermitNow portal** – For additional detail, scrape MyPermitNow’s public search (when available) 

for project descriptions and applicant information. 1  
**College Station** 

•    
**Weekly permit reports** – The Planning and Development Services Department posts weekly “Building Permits Issued” reports. The site notes that building‑permit activity is updated weekly with 6   
permits issued in the previous week . Each year has its own folder (e.g., “Building Permits Issued – 2025”) containing spreadsheets or PDFs. Download and parse these reports to capture issue dates, addresses, valuations and contractor names. 

1   
Building Permits \- Dataset \- Open Data SA 

https://data.sanantonio.gov/dataset/building-permits 

2   
data.austintexas.gov 

https://data.austintexas.gov/resource/3syk-w9eu.json 

3   
Issued Construction Permits \- Catalog 

https://catalog.data.gov/dataset/issued-construction-permits 

4 5   
Layer: CoSM\_BuildingPermits (ID: 0\) 

https://smgis.sanmarcostx.gov/arcgis/rest/services/Planning/CoSM\_BuildingPermits/FeatureServer/0 

6   
Building Permits Issued | City of College Station 

https://www.cstx.gov/your-government/departments/planning-development-department/building-permits-issued/ 2