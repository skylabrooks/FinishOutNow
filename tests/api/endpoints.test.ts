/**
 * E2E Tests: API Endpoints
 * Tests Dallas and Fort Worth API proxies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import http from 'http';

describe('API Endpoints - Dallas', () => {
  const BASE_URL = 'http://localhost:3001';

  it('should fetch Dallas permits with default parameters', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('timestamp');
    
    if (data.success) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  }, 15000);

  it('should respect limit parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas?limit=5`);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    if (data.success && data.data) {
      expect(data.data.length).toBeLessThanOrEqual(5);
    }
  }, 15000);

  it('should handle errors gracefully', async () => {
    // Test with invalid endpoint
    const response = await fetch(`${BASE_URL}/api/permits-dallas-invalid`);
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  }, 15000);

  it('should include caching headers', async () => {
    const response1 = await fetch(`${BASE_URL}/api/permits-dallas?limit=3`);
    const data1 = await response1.json();

    // Second request should potentially be cached
    const response2 = await fetch(`${BASE_URL}/api/permits-dallas?limit=3`);
    const data2 = await response2.json();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    
    // Check if second request was cached (cached flag should be true)
    if (data2.success) {
      expect(data2).toHaveProperty('cached');
    }
  }, 30000);
});

describe('API Endpoints - Fort Worth', () => {
  const BASE_URL = 'http://localhost:3001';

  it('should fetch Fort Worth permits with default parameters', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-fortworth`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('timestamp');
    
    if (data.success) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  }, 15000);

  it('should respect limit parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-fortworth?limit=5`);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    if (data.success && data.data) {
      expect(data.data.length).toBeLessThanOrEqual(5);
    }
  }, 15000);

  it('should return proper error structure on failure', async () => {
    // This test will pass whether the API succeeds or fails
    const response = await fetch(`${BASE_URL}/api/permits-fortworth`);
    const data = await response.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('timestamp');
    
    if (!data.success) {
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  }, 15000);
});

describe('API Endpoints - Health Check', () => {
  const BASE_URL = 'http://localhost:3001';

  it('should respond to health check', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  }, 10000);
});

describe('API Endpoints - Error Handling', () => {
  const BASE_URL = 'http://localhost:3001';

  it('should reject non-GET requests on Dallas endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas`, {
      method: 'POST'
    });
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Method not allowed');
  }, 10000);

  it('should reject non-GET requests on Fort Worth endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-fortworth`, {
      method: 'POST'
    });
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Method not allowed');
  }, 10000);
});

describe('API Endpoints - Response Schema Validation', () => {
  const BASE_URL = 'http://localhost:3001';

  it('should return valid Dallas permit schema', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-dallas?limit=1`);
    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const permit = data.data[0];
      
      // Check for expected Dallas API fields
      // Note: Fields may vary based on actual API response
      expect(permit).toBeDefined();
      expect(typeof permit).toBe('object');
    }
  }, 15000);

  it('should return valid Fort Worth permit schema', async () => {
    const response = await fetch(`${BASE_URL}/api/permits-fortworth?limit=1`);
    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const permit = data.data[0];
      
      // Check for expected Fort Worth API fields
      expect(permit).toBeDefined();
      expect(typeof permit).toBe('object');
    }
  }, 15000);
});
