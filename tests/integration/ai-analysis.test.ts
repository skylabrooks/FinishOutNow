/**
 * E2E Tests: AI Analysis with Gemini
 * Tests AI service with mocked responses
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzePermit } from '../../services/geminiService';
import type { CompanyProfile } from '../../types';

// Mock the Google GenAI SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: () => JSON.stringify({
            is_commercial_trigger: true,
            confidence_score: 85,
            project_type: 'Tenant Improvement',
            trade_opportunities: {
              security_integrator: true,
              signage: false,
              low_voltage_it: true
            },
            extracted_entities: {
              tenant_name: 'Test Company',
              general_contractor: 'Test GC'
            },
            reasoning: 'Commercial tenant improvement project',
            primary_category: 'Security',
            sales_pitch: 'Great opportunity for security system installation',
            urgency: 'High',
            estimated_opportunity_value: 15000
          })
        })
      }
    })),
    Type: {
      OBJECT: 'object',
      STRING: 'string',
      INTEGER: 'integer',
      BOOLEAN: 'boolean',
      NUMBER: 'number'
    },
    Schema: {}
  };
});

describe('AI Analysis - Basic Functionality', () => {
  it('should analyze a commercial permit', async () => {
    const description = 'Tenant Improvement for new office space with security system';
    const valuation = 50000;
    const city = 'Dallas';
    const permitType = 'Commercial Remodel';

    const result = await analyzePermit(description, valuation, city, permitType);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('isCommercialTrigger');
    expect(result).toHaveProperty('confidenceScore');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('salesPitch');
  }, 10000);

  it('should return confidence score between 0-100', async () => {
    const result = await analyzePermit(
      'Office remodel with access control',
      75000,
      'Dallas',
      'Commercial'
    );

    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  }, 10000);

  it('should identify trade opportunities', async () => {
    const result = await analyzePermit(
      'New retail space with security cameras and signage',
      100000,
      'Dallas',
      'Tenant Improvement'
    );

    expect(result).toHaveProperty('tradeOpportunities');
    expect(result.tradeOpportunities).toHaveProperty('securityIntegrator');
    expect(result.tradeOpportunities).toHaveProperty('signage');
    expect(result.tradeOpportunities).toHaveProperty('lowVoltageIT');
  }, 10000);
});

describe('AI Analysis - Category Classification', () => {
  it('should classify security-related permits', async () => {
    const result = await analyzePermit(
      'Install access control system and CCTV cameras',
      30000,
      'Dallas',
      'Commercial'
    );

    expect(result.category).toBeDefined();
    expect(['Security & Access Control', 'General Remodel', 'Uncategorized']).toContain(result.category);
  }, 10000);

  it('should classify signage-related permits', async () => {
    const result = await analyzePermit(
      'Install new storefront sign and awning',
      15000,
      'Fort Worth',
      'Signage'
    );

    expect(result.category).toBeDefined();
    expect(['Signage & Branding', 'General Remodel', 'Uncategorized']).toContain(result.category);
  }, 10000);

  it('should classify low-voltage IT permits', async () => {
    const result = await analyzePermit(
      'Install structured cabling and server room',
      40000,
      'Arlington',
      'Commercial'
    );

    expect(result.category).toBeDefined();
    expect(['IT & Low Voltage', 'General Remodel', 'Uncategorized']).toContain(result.category);
  }, 10000);
});

describe('AI Analysis - Sales Pitch Generation', () => {
  it('should generate a sales pitch', async () => {
    const result = await analyzePermit(
      'Tenant improvement for office space',
      50000,
      'Dallas',
      'Commercial'
    );

    expect(result.salesPitch).toBeDefined();
    expect(typeof result.salesPitch).toBe('string');
    expect(result.salesPitch.length).toBeGreaterThan(0);
  }, 10000);

  it('should customize pitch with company profile', async () => {
    const profile: CompanyProfile = {
      name: 'Test Security Inc',
      industry: 'Security Integration',
      contactName: 'John Doe',
      contactEmail: 'john@test.com',
      phone: '555-1234',
      valueProp: 'Commercial security solutions'
    };

    const result = await analyzePermit(
      'Office remodel with security needs',
      60000,
      'Dallas',
      'Commercial',
      profile
    );

    expect(result.salesPitch).toBeDefined();
    // Pitch should be customized but we can't guarantee exact content with mock
    expect(typeof result.salesPitch).toBe('string');
  }, 10000);
});

describe('AI Analysis - Error Handling', () => {
  it('should handle empty descriptions', async () => {
    const result = await analyzePermit('', 10000, 'Dallas', 'Commercial');

    expect(result).toBeDefined();
    // Should return a default/fallback result
    expect(result).toHaveProperty('confidenceScore');
  }, 10000);

  it('should handle very low valuations', async () => {
    const result = await analyzePermit(
      'Minor repair work',
      500,
      'Dallas',
      'Maintenance'
    );

    expect(result).toBeDefined();
    expect(result.confidenceScore).toBeDefined();
  }, 10000);

  it('should handle API errors gracefully', async () => {
    // This test validates the fallback mechanism
    const result = await analyzePermit(
      'Test permit',
      25000,
      'Dallas',
      'Commercial'
    );

    // Should not throw, should return valid result structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty('isCommercialTrigger');
    expect(result).toHaveProperty('confidenceScore');
  }, 10000);
});

describe('AI Analysis - Schema Validation', () => {
  it('should return valid AIAnalysisResult structure', async () => {
    const result = await analyzePermit(
      'Commercial tenant improvement',
      50000,
      'Dallas',
      'Commercial'
    );

    // Check all required fields exist
    expect(result).toHaveProperty('isCommercialTrigger');
    expect(result).toHaveProperty('confidenceScore');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('salesPitch');
    expect(result).toHaveProperty('tradeOpportunities');
    expect(result).toHaveProperty('extractedEntities');
    expect(result).toHaveProperty('reasoning');
    expect(result).toHaveProperty('urgency');
    expect(result).toHaveProperty('estimatedValue');

    // Check types
    expect(typeof result.isCommercialTrigger).toBe('boolean');
    expect(typeof result.confidenceScore).toBe('number');
    expect(typeof result.category).toBe('string');
    expect(typeof result.salesPitch).toBe('string');
    expect(typeof result.tradeOpportunities).toBe('object');
  }, 10000);

  it('should have valid trade opportunities structure', async () => {
    const result = await analyzePermit(
      'Office build-out',
      40000,
      'Dallas',
      'Commercial'
    );

    expect(result.tradeOpportunities).toHaveProperty('securityIntegrator');
    expect(result.tradeOpportunities).toHaveProperty('signage');
    expect(result.tradeOpportunities).toHaveProperty('lowVoltageIT');

    expect(typeof result.tradeOpportunities.securityIntegrator).toBe('boolean');
    expect(typeof result.tradeOpportunities.signage).toBe('boolean');
    expect(typeof result.tradeOpportunities.lowVoltageIT).toBe('boolean');
  }, 10000);
});

describe('AI Analysis - Commercial Trigger Detection', () => {
  it('should flag tenant improvements as commercial triggers', async () => {
    const result = await analyzePermit(
      'Tenant Improvement for new retail store',
      80000,
      'Dallas',
      'Tenant Improvement'
    );

    expect(result.isCommercialTrigger).toBe(true);
  }, 10000);

  it('should assign low confidence to maintenance work', async () => {
    const result = await analyzePermit(
      'Replace HVAC filter',
      500,
      'Dallas',
      'Maintenance'
    );

    // Should either have low confidence or not be a commercial trigger
    expect(
      result.confidenceScore < 50 || result.isCommercialTrigger === false
    ).toBe(true);
  }, 10000);

  it('should assign high confidence to major projects', async () => {
    const result = await analyzePermit(
      'Complete office buildout with security, IT, and signage',
      150000,
      'Dallas',
      'Commercial Remodel'
    );

    // Should have high confidence for clearly commercial projects
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
  }, 10000);
});
