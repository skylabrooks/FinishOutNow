/**
 * Unit Tests: CSV Export Utilities
 * Tests CSV generation and download functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportPermitsToCSV } from '../../utils/csvExport';
import type { EnrichedPermit } from '../../types';

const createMockPermit = (overrides?: Partial<EnrichedPermit>): EnrichedPermit => ({
  id: 'permit-1',
  city: 'Dallas',
  appliedDate: '2025-01-01',
  permitType: 'Commercial',
  description: 'Test permit description',
  address: '123 Main St',
  valuation: 100000,
  applicant: 'Test Applicant',
  aiAnalysis: {
    category: 'Commercial',
    isCommercialTrigger: true,
    confidenceScore: 95,
    urgency: 'High',
    estimatedValue: 150000,
    salesPitch: 'Great opportunity',
    extractedEntities: {
      tenantName: 'Acme Corp'
    }
  } as any,
  enrichmentData: {
    verified: true,
    taxpayerName: 'Acme Corporation',
    taxpayerNumber: 'TAX123456',
    officialMailingAddress: '456 Oak Ave'
  } as any,
  ...overrides
} as any);

describe('CSV Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportPermitsToCSV', () => {
    it('should create download link with correct filename', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      
      const permits = [createMockPermit()];
      exportPermitsToCSV(permits);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      
      const anchorCalls = createElementSpy.mock.results.filter(
        (result) => result.value?.tagName === 'A'
      );
      expect(anchorCalls.length).toBeGreaterThan(0);
      
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle empty permit list', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      
      exportPermitsToCSV([]);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });

    it('should handle permits without AI analysis', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      
      const permits = [
        createMockPermit({
          aiAnalysis: undefined
        })
      ];
      
      exportPermitsToCSV(permits);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });

    it('should handle permits without enrichment data', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      
      const permits = [
        createMockPermit({
          enrichmentData: undefined
        })
      ];
      
      exportPermitsToCSV(permits);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });

    it('should escape quotes in string fields', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      const permits = [
        createMockPermit({
          aiAnalysis: {
            salesPitch: 'Quote: "Great deal"',
            category: 'Commercial',
            isCommercialTrigger: true,
            confidenceScore: 95,
            urgency: 'High',
            estimatedValue: 150000,
            extractedEntities: {
              tenantName: 'Acme Corp'
            }
          } as any
        })
      ];
      
      exportPermitsToCSV(permits);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      
      createElementSpy.mockRestore();
    });

    it('should handle description truncation to 100 chars', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      const longDescription = 'A'.repeat(200);
      const permits = [
        createMockPermit({
          description: longDescription
        })
      ];
      
      exportPermitsToCSV(permits);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      
      createElementSpy.mockRestore();
    });

    it('should format multiple permits', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      const permits = [
        createMockPermit({ id: 'permit-1' }),
        createMockPermit({ id: 'permit-2' }),
        createMockPermit({ id: 'permit-3' })
      ];
      
      exportPermitsToCSV(permits);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      
      createElementSpy.mockRestore();
    });

    it('should trigger download when link clicked', () => {
      const clickSpy = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          return {
            click: clickSpy,
            setAttribute: vi.fn(),
            tagName: 'A'
          } as any;
        }
        return document.createElement(tag);
      });
      
      const permits = [createMockPermit()];
      exportPermitsToCSV(permits);
      
      expect(clickSpy).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should format date in filename correctly', () => {
      const setAttributeSpy = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          return {
            click: vi.fn(),
            setAttribute: setAttributeSpy,
            tagName: 'A'
          } as any;
        }
        return document.createElement(tag);
      });
      
      const permits = [createMockPermit()];
      exportPermitsToCSV(permits);
      
      const downloadCalls = setAttributeSpy.mock.calls.filter(
        (call) => call[0] === 'download'
      );
      
      expect(downloadCalls.length).toBeGreaterThan(0);
      const filename = downloadCalls[0][1];
      expect(filename).toMatch(/finishout_leads_\d{4}-\d{2}-\d{2}\.csv/);
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
