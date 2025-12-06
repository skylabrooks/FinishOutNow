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
    // NOTE: Fort Worth Socrata endpoint is deprecated/broken (returns HTML error page)
    // Returning empty result gracefully until a working API is found
    console.log(`[Fort Worth Proxy] ⚠️  Fort Worth API is deprecated - returning empty dataset`);
    console.log(`[Fort Worth Proxy]    Endpoint https://data.fortworthtexas.gov/resource/qy5k-jz7m.json returns HTML error`);
    console.log(`[Fort Worth Proxy]    TODO: Find alternative Fort Worth permit data source`);
    
    res.status(200).json({ 
      success: true, 
      data: [], 
      cached: false,
      warning: 'Fort Worth API endpoint is deprecated',
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
  } else if (pathname === '/api/send-email') {
    if ((req.method || '').toUpperCase() !== 'POST') {
      responseWrapper.status(405).json({ error: 'Method not allowed' });
    } else {
      responseWrapper.status(202).json({ success: true, messageId: `local_${Date.now()}` });
    }
  } else if (pathname === '/health') {
    responseWrapper.status(200).json({ status: 'OK', timestamp: Date.now() });
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
