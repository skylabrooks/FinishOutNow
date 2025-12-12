**Supplemental Statewide Signals (Beyond Permits)** 

While construction permits are the primary lead source, several other signals can reveal upcoming tenant‑improvement projects across Texas. This document summarises the most important statewide datasets and scraping targets that complement local permit data. 

**Liquor‑License Applications** 

•    
**TABC License Information (Socrata API)** – New bars, restaurants and breweries often file Texas Alcoholic Beverage Commission applications before starting construction. The naix‑2893 dataset on the Texas Open Data portal lists all licenses with fields for license type, application dates and 1   
managing entities . Use numeric comparisons (e.g., obligation\_end\_date\_yyyymmdd \>  20240101 ) to avoid query errors and filter for pending applications in target cities. Cross‑reference licensee names with building‑permit feeds to identify hospitality projects. 

**Food‑Inspection Pre‑opening Data** 

•    
**Dallas health inspections** – Dallas’s old food‑inspection dataset was sunset, and updated inspection 2   
data now resides at inspections.myhealthdepartment.com/dallas . Scrape “Pre‑opening” or “Initial inspection” records to discover restaurants about to open, which often correlate with tenant‑improvement work. 

**Zoning and Land‑Use Cases** 

•    
**Arlington Planning\_Zoning\_Cases (ArcGIS)** – This layer includes case numbers, addresses, dates filed, descriptions and statuses. Zoning cases and variances typically appear months before building permits【01\_LEAD\_SOURCING\_BLUEPRINT.md】. Similar data may be available for other cities via council agendas or planning‑department dockets; monitor these sources for early signals. 

**County Appraisal Records** 

•    
**Property‑valuation datasets** – County appraisal districts (e.g., Dallas CAD, Tarrant CAD, Collin CAD) 

publish property‑tax records. Look for ownership transfers, large valuation increases or property reclassifications, as these often precede renovations. Collin CAD’s building‑permit dataset is a useful 3   
example . 

**Utility Connections** 

•    
**Electric and water meter requests** – New commercial meter connections are a strong precursor to 

tenant build‑outs. There is no public API for Oncor (electric) or municipal water utilities, but you can request weekly reports directly. Integrating these lists with permit data can highlight projects that 

1  
may not require traditional permits, such as interior finish‑outs in existing shells 【API\_ENDPOINT\_RESEARCH.md】. 

1   
TABC License Information | Open Data Portal  

https://data.texas.gov/dataset/TABC-License-Information/7hf9-qc9f/about\_data 

2   
www.dallasopendata.com 

https://www.dallasopendata.com/api/views/dri5-wcct 

3   
Collin CAD Building Permits | Open Data Portal  

https://data.texas.gov/dataset/Collin-CAD-Building-Permits/82ee-gbj5/about\_data 2