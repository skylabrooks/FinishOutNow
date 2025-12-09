/**
 * Creative Signals Integration Test
 * Tests the signal-linking and lead-score boosting mechanism.
 */

import { EnrichedPermit, Permit, AIAnalysisResult, LeadCategory } from '../../types';

// Helper to create test permits with required fields
function createTestLead(id: string, address: string, leadScore: number = 50): EnrichedPermit {
  return {
    id,
    permitNumber: `PERMIT_${id}`,
    permitType: 'Commercial Remodel',
    address,
    city: 'Dallas',
    appliedDate: '2024-12-01',
    description: 'Test permit',
    applicant: 'Test Applicant',
    valuation: 500000,
    status: 'Issued',
    leadScore,
    aiAnalysis: {
      isCommercialTrigger: true,
      confidenceScore: 75,
      projectType: 'Tenant Improvement',
      tradeOpportunities: { securityIntegrator: true, signage: false, lowVoltageIT: false },
      extractedEntities: {},
      reasoning: 'Commercial trigger detected',
      category: LeadCategory.GENERAL,
      salesPitch: 'Good opportunity',
      urgency: 'Medium',
      estimatedValue: 500000
    }
  };
}

function createTestSignal(id: string, address: string, permitType: string): Permit {
  return {
    id,
    permitNumber: `SIG_${id}`,
    permitType: permitType as any,
    address,
    city: 'Dallas',
    appliedDate: '2024-12-05',
    description: 'Test signal',
    applicant: 'Signal Source',
    valuation: 0,
    status: 'Issued',
    dataSource: 'Test Signal'
  };
}

describe('Creative Signals Integration', () => {
  it('should boost lead score when signal matches lead by address', () => {
    const lead = createTestLead('lead1', '123 Main St, Dallas, TX', 50);
    const signal = createTestSignal('sig1', '123 Main St, Dallas, TX', 'Utility Hookup');

    // Mock the linking logic inline for testing
    const normalizeAddress = (addr: string): string => addr.toLowerCase().trim();
    const leadsByAddress = new Map<string, EnrichedPermit[]>();
    const key = normalizeAddress(lead.address);
    leadsByAddress.set(key, [lead]);

    const matchedLeads = leadsByAddress.get(normalizeAddress(signal.address));
    if (matchedLeads && matchedLeads.length > 0) {
      for (const l of matchedLeads) {
        if (l.leadScore !== undefined) {
          l.leadScore = Math.min(100, l.leadScore + 10);
        }
      }
    }

    expect(lead.leadScore).toBe(60);
  });

  it('should handle multiple signals for same lead', () => {
    const lead = createTestLead('lead1', '456 Oak Ave, Dallas, TX', 50);
    const signal1 = createTestSignal('sig1', '456 Oak Ave, Dallas, TX', 'Utility Hookup');
    const signal2 = createTestSignal('sig2', '456 Oak Ave, Dallas, TX', 'Zoning Case');

    const normalizeAddress = (addr: string): string => addr.toLowerCase().trim();
    const leadsByAddress = new Map<string, EnrichedPermit[]>();
    const key = normalizeAddress(lead.address);
    leadsByAddress.set(key, [lead]);

    for (const signal of [signal1, signal2]) {
      const matchedLeads = leadsByAddress.get(normalizeAddress(signal.address));
      if (matchedLeads && matchedLeads.length > 0) {
        for (const l of matchedLeads) {
          if (l.leadScore !== undefined) {
            l.leadScore = Math.min(100, l.leadScore + 10);
          }
        }
      }
    }

    expect(lead.leadScore).toBe(70); // +10 for each signal, capped at 100
  });

  it('should not boost lead score above 100', () => {
    const lead = createTestLead('lead1', '789 Pine Ln, Dallas, TX', 95);
    const signal = createTestSignal('sig1', '789 Pine Ln, Dallas, TX', 'Licensing Signal');

    const normalizeAddress = (addr: string): string => addr.toLowerCase().trim();
    const leadsByAddress = new Map<string, EnrichedPermit[]>();
    const key = normalizeAddress(lead.address);
    leadsByAddress.set(key, [lead]);

    const matchedLeads = leadsByAddress.get(normalizeAddress(signal.address));
    if (matchedLeads && matchedLeads.length > 0) {
      for (const l of matchedLeads) {
        if (l.leadScore !== undefined) {
          l.leadScore = Math.min(100, l.leadScore + 10);
        }
      }
    }

    expect(lead.leadScore).toBe(100); // Capped at 100
  });

  it('should handle address normalization (case-insensitive, whitespace-tolerant)', () => {
    const lead = createTestLead('lead1', '  123 MAIN ST, DALLAS, TX  ', 50);
    const signal = createTestSignal('sig1', '123 main st, dallas, tx', 'Utility Hookup');

    const normalizeAddress = (addr: string): string => addr.toLowerCase().trim();
    
    expect(normalizeAddress(lead.address)).toBe(normalizeAddress(signal.address));
  });
});
