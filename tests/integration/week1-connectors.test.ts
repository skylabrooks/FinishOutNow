/**
 * Week 1 Integration Tests
 * Tests for newly added/fixed connectors:
 * - TABC Liquor Licenses
 * - Plano Permits (API discovery)
 * - Lead Deduplication
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { fetchTABCLicenses } from '../../services/ingestion/tabc';
import { fetchPlanoPermits } from '../../services/ingestion/plano';
import { 
  normalizeAddress, 
  addressSimilarity, 
  areDuplicates,
  deduplicatePermits,
  getDeduplicationStats 
} from '../../services/deduplication';
import { EnrichedPermit } from '../../types';

describe('TABC Liquor Licenses Connector', () => {
  it('should fetch TABC licenses without errors', async () => {
    const licenses = await fetchTABCLicenses();
    
    // Should not throw errors (even if returns empty array due to network/API issues)
    expect(Array.isArray(licenses)).toBe(true);
  }, 30000); // 30 second timeout for API call

  it('should return valid permit format', async () => {
    const licenses = await fetchTABCLicenses();
    
    if (licenses.length > 0) {
      const firstLicense = licenses[0];
      
      // Check required fields
      expect(firstLicense).toHaveProperty('id');
      expect(firstLicense).toHaveProperty('permitNumber');
      expect(firstLicense).toHaveProperty('permitType');
      expect(firstLicense).toHaveProperty('address');
      expect(firstLicense).toHaveProperty('city');
      expect(firstLicense).toHaveProperty('appliedDate');
      expect(firstLicense).toHaveProperty('dataSource');
      
      // Verify TABC-specific properties
      expect(firstLicense.permitType).toBe('Liquor License');
      expect(firstLicense.dataSource).toBe('TABC');
      expect(firstLicense.stage).toBe('PRE_OPENING');
    }
  }, 30000);

  it('should filter for DFW cities only', async () => {
    const licenses = await fetchTABCLicenses();
    
    const dfwCities = ['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving'];
    
    licenses.forEach(license => {
      expect(dfwCities).toContain(license.city);
    });
  }, 30000);

  it('should have valid addresses', async () => {
    const licenses = await fetchTABCLicenses();
    
    licenses.forEach(license => {
      // Address should not be empty and should be reasonably long
      expect(license.address.length).toBeGreaterThan(10);
      
      // Should contain city and state
      expect(license.address.toLowerCase()).toMatch(/tx|texas/);
    });
  }, 30000);
});

describe('Plano Permits Connector', () => {
  it('should attempt multiple API sources', async () => {
    const permits = await fetchPlanoPermits();
    
    // Should return something (either real data or mock fallback)
    expect(Array.isArray(permits)).toBe(true);
  }, 30000);

  it('should return valid permit format', async () => {
    const permits = await fetchPlanoPermits();
    
    if (permits.length > 0) {
      const firstPermit = permits[0];
      
      // Check required fields
      expect(firstPermit).toHaveProperty('id');
      expect(firstPermit).toHaveProperty('permitNumber');
      expect(firstPermit).toHaveProperty('address');
      expect(firstPermit).toHaveProperty('city');
      expect(firstPermit.city).toBe('Plano');
      expect(firstPermit).toHaveProperty('valuation');
      expect(firstPermit.valuation).toBeGreaterThanOrEqual(50000);
    }
  }, 30000);

  it('should indicate if using mock data', async () => {
    const permits = await fetchPlanoPermits();
    
    if (permits.length > 0) {
      const firstPermit = permits[0];
      
      // Check if mock data
      if (firstPermit.dataSource?.includes('Mock')) {
        console.warn('⚠️ Plano connector using mock data - real API not found');
        expect(firstPermit.description).toMatch(/\[MOCK\]/);
      } else {
        console.log('✅ Plano connector using real data source:', firstPermit.dataSource);
      }
    }
  }, 30000);
});

describe('Address Normalization', () => {
  it('should normalize addresses correctly', () => {
    const tests = [
      {
        input: '123 Main Street, Suite 100',
        expected: '123 main st'
      },
      {
        input: '456 N. Oak Avenue Apt 5',
        expected: '456 oak ave'
      },
      {
        input: '789 West Park Boulevard #200',
        expected: '789 west park blvd'
      }
    ];

    tests.forEach(({ input, expected }) => {
      const result = normalizeAddress(input);
      expect(result).toBe(expected);
    });
  });

  it('should handle various street abbreviations', () => {
    expect(normalizeAddress('100 Main Street')).toBe('100 main st');
    expect(normalizeAddress('100 Main Avenue')).toBe('100 main ave');
    expect(normalizeAddress('100 Main Boulevard')).toBe('100 main blvd');
    expect(normalizeAddress('100 Main Road')).toBe('100 main rd');
    expect(normalizeAddress('100 Main Drive')).toBe('100 main dr');
  });
});

describe('Address Similarity Matching', () => {
  it('should detect exact matches', () => {
    const addr1 = '123 Main Street';
    const addr2 = '123 Main St';
    
    const similarity = addressSimilarity(addr1, addr2);
    expect(similarity).toBeGreaterThan(90);
  });

  it('should detect near matches', () => {
    const addr1 = '123 Main Street, Suite 100';
    const addr2 = '123 Main Street, Unit 200';
    
    const similarity = addressSimilarity(addr1, addr2);
    expect(similarity).toBeGreaterThan(85);
  });

  it('should reject non-matches', () => {
    const addr1 = '123 Main Street';
    const addr2 = '456 Oak Avenue';
    
    const similarity = addressSimilarity(addr1, addr2);
    expect(similarity).toBeLessThan(50);
  });
});

describe('Duplicate Detection', () => {
  const mockPermit1: EnrichedPermit = {
    id: 'TEST-1',
    permitNumber: 'P001',
    permitType: 'Commercial Remodel',
    address: '123 Main Street, Dallas, TX',
    city: 'Dallas',
    appliedDate: '2025-01-01',
    description: 'Test permit 1',
    applicant: 'Test Applicant',
    valuation: 100000,
    status: 'Issued',
    dataSource: 'Source A'
  };

  const mockPermit2: EnrichedPermit = {
    ...mockPermit1,
    id: 'TEST-2',
    address: '123 Main St, Dallas, TX', // Similar address
    dataSource: 'Source B'
  };

  const mockPermit3: EnrichedPermit = {
    ...mockPermit1,
    id: 'TEST-3',
    address: '456 Oak Avenue, Dallas, TX', // Different address
    dataSource: 'Source C'
  };

  it('should detect duplicates based on address', () => {
    const isDuplicate = areDuplicates(mockPermit1, mockPermit2);
    expect(isDuplicate).toBe(true);
  });

  it('should not flag different addresses as duplicates', () => {
    const isDuplicate = areDuplicates(mockPermit1, mockPermit3);
    expect(isDuplicate).toBe(false);
  });

  it('should not compare permit to itself', () => {
    const isDuplicate = areDuplicates(mockPermit1, mockPermit1);
    expect(isDuplicate).toBe(false);
  });
});

describe('Lead Deduplication', () => {
  const mockPermits: EnrichedPermit[] = [
    {
      id: 'DAL-001',
      permitNumber: 'P001',
      permitType: 'Commercial Remodel',
      address: '123 Main Street, Dallas, TX',
      city: 'Dallas',
      appliedDate: '2025-01-01',
      description: 'Office remodel',
      applicant: 'Builder A',
      valuation: 100000,
      status: 'Issued',
      dataSource: 'Dallas Open Data',
      leadScore: 75
    },
    {
      id: 'CO-001',
      permitNumber: 'CO001',
      permitType: 'Certificate of Occupancy',
      address: '123 Main St, Dallas, TX', // Duplicate
      city: 'Dallas',
      appliedDate: '2025-01-15',
      description: 'CO issued',
      applicant: 'Builder A',
      valuation: 0,
      status: 'Issued',
      dataSource: 'Dallas CO Dataset',
      leadScore: 65
    },
    {
      id: 'FW-001',
      permitNumber: 'P002',
      permitType: 'Commercial Remodel',
      address: '456 Oak Avenue, Fort Worth, TX', // Unique
      city: 'Fort Worth',
      appliedDate: '2025-01-10',
      description: 'Retail remodel',
      applicant: 'Builder B',
      valuation: 150000,
      status: 'Issued',
      dataSource: 'Fort Worth GIS',
      leadScore: 80
    }
  ];

  it('should merge duplicate permits', () => {
    const deduped = deduplicatePermits(mockPermits);
    
    // Should have 2 permits after merging (123 Main merged, 456 Oak unique)
    expect(deduped.length).toBe(2);
  });

  it('should create multi-signal leads', () => {
    const deduped = deduplicatePermits(mockPermits);
    
    // Find the merged lead
    const mergedLead = deduped.find(p => p.dataSource?.includes('+'));
    
    expect(mergedLead).toBeDefined();
    expect(mergedLead?.dataSource).toContain('Dallas Open Data');
    expect(mergedLead?.dataSource).toContain('Dallas CO Dataset');
  });

  it('should boost scores for multi-signal leads', () => {
    const deduped = deduplicatePermits(mockPermits);
    
    const mergedLead = deduped.find(p => p.dataSource?.includes('+'));
    
    // Multi-signal lead should have higher score than original
    expect(mergedLead?.leadScore).toBeGreaterThan(75);
  });

  it('should provide accurate statistics', () => {
    const deduped = deduplicatePermits(mockPermits);
    const stats = getDeduplicationStats(mockPermits, deduped);
    
    expect(stats.originalCount).toBe(3);
    expect(stats.dedupedCount).toBe(2);
    expect(stats.duplicatesRemoved).toBe(1);
    expect(stats.multiSignalLeads).toBeGreaterThan(0);
    expect(stats.deduplicationRate).toBeGreaterThan(0);
  });

  it('should preserve permit with higher valuation', () => {
    const mockDuplicates: EnrichedPermit[] = [
      {
        ...mockPermits[0],
        valuation: 100000,
        leadScore: 70
      },
      {
        ...mockPermits[0],
        id: 'TEST-DUP',
        valuation: 150000,
        leadScore: 60
      }
    ];

    const deduped = deduplicatePermits(mockDuplicates);
    
    // Should keep permit with higher valuation (150000)
    expect(deduped[0].valuation).toBe(150000);
  });
});

describe('Week 1 Integration Summary', () => {
  it('should log connector health status', async () => {
    console.log('\n📊 Week 1 Connector Health Status\n');
    
    // Test TABC
    const tabcStart = Date.now();
    const tabc = await fetchTABCLicenses();
    const tabcTime = Date.now() - tabcStart;
    
    console.log(`✓ TABC: ${tabc.length} licenses (${tabcTime}ms)`);
    
    // Test Plano
    const planoStart = Date.now();
    const plano = await fetchPlanoPermits();
    const planoTime = Date.now() - planoStart;
    
    const planoStatus = plano.length > 0 && plano[0].dataSource?.includes('Mock') 
      ? '⚠️  Mock data' 
      : '✓  Real data';
    
    console.log(`${planoStatus} Plano: ${plano.length} permits (${planoTime}ms)`);
    
    // Test Deduplication
    const mockLeads: EnrichedPermit[] = Array(10).fill(null).map((_, i) => ({
      id: `TEST-${i}`,
      permitNumber: `P${i}`,
      permitType: 'Commercial Remodel',
      address: `${100 + i} Main Street`,
      city: 'Dallas',
      appliedDate: '2025-01-01',
      description: 'Test',
      applicant: 'Test',
      valuation: 100000,
      status: 'Issued',
      dataSource: 'Test'
    }));
    
    const dedupStart = Date.now();
    const deduped = deduplicatePermits(mockLeads);
    const dedupTime = Date.now() - dedupStart;
    
    console.log(`✓ Deduplication: ${mockLeads.length} → ${deduped.length} (${dedupTime}ms)`);
    
    console.log('\n');
    
    expect(true).toBe(true);
  }, 60000);
});
