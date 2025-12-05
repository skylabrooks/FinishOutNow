/**
 * Vite Dev Server Proxy Configuration
 * 
 * This file contains the Vite dev server proxy setup.
 * The proxy routes /api/* requests to a local backend or external service.
 * 
 * For development: Use simple Node.js server (see dev-server.ts)
 * For production: Use Vercel, Cloudflare Workers, or other serverless platform
 */

import type { ProxyOptions } from 'vite';

export const proxyConfig: Record<string, string | ProxyOptions> = {
  '/api/permits-dallas': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/permits-dallas': '/api/permits-dallas'
    }
  },
  '/api/permits-fortworth': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/permits-fortworth': '/api/permits-fortworth'
    }
  }
};
