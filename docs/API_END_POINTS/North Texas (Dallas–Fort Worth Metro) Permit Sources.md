**North Texas (Dallas–Fort Worth Metro) Permit Sources** 

The Dallas–Fort Worth metroplex is the core of FinishOutNow’s business. The cities here publish a mixture of open APIs and legacy reports, and several counties offer supplemental data. This document summarises the endpoints and scraping targets for each major municipality in the region. 

**Dallas** 

•    
**Socrata API (primary)** – https://www.dallasopendata.com/resource/e7gq-4sah.json provides real‑time building‑permit records. Filter on permit\_type (e.g., Building (BU)  Commercial Alteration/New ) and issued\_date to find commercial remodels and tenant improvements. The API includes permit number, issue date, site address, declared valuation and an 1   
unstructured work\_description that should be parsed for keywords like **“finish out”** . Use the complementary **Certificate of Occupancy** dataset to detect change‑of‑use or new tenant occupancy before construction begins. 

•    
**Web‑portal scraping** – Dallas’s online permit portal (ePlan) lists pending permits and plan‑review status. A headless browser can log in and periodically pull new submissions, capturing leads hours before they appear on the open‑data feed. 

•    
**City council agendas & economic development minutes** – Monitor agendas for tax‑increment reinvestment zones (TIRZ) and development incentives. These documents often signal major projects months before permits are filed【API\_ENDPOINT\_RESEARCH.md】. 

**Fort Worth** 

•    
**ArcGIS API** – https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/ CFW\_Open\_Data\_Development\_Permits\_View/FeatureServer/0/query . Pass  where=STATUS IN ('Applied','Issued') and list fields like Permit\_No , Permit\_Type ,  2 3   
Permit\_SubType , B1\_WORK\_DESC (work description) and Full\_Street\_Address . Filtering on STATUS='Applied' surfaces applications before they become permits. The service 4   
supports pagination and orderByFields . 

•    
**City permit portal scraping** – Fort Worth’s permitfinder site can be scraped via headless automation. It exposes contractor names, valuations and permit history not found in the open‑data feed. 

•    
**Certificates of Occupancy** – Another ArcGIS FeatureServer holds CO records. These indicate tenant turnover and changes of use that may not be captured as construction permits. 

**Arlington** 

•    
**Permit Applications (ArcGIS)** – Layer 9 of Arlington’s permitting service exposes a 1‑year view of 

applications with fields InDate , STATUSDESC , WORKDESC and  1  
5   
ConstructionValuationDeclared . Monitor statuses like “Application Incomplete” or “In Review” to contact applicants before permits are issued. 

•    
**Issued Permits (ArcGIS)** – Layer 1 provides a 3‑year history of issued permits, including  6   
ISSUEDATE , FOLDERNAME (project address), WORKDESC and declared valuation . •    
**Zoning Cases (ArcGIS)** – Arlington’s Planning\_Zoning\_Cases layer lists zoning case numbers, addresses, filing dates and descriptions. These cases often predate permits by several months 【01\_LEAD\_SOURCING\_BLUEPRINT.md】. A server‑side proxy is needed to bypass CORS restrictions. 

**Plano** 

•    
**Weekly Excel reports** – Plano’s Building Inspections Division posts weekly spreadsheets for  **Commercial Building**, **Interior Finish‑Out** and **Certificates of Occupancy** on plano.gov . Parse these .xlsx files to extract permit numbers, issue dates, addresses, valuations, contractors and descriptions. The separate **Interior Finish Out** report is especially valuable for tenant‑improvement work【01\_LEAD\_SOURCING\_BLUEPRINT.md】. 

•    
**EnerGov/MGO portal** – In the absence of an open API, a headless browser can log into Plano’s EnerGov/My Government Online portal to pull daily permit summaries. 

**Irving** 

•    
**ArcGIS Hub datasets** – Irving republishes My Government Online data as **Commercial Building Permits** and **Residential Building Permits** datasets on  

data‑cityofirving.opendata.arcgis.com . Use the ArcGIS REST endpoint (e.g., /arcgis/ rest/services/Permits/FeatureServer/0 ) to retrieve permit number, issue date, valuation and address. If Invalid URL errors occur, ensure the path uses all lowercase letters. 

•    
**MGO portal scraping** – When ArcGIS feeds are unavailable, scrape the My Government Online 

permit search by automating the “Last 7 Days” query. This is more brittle but yields real‑time data. **Frisco** 

•    
**Monthly PDF reports** – Frisco’s Development Services publishes monthly PDFs for **Commercial** 7   
**Permits**, **Permit Activity (prior month)**, **Commercial Certificates of Occupancy**, etc. . Download these PDFs and extract tables using a PDF parser (e.g., tabula, pdfplumber). Although 

monthly, they provide aggregated valuations and contractor names. 

•    
**eTRAKiT portal** – The city’s eTRAKiT site lists active permits. A headless browser can search this portal to capture new submissions daily. 

**Collin County** 

•    
**Texas Open Data (Socrata)** – The Collin CAD Building Permits dataset provides permit numbers, type codes, issued dates, valuations, builder names and property IDs for the last three 8 9   
years . Use the OData API to pull data daily. This county‑level dataset helps cross‑validate valuations and track builder activity across multiple cities. 

2  
1   
Issued Construction Permits \- Catalog 

https://catalog.data.gov/dataset/issued-construction-permits 

2 3 4   
services5.arcgis.com 

https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/CFW\_Open\_Data\_Development\_Permits\_View/ FeatureServer/0 

5   
Layer: Permit Applications (ID: 9\) 

https://gis2.arlingtontx.gov/agsext2/rest/services/OpenData/OD\_Property/MapServer/9 

6   
Layer: Issued Permits (ID: 1\) 

https://gis2.arlingtontx.gov/agsext2/rest/services/OpenData/OD\_Property/MapServer/1 

7   
REPORTS | Frisco, TX \- Official Website 

https://www.friscotexas.gov/614/Reports 

8 9   
Collin CAD Building Permits | Open Data Portal  

https://data.texas.gov/dataset/Collin-CAD-Building-Permits/82ee-gbj5/about\_data 3