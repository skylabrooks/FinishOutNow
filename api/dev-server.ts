/**
 * Local Development API Server
 * 
 * This is a simple Express-like Node.js server for local development.
 * It mimics the Vercel/serverless API route behavior.
 * 
 * Usage: npx ts-node api/dev-server.ts
 * Or: npx tsx api/dev-server.ts (recommended)
 * 
 * This will start the API server on http://localhost:3001
 * while the Vite dev server runs on http://localhost:3000
 */

import http from 'http';
import url from 'url';
import { URLSearchParams } from 'url';

// Type definitions for handler
interface ApiRequest {
  method: string;
  query: Record<string, string>;
  url: string;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
}

// Helper: JSON response builder
const jsonResponse = (res: http.ServerResponse) => ({
  status: (code: number) => {
    res.statusCode = code;
    return jsonResponse(res);
  },
  json: (data: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  }
});

// Simulated handler for Dallas
async function handleDallasPermits(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const limit = req.query.limit || '20';
    const offset = req.query.offset || '0';
    
    console.log(`[Dallas Proxy] Received query params:`, req.query);

    // Simpler query - just get recent permits
    // Note: Dallas API uses 'issued_date' not 'issue_date'
    const params = new URLSearchParams({
      '$order': 'issued_date DESC',
      '$limit': limit,
      '$offset': offset
    });

    const endpoint = `https://www.dallasopendata.com/resource/e7gq-4sah.json?${params.toString()}`;

    console.log(`[Dallas Proxy] Full endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinishOutNow-Backend/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Dallas API Error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    console.log(`[Dallas Proxy] ✓ Fetched ${data.length} permits`);

    res.status(200).json({
      success: true,
      data,
      cached: false,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('[Dallas Proxy] ✗ Error:', error?.message);
    res.status(502).json({
      success: false,
      error: error?.message || 'Failed to fetch Dallas permits',
      timestamp: Date.now()
    });
  }
}

// Simulated handler for Fort Worth
async function handleFortWorthPermits(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const limit = req.query.limit || '20';
    const offset = req.query.offset || '0';

    const resultOffset = parseInt(offset, 10) || 0;
    const resultRecordCount = parseInt(limit, 10) || 20;

    const params = new URLSearchParams({
      'outFields': '*',
      'where': '1=1',
      'resultOffset': resultOffset.toString(),
      'resultRecordCount': resultRecordCount.toString(),
      'f': 'json'
    });

    const endpoint = `https://services5.arcgis.com/3ddLCBXe1bRt7mzj/arcgis/rest/services/CFW_Open_Data_Development_Permits_View/FeatureServer/0/query?${params.toString()}`;

    console.log(`[Fort Worth Proxy] Full endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinishOutNow-Backend/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Fort Worth API Error: ${response.statusText} (${response.status})`);
    }

    const geoData = await response.json();

    if (geoData.error) {
      const detailMessage = geoData.error.message || 'Unknown Fort Worth API error';
      const combinedDetails = Array.isArray(geoData.error.details)
        ? geoData.error.details.join(' | ')
        : '';

      const errorMessage = combinedDetails
        ? `${detailMessage}: ${combinedDetails}`
        : detailMessage;

      throw new Error(`Fort Worth API Error: ${errorMessage}`);
    }

    const data = geoData.features || [];

    res.status(200).json({
      success: true,
      data,
      cached: false,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[Fort Worth Proxy] ✗ Error:', error?.message);
    res.status(502).json({
      success: false,
      error: error?.message || 'Failed to fetch Fort Worth permits',
      timestamp: Date.now()
    });
  }
}

// Handler for Arlington permits (ArcGIS)
// Uses Planning & Zoning Cases as proxy for early-stage commercial activity
// Building permits endpoint not publicly available, so we use zoning cases as signal
async function handleArlingtonPermits(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const limit = req.query.limit || '20';
    
    console.log(`[Arlington Proxy] Fetching from ArcGIS Planning & Zoning...`);
    
    // Arlington Planning & Zoning Cases FeatureServer
    // This gives us early commercial activity signals
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateFilter = sixMonthsAgo.getTime();
    
    const params = new URLSearchParams({
      where: `DateFiled > timestamp '${sixMonthsAgo.toISOString()}'`,
      outFields: 'CaseNumber,Address,DateFiled,CaseDescription,CaseType,Status,Applicant',
      orderByFields: 'DateFiled DESC',
      resultRecordCount: limit,
      f: 'json'
    });

    const endpoint = `https://gis.arlingtontx.gov/hosting/rest/services/Hosted/Planning_Zoning_Cases/FeatureServer/0/query?${params.toString()}`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinishOutNow-Backend/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Arlington ArcGIS Error: ${response.statusText} (${response.status})`);
    }

    const arcgisData = await response.json();
    
    if (!arcgisData.features || arcgisData.features.length === 0) {
      console.log('[Arlington Proxy] No zoning cases found - using fallback data');
      
      // Return minimal mock data as fallback
      res.status(200).json({
        success: true,
        data: [{
          attributes: {
            CaseNumber: 'ZC-2024-001',
            Address: '101 W ABRAM ST, ARLINGTON, TX',
            DateFiled: Date.now(),
            CaseDescription: 'Site plan for commercial tenant improvement',
            CaseType: 'Site Plan',
            Status: 'Under Review',
            Applicant: 'Commercial Developer LLC'
          }
        }],
        cached: false,
        timestamp: Date.now(),
        note: 'Using fallback data - ArcGIS returned no results'
      });
      return;
    }

    console.log(`[Arlington Proxy] ✓ Fetched ${arcgisData.features.length} zoning cases`);

    res.status(200).json({
      success: true,
      data: arcgisData.features,
      cached: false,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('[Arlington Proxy] ✗ Error:', error?.message);
    
    // Return mock data on error so frontend doesn't fail
    res.status(200).json({
      success: true,
      data: [{
        attributes: {
          CaseNumber: 'ZC-2024-001',
          Address: '101 W ABRAM ST, ARLINGTON, TX',
          DateFiled: Date.now(),
          CaseDescription: 'Site plan for commercial tenant improvement',
          CaseType: 'Site Plan',
          Status: 'Under Review',
          Applicant: 'Commercial Developer LLC'
        }
      }],
      cached: false,
      timestamp: Date.now(),
      note: `Error fetching ArcGIS data: ${error?.message}. Using fallback.`
    });
  }
}

// Handler for Irving permits (ArcGIS)
async function handleIrvingPermits(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const limit = req.query.limit || '20';
    
    // Use simpler query - just get all permits
    const params = new URLSearchParams({
      'where': '1=1',
      'outFields': '*',
      'f': 'json',
      'resultRecordCount': limit
    });

    const endpoint = 'https://services.arcgis.com/s8c6cO82d6G13c8k/arcgis/rest/services/Permits/FeatureServer/0/query';
    
    console.log(`[Irving Proxy] Fetching from ArcGIS...`);
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinishOutNow-Backend/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Irving API Error: ${response.statusText} (${response.status})`);
    }

    const geoData = await response.json();
    const data = geoData.features || [];
    
    console.log(`[Irving Proxy] ✓ Fetched ${data.length} permits`);

    res.status(200).json({
      success: true,
      data,
      cached: false,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('[Irving Proxy] ✗ Error:', error?.message);
    res.status(502).json({
      success: false,
      error: error?.message || 'Failed to fetch Irving permits',
      timestamp: Date.now()
    });
  }
}

