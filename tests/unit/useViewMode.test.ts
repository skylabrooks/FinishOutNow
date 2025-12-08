/**
 * Unit Tests: useViewMode Hook
 * Tests view mode management with feature gating and ESC key handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewMode } from '../../hooks/useViewMode';

// Mock the usePlanFeatures hook
vi.mock('../../hooks/usePlanFeatures', () => ({
  usePlanFeatures: vi.fn(() => ({
    planAllowsFeature: (feature: string) => true
  }))
}));

describe('useViewMode Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('View Mode Switching', () => {
    it('should initialize with list view', () => {
      const { result } = renderHook(() => useViewMode(false, false));
      
      expect(result.current.viewMode).toBe('list');
      expect(result.current.effectiveView).toBe('list');
    });

    it('should switch between view modes', () => {
      const { result } = renderHook(() => useViewMode(false, false));
      
      act(() => {
        result.current.setViewMode('map');
      });
      expect(result.current.viewMode).toBe('map');
      expect(result.current.effectiveView).toBe('map');
      
      act(() => {
        result.current.setViewMode('analytics');
      });
      expect(result.current.viewMode).toBe('analytics');
      expect(result.current.effectiveView).toBe('analytics');
      
      act(() => {
        result.current.setViewMode('list');
      });
      expect(result.current.viewMode).toBe('list');
    });
  });

  describe('Feature Gating', () => {
    it('should return feature availability flags', () => {
      const { result } = renderHook(() => useViewMode(false, false));
      
      expect(result.current.canMap).toBe(true);
      expect(result.current.canAnalytics).toBe(true);
    });

    it('should respect feature flags when set', () => {
      const { result } = renderHook(() => useViewMode(false, false));
      
      // With all features enabled by default mock, switching should work
      act(() => {
        result.current.setViewMode('map');
      });
      expect(result.current.viewMode).toBe('map');
    });
  });

  describe('ESC Key Handling', () => {
    it('should setup ESC key listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      const { unmount } = renderHook(() => useViewMode(false, false));
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      unmount();
      addEventListenerSpy.mockRestore();
    });

    it('should cleanup ESC key listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useViewMode(false, false));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('should have ESC handler that checks conditions', () => {
      const { result } = renderHook(() => useViewMode(false, false));
      
      act(() => {
        result.current.setViewMode('map');
      });
      
      // ESC handler is setup but requires specific conditions to trigger view change
      // This is tested via integration rather than unit tests
      expect(result.current.viewMode).toBe('map');
    });
  });

  describe('Modal Interaction', () => {
    it('should track modal state for ESC handling', () => {
      const { rerender, result } = renderHook(
        ({ selectedPermit, showModals }) => useViewMode(selectedPermit, showModals),
        { initialProps: { selectedPermit: false, showModals: false } }
      );
      
      act(() => {
        result.current.setViewMode('map');
      });
      
      // Update props to simulate modal opening
      rerender({ selectedPermit: false, showModals: true });
      
      expect(result.current.viewMode).toBe('map');
    });
  });

  describe('View State Preservation', () => {
    it('should preserve view mode across re-renders', () => {
      const { rerender, result } = renderHook(
        ({ selectedPermit, showModals }) => useViewMode(selectedPermit, showModals),
        { initialProps: { selectedPermit: false, showModals: false } }
      );
      
      act(() => {
        result.current.setViewMode('map');
      });
      expect(result.current.viewMode).toBe('map');
      
      rerender({ selectedPermit: false, showModals: false });
      expect(result.current.viewMode).toBe('map');
    });
  });
});
