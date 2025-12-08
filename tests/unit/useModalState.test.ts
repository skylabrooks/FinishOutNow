/**
 * Unit Tests: useModalState Hook
 * Tests modal state management in isolation
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalState } from '../../hooks/useModalState';
import type { EnrichedPermit } from '../../types';

const mockPermit: EnrichedPermit = {
  id: 'permit-1',
  city: 'Dallas',
  appliedDate: '2025-01-01',
  permitType: 'Commercial',
  description: 'Test permit',
  address: '123 Main St',
  valuation: 100000,
  applicant: 'Test Applicant'
} as any;

describe('useModalState Hook', () => {
  describe('Modal Visibility', () => {
    it('should initialize with all modals closed', () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.isSettingsOpen).toBe(false);
      expect(result.current.isDiagnosticsOpen).toBe(false);
      expect(result.current.showClaimModal).toBe(false);
      expect(result.current.showAcquiredLeads).toBe(false);
    });

    it('should open and close settings modal', () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.openSettings();
      });
      expect(result.current.isSettingsOpen).toBe(true);
      
      act(() => {
        result.current.closeSettings();
      });
      expect(result.current.isSettingsOpen).toBe(false);
    });

    it('should open diagnostics and close settings', () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.openSettings();
      });
      expect(result.current.isSettingsOpen).toBe(true);
      
      act(() => {
        result.current.openDiagnostics();
      });
      expect(result.current.isSettingsOpen).toBe(false);
      expect(result.current.isDiagnosticsOpen).toBe(true);
    });

    it('should close diagnostics', () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.openDiagnostics();
      });
      expect(result.current.isDiagnosticsOpen).toBe(true);
      
      act(() => {
        result.current.closeDiagnostics();
      });
      expect(result.current.isDiagnosticsOpen).toBe(false);
    });
  });

  describe('Permit Selection', () => {
    it('should select and deselect permit', () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.selectedPermit).toBeNull();
      
      act(() => {
        result.current.selectPermit(mockPermit);
      });
      expect(result.current.selectedPermit).toEqual(mockPermit);
      
      act(() => {
        result.current.selectPermit(null);
      });
      expect(result.current.selectedPermit).toBeNull();
    });
  });

  describe('Claim Modal', () => {
    it('should open claim modal with permit', () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.showClaimModal).toBe(false);
      
      act(() => {
        result.current.openClaimModal(mockPermit);
      });
      expect(result.current.showClaimModal).toBe(true);
      expect(result.current.selectedLeadForClaim).toEqual(mockPermit);
    });

    it('should close claim modal and clear selection', () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.openClaimModal(mockPermit);
      });
      expect(result.current.showClaimModal).toBe(true);
      
      act(() => {
        result.current.closeClaimModal();
      });
      expect(result.current.showClaimModal).toBe(false);
      expect(result.current.selectedLeadForClaim).toBeNull();
    });
  });

  describe('Acquired Leads Dashboard', () => {
    it('should toggle acquired leads visibility', () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.showAcquiredLeads).toBe(false);
      
      act(() => {
        result.current.openAcquiredLeads();
      });
      expect(result.current.showAcquiredLeads).toBe(true);
      
      act(() => {
        result.current.closeAcquiredLeads();
      });
      expect(result.current.showAcquiredLeads).toBe(false);
    });
  });

  describe('State Independence', () => {
    it('should manage independent modal states', () => {
      const { result } = renderHook(() => useModalState());
      
      act(() => {
        result.current.openSettings();
        result.current.openAcquiredLeads();
      });
      
      expect(result.current.isSettingsOpen).toBe(true);
      expect(result.current.showAcquiredLeads).toBe(true);
      expect(result.current.isDiagnosticsOpen).toBe(false);
    });
  });
});
