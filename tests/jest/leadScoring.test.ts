import { computeLeadScore } from '../../utils/leadScoring';
import type { EnrichedPermit } from '../../types';

// Use fake timers to keep recency scoring stable
const FIXED_NOW = new Date('2025-12-08T00:00:00Z');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

const basePermit: EnrichedPermit = {
  id: 'TEST-1',
  permitNumber: 'P-1',
  permitType: 'Commercial Remodel',
  address: '123 MAIN ST',
  city: 'Dallas',
  appliedDate: '2025-12-01',
  description: 'Tenant improvement for new office',
  applicant: 'Acme Construction',
  valuation: 0,
  status: 'Issued'
};

describe('computeLeadScore', () => {
  it('gives a strong score for high valuation and confidence', () => {
    const permit: EnrichedPermit = {
      ...basePermit,
      valuation: 500_000,
      aiAnalysis: { confidenceScore: 80, isCommercialTrigger: true, projectType: 'Tenant Improvement', tradeOpportunities: { securityIntegrator: true, signage: true, lowVoltageIT: true }, extractedEntities: {}, reasoning: '', category: 4 as any, salesPitch: '', urgency: 'High', estimatedValue: 0 },
      enrichmentData: { verified: true }
    };

    const score = computeLeadScore(permit);
    expect(score).toBeGreaterThan(70);
  });

  it('keeps score modest for low valuation and confidence', () => {
    const permit: EnrichedPermit = {
      ...basePermit,
      valuation: 60_000,
      aiAnalysis: { confidenceScore: 30, isCommercialTrigger: true, projectType: 'Tenant Improvement', tradeOpportunities: { securityIntegrator: false, signage: false, lowVoltageIT: false }, extractedEntities: {}, reasoning: '', category: 4 as any, salesPitch: '', urgency: 'Medium', estimatedValue: 0 },
      enrichmentData: { verified: false }
    };

    const score = computeLeadScore(permit);
    expect(score).toBeLessThan(60);
  });
});
