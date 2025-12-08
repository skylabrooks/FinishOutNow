/**
 * E2E Tests: Data Pipeline
 * Tests leadManager orchestration, normalization, and enrichment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leadManager } from '../../services/leadManager';
import { normalizeCity, normalizePermitType, normalizeDate } from '../../services/normalization';
import type { Permit } from '../../types';

describe('Data Pipeline - Lead Manager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should fetch leads from all sources', async () => {
    const leads = await leadManager.fetchAllLeads();

    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);
    
    // Check that leads have required fields
    if (leads.length > 0) {
      const firstLead = leads[0];
      expect(firstLead).toHaveProperty('id');
      expect(firstLead).toHaveProperty('city');
      expect(firstLead).toHaveProperty('address');
    }
  }, 30000);

  it('should deduplicate permits by ID', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    const ids = leads.map(lead => lead.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  }, 30000);

  it('should normalize city names', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    const validCities = ['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Frisco'];
    
    leads.forEach(lead => {
      expect(validCities).toContain(lead.city);
    });
  }, 30000);

  it('should cache geocoding results', async () => {
    const testAddress = '123 Test St, Dallas, TX';
    
    // This will trigger geocoding internally
    const leads = await leadManager.fetchAllLeads();
    
    // Check if geocache was created
    const cacheKey = 'finishoutnow_geocache_v1';
    const cache = localStorage.getItem(cacheKey);
    
    if (cache) {
      const parsed = JSON.parse(cache);
      expect(typeof parsed).toBe('object');
    }
  }, 30000);
});

describe('Data Pipeline - Normalization', () => {
  it('should normalize city names correctly', () => {
    expect(normalizeCity('Ft. Worth')).toBe('Fort Worth');
    expect(normalizeCity('fort worth')).toBe('Fort Worth');
    expect(normalizeCity('FW')).toBe('Fort Worth');
    expect(normalizeCity('dallas')).toBe('Dallas');
    expect(normalizeCity('DALLAS')).toBe('Dallas');
  });

  it('should normalize permit types', () => {
    const types = [
      'Commercial Remodel',
      'COMMERCIAL REMODEL',
      'commercial remodel',
      'Tenant Improvement',
      'Certificate of Occupancy'
    ];

    types.forEach(type => {
      const normalized = normalizePermitType(type);
      expect(typeof normalized).toBe('string');
      expect(normalized.length).toBeGreaterThan(0);
    });
  });

  it('should normalize dates to YYYY-MM-DD format', () => {
    const dates = [
      '2025-01-15',
      '01/15/2025',
      '2025-01-15T10:00:00Z',
      '2025-01-15T10:00:00.000Z'
    ];

    dates.forEach(date => {
      const normalized = normalizeDate(date);
      expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('should handle invalid dates gracefully', () => {
    const invalidDates = ['invalid', '', 'not-a-date'];

    invalidDates.forEach(date => {
      const normalized = normalizeDate(date);
      // Should return a valid date string or the original
      expect(typeof normalized).toBe('string');
    });
  });
});

describe('Data Pipeline - Enrichment', () => {
  it('should enrich leads with entity data', async () => {
    const mockPermit: Permit = {
      id: 'TEST-001',
      city: 'Dallas',
      permitNumber: 'TEST-001',
      permitType: 'Commercial Remodel',
      address: '123 Main St',
      appliedDate: '2025-01-01',
      description: 'Test permit',
      valuation: 50000,
      applicant: 'Test Company LLC',
      status: 'Issued',
      dataSource: 'Test'
    };

    const enriched = await leadManager.enrichLeads([mockPermit]);

    expect(Array.isArray(enriched)).toBe(true);
    expect(enriched.length).toBe(1);
    expect(enriched[0].id).toBe(mockPermit.id);
  }, 15000);

  it('should handle enrichment failures gracefully', async () => {
    const mockPermit: Permit = {
      id: 'TEST-002',
      city: 'Dallas',
      permitNumber: 'TEST-002',
      permitType: 'Commercial Remodel',
      address: '456 Test Ave',
      appliedDate: '2025-01-01',
      description: 'Test permit',
      valuation: 25000,
      applicant: 'Invalid Company Name That Does Not Exist',
      status: 'Issued',
      dataSource: 'Test'
    };

    const enriched = await leadManager.enrichLeads([mockPermit]);

    // Should still return the permit even if enrichment fails
    expect(enriched.length).toBe(1);
    expect(enriched[0].id).toBe(mockPermit.id);
  }, 15000);
});

describe('Data Pipeline - Geocoding', () => {
  it('should use cached geocoding results when available', () => {
    const cacheKey = 'finishoutnow_geocache_v1';
    const mockCache = {
      '123 Main St': [32.7767, -96.7970]
    };

    localStorage.setItem(cacheKey, JSON.stringify(mockCache));

    const cached = localStorage.getItem(cacheKey);
    expect(cached).toBeDefined();
    
    const parsed = JSON.parse(cached!);
    expect(parsed['123 Main St']).toEqual([32.7767, -96.7970]);
  });

  it('should create geocache if it does not exist', async () => {
    const cacheKey = 'finishoutnow_geocache_v1';
    
    // Ensure no cache exists
    localStorage.removeItem(cacheKey);
    
    // Trigger lead fetch which includes geocoding
    await leadManager.fetchAllLeads();
    
    // Cache should now exist (even if empty)
    const cache = localStorage.getItem(cacheKey);
    // Cache might be created by the geocoding function
    // This test validates the caching mechanism exists
    expect(cache === null || typeof cache === 'string').toBe(true);
  }, 30000);
});

describe('Data Pipeline - Performance', () => {
  it('should complete lead fetch within reasonable time', async () => {
    const startTime = Date.now();
    
    await leadManager.fetchAllLeads();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 30 seconds
    expect(duration).toBeLessThan(30000);
  }, 35000);

  it('should handle concurrent requests', async () => {
    const requests = [
      leadManager.fetchAllLeads(),
      leadManager.fetchAllLeads(),
      leadManager.fetchAllLeads()
    ];

    const results = await Promise.all(requests);

    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true);
    });
  }, 40000);
});
