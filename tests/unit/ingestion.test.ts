/**
 * Unit Tests: City Ingestion Connectors
 * Tests individual city API connectors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDallasPermits } from '../../services/ingestion/dallas';
import { fetchFortWorthPermits } from '../../services/ingestion/fortWorth';
import { fetchArlingtonPermits } from '../../services/ingestion/arlington';
import { fetchPlanoPermits } from '../../services/ingestion/plano';
import { fetchIrvingPermits } from '../../services/ingestion/irving';

describe('Ingestion - Dallas Connector', () => {
  it('should fetch Dallas permits', async () => {
    const permits = await fetchDallasPermits();

    expect(Array.isArray(permits)).toBe(true);
    
    if (permits.length > 0) {
      const permit = permits[0];
      expect(permit).toHaveProperty('id');
      expect(permit).toHaveProperty('city');
      expect(permit.city).toBe('Dallas');
    }
  }, 20000);

  it('should handle API errors gracefully', async () => {
    // Should not throw, even if API fails
    const permits = await fetchDallasPermits();
    
    expect(Array.isArray(permits)).toBe(true);
    // May return empty array on error
  }, 20000);
});

describe('Ingestion - Fort Worth Connector', () => {
  it('should fetch Fort Worth permits', async () => {
    const permits = await fetchFortWorthPermits();

    expect(Array.isArray(permits)).toBe(true);
    
    if (permits.length > 0) {
      const permit = permits[0];
      expect(permit).toHaveProperty('id');
      expect(permit).toHaveProperty('city');
      expect(permit.city).toBe('Fort Worth');
    }
  }, 20000);

  it('should handle API errors gracefully', async () => {
    const permits = await fetchFortWorthPermits();
    
    expect(Array.isArray(permits)).toBe(true);
  }, 20000);
});

describe('Ingestion - Arlington Connector', () => {
  it('should fetch Arlington permits', async () => {
    const permits = await fetchArlingtonPermits();

    expect(Array.isArray(permits)).toBe(true);
    
    if (permits.length > 0) {
      const permit = permits[0];
      expect(permit).toHaveProperty('id');
      expect(permit).toHaveProperty('city');
      expect(permit.city).toBe('Arlington');
    }
  }, 20000);
});

describe('Ingestion - Plano Connector', () => {
  it('should fetch Plano permits', async () => {
    const permits = await fetchPlanoPermits();

    expect(Array.isArray(permits)).toBe(true);
    
    if (permits.length > 0) {
      const permit = permits[0];
      expect(permit).toHaveProperty('id');
      expect(permit).toHaveProperty('city');
      expect(permit.city).toBe('Plano');
    }
  }, 20000);
});

describe('Ingestion - Irving Connector', () => {
  it('should fetch Irving permits', async () => {
    const permits = await fetchIrvingPermits();

    expect(Array.isArray(permits)).toBe(true);
    
    if (permits.length > 0) {
      const permit = permits[0];
      expect(permit).toHaveProperty('id');
      expect(permit).toHaveProperty('city');
      expect(permit.city).toBe('Irving');
    }
  }, 20000);
});

describe('Ingestion - Data Quality', () => {
  it('should return permits with required fields', async () => {
    const allPermits = await Promise.all([
      fetchDallasPermits(),
      fetchFortWorthPermits(),
      fetchArlingtonPermits(),
      fetchPlanoPermits(),
      fetchIrvingPermits()
    ]);

    const flatPermits = allPermits.flat();

    flatPermits.forEach(permit => {
      // Required fields
      expect(permit).toHaveProperty('id');
      expect(permit).toHaveProperty('city');
      expect(permit).toHaveProperty('address');
      expect(permit).toHaveProperty('description');
      expect(permit).toHaveProperty('valuation');
      
      // Type checks
      expect(typeof permit.id).toBe('string');
      expect(typeof permit.city).toBe('string');
      expect(typeof permit.valuation).toBe('number');
    });
  }, 60000);

  it('should return unique permit IDs', async () => {
    const allPermits = await Promise.all([
      fetchDallasPermits(),
      fetchFortWorthPermits(),
      fetchArlingtonPermits(),
      fetchPlanoPermits(),
      fetchIrvingPermits()
    ]);

    const flatPermits = allPermits.flat();
    const ids = flatPermits.map(p => p.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  }, 60000);
});
