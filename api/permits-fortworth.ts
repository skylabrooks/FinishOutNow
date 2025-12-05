/**
 * API Proxy: Fort Worth Open Data
 * 
 * This endpoint proxies requests to Fort Worth Open Data API,
 * resolving CORS issues and enabling server-side caching.
 * 
 * Usage: GET /api/permits-fortworth?limit=20&offset=0
 */

interface FWRawPermit {
  record_id: string;
  permit_type: string;
  job_value: string;
  address: string;
  status_date: string;
  description: string;
  applicant_name: string;
  status: string;
}

interface FWProxyResponse {
  success: boolean;
  data?: FWRawPermit[];
  error?: string;
  cached?: boolean;
  timestamp: number;
}

const FW_API_ENDPOINT = 'https://data.fortworthtexas.gov/resource/qy5k-jz7m.json';

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

    // Build SoQL query
    const query = [
      '$where=(permit_type like \'%Commercial%\' OR permit_type like \'%Remodel%\') AND status != \'Withdrawn\'',
      '$order=status_date DESC',
      `$limit=${limit}`,
      `$offset=${offset}`
    ].join('&');

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

    // Fetch from Fort Worth API
    const response = await fetch(`${FW_API_ENDPOINT}?${query}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinishOutNow-Backend/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Fort Worth API Error: ${response.statusText} (${response.status})`);
    }

    const data: FWRawPermit[] = await response.json();

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
