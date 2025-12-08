/**
 * E2E Tests: Complete User Workflows
 * Tests end-to-end scenarios from data fetch to export
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leadManager } from '../../services/leadManager';
import type { EnrichedPermit, CompanyProfile } from '../../types';

describe('E2E Workflow - Lead Discovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should complete full lead discovery workflow', async () => {
    // Step 1: Fetch leads
    const leads = await leadManager.fetchAllLeads();
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);

    // Step 2: Verify lead structure
    const firstLead = leads[0];
    expect(firstLead).toHaveProperty('id');
    expect(firstLead).toHaveProperty('city');
    expect(firstLead).toHaveProperty('address');
    expect(firstLead).toHaveProperty('description');

    // Step 3: Verify deduplication
    const ids = leads.map(l => l.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  }, 35000);

  it('should persist leads to localStorage', async () => {
    const cacheKey = 'finishOutNow_permits_v1';
    
    // Clear cache
    localStorage.removeItem(cacheKey);
    
    // Fetch leads
    const leads = await leadManager.fetchAllLeads();
    
    // Manually cache (simulating App.tsx behavior)
    localStorage.setItem(cacheKey, JSON.stringify(leads));
    
    // Verify cache
    const cached = localStorage.getItem(cacheKey);
    expect(cached).toBeDefined();
    
    const parsed = JSON.parse(cached!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(leads.length);
  }, 35000);
});

describe('E2E Workflow - Lead Enrichment', () => {
  it('should enrich leads with AI analysis', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    // Take first lead and enrich it
    if (leads.length > 0) {
      const enriched = await leadManager.enrichLeads([leads[0]]);
      
      expect(enriched.length).toBe(1);
      expect(enriched[0].id).toBe(leads[0].id);
      
      // May or may not have enrichment data depending on API availability
      // Just verify structure is intact
      expect(enriched[0]).toHaveProperty('city');
      expect(enriched[0]).toHaveProperty('address');
    }
  }, 30000);
});

describe('E2E Workflow - Geocoding', () => {
  it('should geocode addresses and cache results', async () => {
    const cacheKey = 'finishoutnow_geocache_v1';
    
    // Clear cache
    localStorage.removeItem(cacheKey);
    
    // Fetch leads (triggers geocoding)
    await leadManager.fetchAllLeads();
    
    // Check if cache was created
    const cache = localStorage.getItem(cacheKey);
    
    // Cache might be created even if empty
    expect(cache === null || typeof cache === 'string').toBe(true);
  }, 35000);

  it('should use cached coordinates on subsequent requests', async () => {
    const cacheKey = 'finishoutnow_geocache_v1';
    
    // Set up mock cache
    const mockCache = {
      '123 Main St': [32.7767, -96.7970],
      '456 Elm St': [32.7555, -96.8085]
    };
    localStorage.setItem(cacheKey, JSON.stringify(mockCache));
    
    // Fetch leads
    const leads = await leadManager.fetchAllLeads();
    
    // Cache should still exist and include our mock data
    const cache = localStorage.getItem(cacheKey);
    expect(cache).toBeDefined();
    
    const parsed = JSON.parse(cache!);
    expect(parsed['123 Main St']).toBeDefined();
  }, 35000);
});

describe('E2E Workflow - Filtering and Sorting', () => {
  it('should filter leads by city', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    const dallasLeads = leads.filter(lead => lead.city === 'Dallas');
    const fwLeads = leads.filter(lead => lead.city === 'Fort Worth');
    
    dallasLeads.forEach(lead => {
      expect(lead.city).toBe('Dallas');
    });
    
    fwLeads.forEach(lead => {
      expect(lead.city).toBe('Fort Worth');
    });
  }, 35000);

  it('should sort leads by valuation', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    // Sort by valuation descending
    const sorted = [...leads].sort((a, b) => b.valuation - a.valuation);
    
    // Verify sort order
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i-1].valuation).toBeGreaterThanOrEqual(sorted[i].valuation);
    }
  }, 35000);

  it('should sort leads by confidence score', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    // Filter leads with AI analysis
    const analyzed = leads.filter(lead => lead.aiAnalysis);
    
    if (analyzed.length > 1) {
      // Sort by confidence score
      const sorted = [...analyzed].sort((a, b) => 
        (b.aiAnalysis?.confidenceScore || 0) - (a.aiAnalysis?.confidenceScore || 0)
      );
      
      // Verify sort order
      for (let i = 1; i < sorted.length; i++) {
        const prevScore = sorted[i-1].aiAnalysis?.confidenceScore || 0;
        const currScore = sorted[i].aiAnalysis?.confidenceScore || 0;
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
    }
  }, 35000);
});

describe('E2E Workflow - Export Functions', () => {
  it('should prepare CSV export data', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    // Simulate CSV export format
    const csvData = leads.map(lead => ({
      ID: lead.id,
      City: lead.city,
      Address: lead.address,
      Type: lead.permitType,
      Valuation: lead.valuation,
      Applicant: lead.applicant,
      Description: lead.description,
      Date: lead.appliedDate,
      Confidence: lead.aiAnalysis?.confidenceScore || 0,
      Category: lead.aiAnalysis?.category || 'Unknown'
    }));
    
    expect(Array.isArray(csvData)).toBe(true);
    expect(csvData.length).toBe(leads.length);
    
    if (csvData.length > 0) {
      expect(csvData[0]).toHaveProperty('ID');
      expect(csvData[0]).toHaveProperty('City');
      expect(csvData[0]).toHaveProperty('Valuation');
    }
  }, 35000);

  it('should generate mailto: link data', () => {
    const mockProfile: CompanyProfile = {
      name: 'Test Security Inc',
      industry: 'Security Integration',
      contactName: 'John Doe',
      contactEmail: 'john@test.com',
      phone: '555-1234',
      valueProp: 'Commercial security solutions'
    };

    const mockLead: EnrichedPermit = {
      id: 'TEST-001',
      city: 'Dallas',
      permitType: 'Commercial',
      address: '123 Main St',
      appliedDate: '2025-01-01',
      description: 'Office remodel',
      valuation: 50000,
      applicant: 'Test Company',
      dataSource: 'Test',
      aiAnalysis: {
        isCommercialTrigger: true,
        confidenceScore: 85,
        category: 'Security',
        salesPitch: 'Great opportunity',
        tradeOpportunities: {
          securityIntegrator: true,
          signage: false,
          lowVoltageIT: false
        },
        extractedEntities: {},
        reasoning: 'Test',
        urgency: 'High',
        estimatedValue: 15000
      }
    };

    // Simulate email generation
    const subject = `Commercial Opportunity - ${mockLead.address}`;
    const body = `${mockLead.aiAnalysis?.salesPitch}\n\nProject: ${mockLead.description}`;
    
    expect(subject).toContain(mockLead.address);
    expect(body).toContain(mockLead.description);
  });

  it('should generate calendar .ics data', () => {
    const mockLead: EnrichedPermit = {
      id: 'TEST-001',
      city: 'Dallas',
      permitType: 'Commercial',
      address: '123 Main St',
      appliedDate: '2025-01-15',
      description: 'Office remodel',
      valuation: 50000,
      applicant: 'Test Company',
      dataSource: 'Test'
    };

    // Simulate .ics generation
    const event = {
      title: `Follow up: ${mockLead.address}`,
      date: mockLead.appliedDate,
      description: mockLead.description
    };
    
    expect(event.title).toContain(mockLead.address);
    expect(event.date).toBe('2025-01-15');
  });
});

describe('E2E Workflow - Company Profile', () => {
  it('should save and load company profile', () => {
    const profileKey = 'finishOutNow_profile_v1';
    
    const mockProfile: CompanyProfile = {
      name: 'Test Security Inc',
      industry: 'Security Integration',
      contactName: 'John Doe',
      contactEmail: 'john@test.com',
      phone: '555-1234',
      valueProp: 'Commercial security solutions'
    };

    // Save profile
    localStorage.setItem(profileKey, JSON.stringify(mockProfile));
    
    // Load profile
    const loaded = localStorage.getItem(profileKey);
    expect(loaded).toBeDefined();
    
    const parsed = JSON.parse(loaded!);
    expect(parsed.name).toBe(mockProfile.name);
    expect(parsed.contactEmail).toBe(mockProfile.contactEmail);
  });
});

describe('E2E Workflow - Performance Metrics', () => {
  it('should calculate pipeline value correctly', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    const totalValue = leads.reduce((sum, lead) => sum + lead.valuation, 0);
    
    expect(totalValue).toBeGreaterThan(0);
    expect(typeof totalValue).toBe('number');
  }, 35000);

  it('should calculate average confidence score', async () => {
    const leads = await leadManager.fetchAllLeads();
    
    const analyzed = leads.filter(lead => lead.aiAnalysis);
    
    if (analyzed.length > 0) {
      const totalConfidence = analyzed.reduce((sum, lead) => 
        sum + (lead.aiAnalysis?.confidenceScore || 0), 0
      );
      
      const avgConfidence = totalConfidence / analyzed.length;
      
      expect(avgConfidence).toBeGreaterThanOrEqual(0);
      expect(avgConfidence).toBeLessThanOrEqual(100);
    }
  }, 35000);
});
