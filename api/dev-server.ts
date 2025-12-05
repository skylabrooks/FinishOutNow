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

// Simulated handler for Dallas
async function handleDallasPermits(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const limit = req.query.limit || '20';
    const offset = req.query.offset || '0';

    const query = [
      '$where=(permit_type like \'Commercial\' OR permit_type = \'Certificate of Occupancy\') AND valuation > 1000',
      '$order=issue_date DESC',
      `$limit=${limit}`,
      `$offset=${offset}`
    ].join('&');

    const endpoint = `https://www.dallasopendata.com/resource/e7gq-4sah.json?${query}`;

    console.log(`[Dallas Proxy] Fetching from: ${endpoint.substring(0, 80)}...`);

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

    const query = [
      '$where=(permit_type like \'%Commercial%\' OR permit_type like \'%Remodel%\') AND status != \'Withdrawn\'',
      '$order=status_date DESC',
      `$limit=${limit}`,
      `$offset=${offset}`
    ].join('&');

    const endpoint = `https://data.fortworthtexas.gov/resource/qy5k-jz7m.json?${query}`;

    console.log(`[Fort Worth Proxy] Fetching from: ${endpoint.substring(0, 80)}...`);

    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinishOutNow-Backend/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Fort Worth API Error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    console.log(`[Fort Worth Proxy] ✓ Fetched ${data.length} permits`);

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

// Create HTTP server
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

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
  if (pathname === '/api/permits-dallas') {
    await handleDallasPermits(apiRequest, responseWrapper);
  } else if (pathname === '/api/permits-fortworth') {
    await handleFortWorthPermits(apiRequest, responseWrapper);
  } else if (pathname === '/health') {
    responseWrapper.status(200).json({ status: 'OK', timestamp: Date.now() });
  } else {
    responseWrapper.status(404).json({ error: 'Not found' });
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
