/**
 * API Proxy: Fort Worth Open Data (ArcGIS FeatureServer)
 * 
 * This endpoint proxies requests to Fort Worth's ArcGIS FeatureServer,
 * resolving CORS issues and enabling server-side caching.
 * 
 * Usage: GET /api/permits-fortworth?limit=20&offset=0
 */

interface FWRawPermit {
  attributes: {
    Unique_ID?: string;
    Permit_No?: string;
    Permit_Type?: string;
    Permit_SubType?: string;
    Full_Street_Address?: string;
    Zip_Code?: string;
    B1_WORK_DESC?: string;
    [key: string]: any;
  };
}

interface FWProxyResponse {
  success: boolean;
  data?: FWRawPermit[];
  error?: string;
  cached?: boolean;
  timestamp: number;
}

const FW_API_ENDPOINT = 'https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/CFW_Open_Data_Development_Permits_View/FeatureServer/0/query';

// Simple in-memory cache (replace with Redis in production)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: Record<string, any>): string {
  return `fortworth_${JSON.stringify(params)}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const limit = req.query.limit || '20';
    const offset = req.query.offset || '0';

    // Build ArcGIS query parameters
    const resultOffset = parseInt(offset) || 0;
    const resultRecordCount = parseInt(limit) || 20;

    const params = new URLSearchParams({
      'outFields': '*',
      'where': '1=1',
      'resultOffset': resultOffset.toString(),
      'resultRecordCount': resultRecordCount.toString(),
      'f': 'json'
    });

    const cacheKey = getCacheKey({ limit, offset });

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return res.status(200).json({
        success: true,
        data: cached.data,
        cached: true,
        timestamp: Date.now()
      } as FWProxyResponse);
    }

    // Fetch from Fort Worth ArcGIS API
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'FinishOutNow-Backend/1.0'
    };

    const response = await fetch(`${FW_API_ENDPOINT}?${params.toString()}`, {
      headers,
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Fort Worth API Error: ${response.statusText} (${response.status})`);
    }

    const geoData = await response.json();
    const data: FWRawPermit[] = geoData.features || [];

    // Cache the result
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      data,
      cached: false,
      timestamp: Date.now()
    } as FWProxyResponse);

  } catch (error: any) {
    console.error('[Fort Worth API Proxy] Error:', error?.message);

    return res.status(502).json({
      success: false,
      error: error?.message || 'Failed to fetch Fort Worth permits',
      timestamp: Date.now()
    } as FWProxyResponse);
  }
}
