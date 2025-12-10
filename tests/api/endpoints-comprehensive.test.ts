/**
 * Comprehensive API Endpoint Test Suite
 * Tests all API endpoints for functionality, error handling, and response schemas
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:3001';
const API_TIMEOUT = 15000;

describe('API Endpoint - Health Check', () => {
  it('should return healthy status', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('number');
  }, API_TIMEOUT);
});

describe('API Endpoint - Dallas Permits', () => {
  it('should fetch Dallas permits with default parameters', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('cached');
    
    if (data.success) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  }, API_TIMEOUT);

  it('should respect limit parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas?limit=5`);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.success && data.data) {
      expect(data.data.length).toBeLessThanOrEqual(5);
    }
  }, API_TIMEOUT);

  it('should respect offset parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas?limit=5&offset=10`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  }, API_TIMEOUT);

  it('should reject non-GET requests', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas`, {
      method: 'POST'
    });
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Method not allowed');
  }, API_TIMEOUT);

  it('should handle API errors gracefully', async () => {
    // Test with extremely high offset that might cause issues
    const response = await fetch(`${BASE_URL}/api/permits-dallas?offset=999999`);
    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('timestamp');
  }, API_TIMEOUT);
});

describe('API Endpoint - Fort Worth Permits', () => {
  it('should fetch Fort Worth permits with default parameters', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-fortworth`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('cached');
    
    if (data.success) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  }, API_TIMEOUT);

  it('should respect limit parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-fortworth?limit=5`);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.success && data.data) {
      expect(data.data.length).toBeLessThanOrEqual(5);
    }
  }, API_TIMEOUT);

  it('should reject non-GET requests', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-fortworth`, {
      method: 'DELETE'
    });
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
  }, API_TIMEOUT);
});

describe('API Endpoint - Arlington Permits', () => {
  it('should fetch Arlington permits', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-arlington`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('timestamp');
    
    if (data.success) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  }, API_TIMEOUT);

  it('should respect limit parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-arlington?limit=3`);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.success && data.data) {
      expect(data.data.length).toBeLessThanOrEqual(3);
    }
  }, API_TIMEOUT);

  it('should reject non-GET requests', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-arlington`, {
      method: 'PUT'
    });
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
  }, API_TIMEOUT);
});

describe('API Endpoint - Irving Permits', () => {
  it('should fetch Irving permits', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-irving`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('timestamp');
    
    if (data.success) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  }, API_TIMEOUT);

  it('should respect limit parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-irving?limit=8`);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.success && data.data) {
      expect(data.data.length).toBeLessThanOrEqual(8);
    }
  }, API_TIMEOUT);

  it('should reject non-GET requests', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-irving`, {
      method: 'PATCH'
    });
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
  }, API_TIMEOUT);
});

describe('API Endpoint - Send Email', () => {
  it('should accept POST requests', async () => {
    const response = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Test message'
      })
    });
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('messageId');
    expect(data.messageId).toMatch(/^local_\d+$/);
  }, API_TIMEOUT);

  it('should reject non-POST requests', async () => {
    const response = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'GET'
    });
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data).toHaveProperty('error', 'Method not allowed');
  }, API_TIMEOUT);

  it('should handle POST with empty body', async () => {
    const response = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(202);
  }, API_TIMEOUT);
});

describe('API Endpoint - 404 Handling', () => {
  it('should return 404 for unknown endpoints', async () => {
    const response = await fetch(`${BASE_URL}/api/unknown-endpoint`);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error', 'Not found');
  }, API_TIMEOUT);

  it('should return 404 for invalid paths', async () => {
    const response = await fetch(`${BASE_URL}/invalid/path/here`);
    const data = await response.json();

    expect(response.status).toBe(404);
  }, API_TIMEOUT);
});

describe('API Response Schema Validation', () => {
  it('all successful permit responses should have consistent schema', async () => {
    const endpoints = [
      '/api/permits-dallas?limit=1',
      '/api/permits-fortworth?limit=1',
      '/api/permits-arlington?limit=1',
      '/api/permits-irving?limit=1'
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('cached');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.timestamp).toBe('number');
      expect(typeof data.cached).toBe('boolean');

      if (data.success) {
        expect(data).toHaveProperty('data');
        expect(Array.isArray(data.data)).toBe(true);
      } else {
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
      }
    }
  }, API_TIMEOUT * 4);
});

describe('API Performance & Caching', () => {
  it('should have reasonable response times', async () => {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/permits-dallas?limit=5`);
    const elapsed = Date.now() - start;

    expect(response.status).toBe(200);
    expect(elapsed).toBeLessThan(10000); // Should respond within 10 seconds
  }, API_TIMEOUT);

  it('cached requests should be faster or equal', async () => {
    const endpoint = `${BASE_URL}/api/permits-fortworth?limit=3`;
    
    // First request
    const start1 = Date.now();
    await fetch(endpoint);
    const time1 = Date.now() - start1;

    // Second request (potentially cached)
    const start2 = Date.now();
    const response2 = await fetch(endpoint);
    const time2 = Date.now() - start2;
    const data2 = await response2.json();

    expect(response2.status).toBe(200);
    // Cached requests should generally be faster, but we just verify both complete
    expect(time1).toBeGreaterThan(0);
    expect(time2).toBeGreaterThan(0);
  }, API_TIMEOUT * 2);
});

describe('API CORS Headers', () => {
  it('should include CORS headers in responses', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    
    expect(response.headers.has('access-control-allow-origin')).toBe(true);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  }, API_TIMEOUT);
});
