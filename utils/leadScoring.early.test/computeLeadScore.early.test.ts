
import { EnrichedPermit } from '../../types';
import { computeLeadScore } from '../leadScoring';


// utils/leadScoring.test.ts
// Mock RECENCY_THRESHOLD_DAYS dependency
class MockRECENCY_THRESHOLD_DAYS {
  public value: number = 90;
}

// Patch global RECENCY_THRESHOLD_DAYS for the test context
jest.mock("../../services/qualityFilter", () => ({
  RECENCY_THRESHOLD_DAYS: (new MockRECENCY_THRESHOLD_DAYS() as any).value,
}));

describe('computeLeadScore() computeLeadScore method', () => {
  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should compute full score for maximum valuation, confidence, recent date, and verified enrichment', () => {
      // This test ensures the function returns 100 for optimal input values.
      const permit: EnrichedPermit = {
        id: '1',
        permitNumber: 'A123',
        permitType: 'New Construction',
        address: '123 Main St',
        city: 'Dallas',
        appliedDate: new Date().toISOString(), // today
        description: 'Test',
        applicant: 'John Doe',
        valuation: 1000000, // $1M
        status: 'Issued',
        aiAnalysis: {
          isCommercialTrigger: true,
          confidenceScore: 100,
          projectType: 'New Construction',
          tradeOpportunities: {
            securityIntegrator: true,
            signage: true,
            lowVoltageIT: true,
          },
          extractedEntities: {},
          reasoning: 'High confidence',
          category: 'General Remodel' as any,
          salesPitch: 'Pitch',
          urgency: 'High',
          estimatedValue: 1000000,
        },
        enrichmentData: {
          verified: true,
        },
      } as any;

      const score = computeLeadScore(permit as any);
      expect(score).toBe(100);
    });

    it('should compute a score with partial values for valuation, confidence, recency, and enrichment', () => {
      // This test checks correct scoring for mid-range values.
      const permit: EnrichedPermit = {
        id: '2',
        permitNumber: 'B456',
        permitType: 'Commercial Remodel',
        address: '456 Elm St',
        city: 'Plano',
        appliedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        description: 'Remodel',
        applicant: 'Jane Smith',
        valuation: 500000, // $500k
        status: 'Under Review',
        aiAnalysis: {
          isCommercialTrigger: true,
          confidenceScore: 50,
          projectType: 'Tenant Improvement',
          tradeOpportunities: {
            securityIntegrator: false,
            signage: true,
            lowVoltageIT: false,
          },
          extractedEntities: {},
          reasoning: 'Medium confidence',
          category: 'Signage & Branding' as any,
          salesPitch: 'Pitch',
          urgency: 'Medium',
          estimatedValue: 500000,
        },
        enrichmentData: {
          verified: false,
        },
      } as any;

      // Calculation:
      // valuationScore = (500000 / 1000000) * 40 = 20
      // confidenceScore = 50 * 0.4 = 20
      // recencyScore = ((90 - 30) / 90) * 15 = (60/90)*15 = 10
      // enrichmentScore = 0
      // total = 20 + 20 + 10 + 0 = 50
      expect(computeLeadScore(permit as any)).toBe(50);
    });

    it('should compute a score with zero confidence and enrichment, but high valuation and recency', () => {
      // This test checks correct scoring when some fields are zero.
      const permit: EnrichedPermit = {
        id: '3',
        permitNumber: 'C789',
        permitType: 'Certificate of Occupancy',
        address: '789 Oak St',
        city: 'Frisco',
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        description: 'Occupancy',
        applicant: 'Bob Lee',
        valuation: 900000, // $900k
        status: 'Pending Inspection',
        aiAnalysis: {
          isCommercialTrigger: false,
          confidenceScore: 0,
          projectType: 'Certificate of Occupancy',
          tradeOpportunities: {
            securityIntegrator: false,
            signage: false,
            lowVoltageIT: false,
          },
          extractedEntities: {},
          reasoning: 'Low confidence',
          category: 'Uncategorized' as any,
          salesPitch: 'Pitch',
          urgency: 'Low',
          estimatedValue: 900000,
        },
        enrichmentData: {
          verified: false,
        },
      } as any;

      // valuationScore = (900000 / 1000000) * 40 = 36
      // confidenceScore = 0
      // recencyScore = ((90 - 10) / 90) * 15 = (80/90)*15 ≈ 13.33
      // enrichmentScore = 0
      // total ≈ 36 + 0 + 13.33 + 0 = 49.33 => 49
      expect(computeLeadScore(permit as any)).toBe(49);
    });

    it('should compute a score with only enrichment verified', () => {
      // This test checks correct scoring when only enrichment is present.
      const permit: EnrichedPermit = {
        id: '4',
        permitNumber: 'D012',
        permitType: 'New Construction',
        address: '1012 Pine St',
        city: 'Irving',
        appliedDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
        description: 'New',
        applicant: 'Alice Green',
        valuation: 0,
        status: 'Issued',
        aiAnalysis: {
          isCommercialTrigger: true,
          confidenceScore: 0,
          projectType: 'New Construction',
          tradeOpportunities: {
            securityIntegrator: false,
            signage: false,
            lowVoltageIT: false,
          },
          extractedEntities: {},
          reasoning: 'Low confidence',
          category: 'General Remodel' as any,
          salesPitch: 'Pitch',
          urgency: 'Low',
          estimatedValue: 0,
        },
        enrichmentData: {
          verified: true,
        },
      } as any;

      // valuationScore = 0
      // confidenceScore = 0
      // recencyScore = ((90 - 100) / 90) * 15 = (-10/90)*15 = -1.66 => clamp to 0
      // enrichmentScore = 5
      // total = 0 + 0 + 0 + 5 = 5
      expect(computeLeadScore(permit as any)).toBe(5);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should clamp score to 0 for all zero/old/stale values', () => {
      // This test ensures the score is 0 for minimum input values.
      const permit: EnrichedPermit = {
        id: '5',
        permitNumber: 'E345',
        permitType: 'Commercial Remodel',
        address: '345 Cedar St',
        city: 'Arlington',
        appliedDate: '1900-01-01T00:00:00.000Z', // very old date
        description: 'Old',
        applicant: 'Charlie Brown',
        valuation: 0,
        status: 'Issued',
        aiAnalysis: {
          isCommercialTrigger: false,
          confidenceScore: 0,
          projectType: 'Maintenance/Repair',
          tradeOpportunities: {
            securityIntegrator: false,
            signage: false,
            lowVoltageIT: false,
          },
          extractedEntities: {},
          reasoning: 'None',
          category: 'Uncategorized' as any,
          salesPitch: 'Pitch',
          urgency: 'Low',
          estimatedValue: 0,
        },
        enrichmentData: {
          verified: false,
        },
      } as any;

      expect(computeLeadScore(permit as any)).toBe(0);
    });

    it('should clamp score to 100 if sum exceeds 100', () => {
      // This test ensures the score does not exceed 100.
      const permit: EnrichedPermit = {
        id: '6',
        permitNumber: 'F678',
        permitType: 'New Construction',
        address: '678 Maple St',
        city: 'Dallas',
        appliedDate: new Date().toISOString(), // today
        description: 'Big Project',
        applicant: 'Dana White',
        valuation: 2000000, // $2M, over max
        status: 'Issued',
        aiAnalysis: {
          isCommercialTrigger: true,
          confidenceScore: 200, // over max
          projectType: 'New Construction',
          tradeOpportunities: {
            securityIntegrator: true,
            signage: true,
            lowVoltageIT: true,
          },
          extractedEntities: {},
          reasoning: 'Very high confidence',
          category: 'General Remodel' as any,
          salesPitch: 'Pitch',
          urgency: 'High',
          estimatedValue: 2000000,
        },
        enrichmentData: {
          verified: true,
        },
      } as any;

      expect(computeLeadScore(permit as any)).toBe(100);
    });

    it('should treat invalid appliedDate as stale and give minimum recency score', () => {
      // This test ensures invalid dates are handled as stale.
      const permit: EnrichedPermit = {
        id: '7',
        permitNumber: 'G901',
        permitType: 'Certificate of Occupancy',
        address: '901 Birch St',
        city: 'Plano',
        appliedDate: 'not-a-date', // invalid date
        description: 'Invalid Date',
        applicant: 'Eve Adams',
        valuation: 1000000,
        status: 'Issued',
        aiAnalysis: {
          isCommercialTrigger: true,
          confidenceScore: 100,
          projectType: 'Certificate of Occupancy',
          tradeOpportunities: {
            securityIntegrator: true,
            signage: true,
            lowVoltageIT: true,
          },
          extractedEntities: {},
          reasoning: 'High confidence',
          category: 'Security & Access Control' as any,
          salesPitch: 'Pitch',
          urgency: 'High',
          estimatedValue: 1000000,
        },
        enrichmentData: {
          verified: true,
        },
      } as any;

      // recencyDays = RECENCY_THRESHOLD_DAYS * 2 = 180
      // recencyScore = ((90 - 180) / 90) * 15 = (-90/90)*15 = -15 => clamp to 0
      // valuationScore = 40
      // confidenceScore = 40
      // enrichmentScore = 5
      // total = 40 + 40 + 0 + 5 = 85
      expect(computeLeadScore(permit as any)).toBe(85);
    });

    it('should handle missing aiAnalysis and enrichmentData gracefully', () => {
      // This test ensures missing optional fields default to zero.
      const permit: EnrichedPermit = {
        id: '8',
        permitNumber: 'H234',
        permitType: 'Commercial Remodel',
        address: '234 Spruce St',
        city: 'Frisco',
        appliedDate: new Date().toISOString(),
        description: 'No AI or enrichment',
        applicant: 'Frank Miller',
        valuation: 1000000,
        status: 'Issued',
      } as any;

      // valuationScore = 40
      // confidenceScore = 0
      // recencyScore = 15
      // enrichmentScore = 0
      // total = 40 + 0 + 15 + 0 = 55
      expect(computeLeadScore(permit as any)).toBe(55);
    });

    it('should handle aiAnalysis.confidenceScore = undefined', () => {
      // This test ensures undefined confidenceScore is treated as zero.
      const permit: EnrichedPermit = {
        id: '9',
        permitNumber: 'I567',
        permitType: 'New Construction',
        address: '567 Willow St',
        city: 'Irving',
        appliedDate: new Date().toISOString(),
        description: 'Undefined confidence',
        applicant: 'Grace Hopper',
        valuation: 1000000,
        status: 'Issued',
        aiAnalysis: {
          isCommercialTrigger: true,
          confidenceScore: undefined as any,
          projectType: 'New Construction',
          tradeOpportunities: {
            securityIntegrator: true,
            signage: true,
            lowVoltageIT: true,
          },
          extractedEntities: {},
          reasoning: 'No confidence',
          category: 'General Remodel' as any,
          salesPitch: 'Pitch',
          urgency: 'High',
          estimatedValue: 1000000,
        },
        enrichmentData: {
          verified: true,
        },
      } as any;

      // valuationScore = 40
      // confidenceScore = 0
      // recencyScore = 15
      // enrichmentScore = 5
      // total = 40 + 0 + 15 + 5 = 60
      expect(computeLeadScore(permit as any)).toBe(60);
    });

    it('should handle enrichmentData.verified = false', () => {
      // This test ensures enrichmentScore is zero when verified is false.
      const permit: EnrichedPermit = {
        id: '10',
        permitNumber: 'J890',
        permitType: 'Certificate of Occupancy',
        address: '890 Poplar St',
        city: 'Arlington',
        appliedDate: new Date().toISOString(),
        description: 'Unverified enrichment',
        applicant: 'Henry Ford',
        valuation: 1000000,
        status: 'Issued',
        aiAnalysis: {
          isCommercialTrigger: true,
          confidenceScore: 100,
          projectType: 'Certificate of Occupancy',
          tradeOpportunities: {
            securityIntegrator: true,
            signage: true,
            lowVoltageIT: true,
          },
          extractedEntities: {},
          reasoning: 'High confidence',
          category: 'Security & Access Control' as any,
          salesPitch: 'Pitch',
          urgency: 'High',
          estimatedValue: 1000000,
        },
        enrichmentData: {
          verified: false,
        },
      } as any;

      // valuationScore = 40
      // confidenceScore = 40
      // recencyScore = 15
      // enrichmentScore = 0
      // total = 40 + 40 + 15 + 0 = 95
      expect(computeLeadScore(permit as any)).toBe(95);
    });
  });
});