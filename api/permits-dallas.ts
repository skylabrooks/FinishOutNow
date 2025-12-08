/**
 * API Proxy: Dallas Open Data
 * 
 * This endpoint proxies requests to Dallas Open Data API,
 * resolving CORS issues and enabling server-side caching.
 * 
 * Usage: GET /api/permits-dallas?limit=20&offset=0
 */

interface DallasRawPermit {
  permit_type: string;
  permit_no: string;
  address: string;
  issue_date: string;
  valuation: string;
  applicant_name: string;
  work_description: string;
  status: string;
}

interface DallasProxyResponse {
  success: boolean;
  data?: DallasRawPermit[];
  error?: string;
  cached?: boolean;
  timestamp: number;
}

const DALLAS_API_ENDPOINT = 'https://www.dallasopendata.com/resource/e7gq-4sah.json';

// Simple in-memory cache (replace with Redis in production)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: Record<string, any>): string {
  return `dallas_${JSON.stringify(params)}`;
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
      '$where=(permit_type like \'Commercial\' OR permit_type = \'Certificate of Occupancy\') AND valuation > 1000',
      '$order=issue_date DESC',
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
      } as DallasProxyResponse);
    }

    // Fetch from Dallas API with authentication
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'FinishOutNow-Backend/1.0'
    };

    // Add Socrata API credentials if available (increases rate limits)
    const apiKeyId = process.env.VITE_DALLAS_API_KEY_ID;
    const apiKeySecret = process.env.VITE_DALLAS_API_KEY_SECRET;
    
    if (apiKeyId && apiKeySecret) {
      // Use HTTP Basic Auth for Dallas Socrata API (keyId:secret)
      const credentials = Buffer.from(`${apiKeyId}:${apiKeySecret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (apiKeyId) {
      // Fallback to X-App-Token if only key ID available
      headers['X-App-Token'] = apiKeyId;
    }

    const response = await fetch(`${DALLAS_API_ENDPOINT}?${query}`, {
      headers,
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Dallas API Error: ${response.statusText} (${response.status})`);
    }

    const data: DallasRawPermit[] = await response.json();

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
    } as DallasProxyResponse);

  } catch (error: any) {
    console.error('[Dallas API Proxy] Error:', error?.message);

    return res.status(502).json({
      success: false,
      error: error?.message || 'Failed to fetch Dallas permits',
      timestamp: Date.now()
    } as DallasProxyResponse);
  }
}
