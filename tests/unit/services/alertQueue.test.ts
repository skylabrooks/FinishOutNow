/**
 * Alert Queue Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  matchesPreferences,
  createAlertQueueItem,
  processLeadsForAlerts,
  filterLeadsByPreferences,
  generateAlertSummary
} from '../../../services/alerts/alertQueue';
import { EnrichedPermit, UserPreferences, LeadCategory } from '../../../types';

describe('Alert Queue Service', () => {
  const mockLead: EnrichedPermit = {
    id: 'lead-1',
    permitNumber: 'P2023-001',
    permitType: 'Commercial Remodel',
    address: '123 Main St, Dallas, TX 75201',
    city: 'Dallas',
    appliedDate: new Date().toISOString(),
    description: 'Commercial tenant improvement',
    applicant: 'ABC Construction',
    valuation: 150000,
    status: 'Issued',
    leadScore: 75,
    aiAnalysis: {
      isCommercialTrigger: true,
      confidenceScore: 85,
      projectType: 'Tenant Improvement',
      tradeOpportunities: {
        securityIntegrator: true,
        signage: false,
        lowVoltageIT: true
      },
      extractedEntities: {
        tenantName: 'Tech Startup',
        generalContractor: 'ABC Construction'
      },
      reasoning: 'High confidence commercial project',
      category: LeadCategory.SECURITY,
      salesPitch: 'Great opportunity for security installation',
      urgency: 'High',
      estimatedValue: 25000
    }
  };

  const mockPreferences: UserPreferences = {
    userId: 'user-1',
    enabled: true,
    notificationChannels: ['email', 'in_app'],
    scoringThresholds: {
      minLeadScore: 60,
      minValuation: 100000
    },
    geoFilters: {
      cities: ['Dallas', 'Fort Worth']
    },
    categories: [LeadCategory.SECURITY],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('matchesPreferences', () => {
    it('should match lead to preferences', () => {
      expect(matchesPreferences(mockLead, mockPreferences)).toBe(true);
    });

    it('should not match if preferences are disabled', () => {
      const disabledPrefs = { ...mockPreferences, enabled: false };
      expect(matchesPreferences(mockLead, disabledPrefs)).toBe(false);
    });

    it('should not match if lead score is too low', () => {
      const lowScoreLead = { ...mockLead, leadScore: 40 };
      expect(matchesPreferences(lowScoreLead, mockPreferences)).toBe(false);
    });

    it('should not match if valuation is too low', () => {
      const lowValueLead = { ...mockLead, valuation: 50000 };
      expect(matchesPreferences(lowValueLead, mockPreferences)).toBe(false);
    });

    it('should not match if city is not in filter', () => {
      const otherCityLead = { ...mockLead, city: 'Plano' as any };
      expect(matchesPreferences(otherCityLead, mockPreferences)).toBe(false);
    });

    it('should not match if category is not in filter', () => {
      const otherCategoryLead = {
        ...mockLead,
        aiAnalysis: { ...mockLead.aiAnalysis!, category: LeadCategory.SIGNAGE }
      };
      expect(matchesPreferences(otherCategoryLead, mockPreferences)).toBe(false);
    });
  });

  describe('createAlertQueueItem', () => {
    it('should create alert queue item with correct structure', () => {
      const item = createAlertQueueItem('user-1', mockLead, ['email']);
      
      expect(item.userId).toBe('user-1');
      expect(item.leadId).toBe(mockLead.id);
      expect(item.lead).toEqual(mockLead);
      expect(item.channels).toEqual(['email']);
      expect(item.status).toBe('pending');
      expect(item.id).toBeDefined();
      expect(item.createdAt).toBeDefined();
    });
  });

  describe('processLeadsForAlerts', () => {
    it('should process matching leads for multiple users', () => {
      const leads = [mockLead];
      const preferences = [mockPreferences];
      
      const alerts = processLeadsForAlerts(leads, preferences);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].userId).toBe('user-1');
      expect(alerts[0].leadId).toBe('lead-1');
    });

    it('should not create alerts for non-matching leads', () => {
      const lowScoreLead = { ...mockLead, leadScore: 30 };
      const alerts = processLeadsForAlerts([lowScoreLead], [mockPreferences]);
      
      expect(alerts).toHaveLength(0);
    });
  });

  describe('filterLeadsByPreferences', () => {
    it('should filter leads that match preferences', () => {
      const leads = [
        mockLead,
        { ...mockLead, id: 'lead-2', leadScore: 40 },
        { ...mockLead, id: 'lead-3', city: 'Plano' as any }
      ];
      
      const filtered = filterLeadsByPreferences(leads, mockPreferences);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('lead-1');
    });
  });

  describe('generateAlertSummary', () => {
    it('should generate summary statistics', () => {
      const leads = [
        mockLead,
        { ...mockLead, id: 'lead-2', valuation: 200000, leadScore: 80 }
      ];
      
      const summary = generateAlertSummary(leads);
      
      expect(summary.totalMatches).toBe(2);
      expect(summary.avgLeadScore).toBe(77.5);
      expect(summary.totalValuation).toBe(350000);
      expect(summary.cityCounts['Dallas']).toBe(2);
      expect(summary.topCategories[LeadCategory.SECURITY]).toBe(2);
    });

    it('should handle empty leads array', () => {
      const summary = generateAlertSummary([]);
      
      expect(summary.totalMatches).toBe(0);
      expect(summary.avgLeadScore).toBe(0);
      expect(summary.totalValuation).toBe(0);
    });
  });
});