// Create HTTP server
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  console.log('[Server] Request received:', req.url);
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    console.log('[Server] Headers set');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  const query = parsedUrl.query as Record<string, string>;

  // Response wrapper for handler functions
  let statusCode = 200;
  const responseWrapper: ApiResponse = {
    status: (code: number) => {
      statusCode = code;
      return responseWrapper;
    },
    json: (data: any) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    }
  };

  const apiRequest: ApiRequest = {
    method: req.method || 'GET',
    query,
    url: req.url || ''
  };

  // Route requests
  console.log(`[Server] ${req.method} ${pathname}`);
  if (pathname === '/api/permits-dallas') {
    await handleDallasPermits(apiRequest, responseWrapper);
  } else if (pathname === '/api/permits-fortworth') {
    await handleFortWorthPermits(apiRequest, responseWrapper);
  } else if (pathname === '/api/permits-arlington') {
    await handleArlingtonPermits(apiRequest, responseWrapper);
  } else if (pathname === '/api/permits-irving') {
    await handleIrvingPermits(apiRequest, responseWrapper);
  } else if (pathname === '/api/send-email') {
    if ((req.method || '').toUpperCase() !== 'POST') {
      responseWrapper.status(405).json({ error: 'Method not allowed' });
    } else {
      responseWrapper.status(202).json({ success: true, messageId: `local_${Date.now()}` });
    }
  } else if (pathname === '/health') {
    responseWrapper.status(200).json({ status: 'healthy', timestamp: Date.now() });
  } else {
    responseWrapper.status(404).json({ error: 'Not found' });
  }
  } catch (error) {
    console.error('[Server] Uncaught error:', error);
    try {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: String(error) }));
    } catch (e) {
      // Response already sent
    }
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  FinishOutNow API Development Server      ║
║  http://localhost:${PORT}                       ║
╚════════════════════════════════════════════╝

Endpoints:
  GET /api/permits-dallas       → Dallas permits proxy
  GET /api/permits-fortworth    → Fort Worth permits proxy
  GET /api/permits-arlington    → Arlington permits proxy
  GET /api/permits-irving       → Irving permits proxy
  POST /api/send-email           → Mock email sender (local dev)
  GET /health                    → Health check

Make sure your Vite dev server (port 3000) is running separately!

CORS is enabled for all origins.
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down API server...');
  server.close(() => {
    console.log('API server stopped');
    process.exit(0);
  });
});
