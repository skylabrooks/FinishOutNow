import { useState, useEffect } from 'react';
import { usePlanFeatures } from './usePlanFeatures';

export type ViewMode = 'list' | 'map' | 'analytics';

/**
 * Custom hook to manage view mode (list/map/analytics) with ESC key handling
 * Handles keyboard navigation and feature-gated view switching
 */
export const useViewMode = (selectedPermitExists: boolean, showModals: boolean) => {
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const { planAllowsFeature } = usePlanFeatures();

  // Handle ESC key to close map view
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !e.defaultPrevented &&
        viewMode === 'map' &&
        !selectedPermitExists &&
        !showModals
      ) {
        setViewModeState('list');
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [viewMode, selectedPermitExists, showModals]);

  // Determine effective view based on plan features
  const effectiveView: ViewMode = (() => {
    if (!planAllowsFeature('map') && viewMode === 'map') return 'list';
    if (!planAllowsFeature('analytics') && viewMode === 'analytics') return 'list';
    return viewMode;
  })();

  const setViewMode = (mode: ViewMode) => {
    // Prevent switching to map/analytics if not allowed by plan
    if (mode === 'map' && !planAllowsFeature('map')) return;
    if (mode === 'analytics' && !planAllowsFeature('analytics')) return;
    setViewModeState(mode);
  };

  return {
    viewMode,
    setViewMode,
    effectiveView,
    canMap: planAllowsFeature('map'),
    canAnalytics: planAllowsFeature('analytics')
  };
};
