import React from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import PermitMap from './PermitMap';
import PermitCardWithVisibility from './PermitCardWithVisibility';
import ScoringAnalytics from './ScoringAnalytics';
import type { EnrichedPermit } from '../types';
import type { ViewMode } from '../hooks/useViewMode';

interface ViewRendererProps {
  viewMode: ViewMode;
  permits: EnrichedPermit[];
  loadingIds: Set<string>;
  onSelectPermit: (permit: EnrichedPermit | null) => void;
  onAnalyze: (permitId: string, selectedPermit: EnrichedPermit | null, setSelectedPermit: (p: EnrichedPermit | null) => void) => void;
  onClaimLead: (permit: EnrichedPermit) => void;
}

/**
 * Renders the appropriate view (list/map/analytics) based on viewMode
 * Handles empty states and error boundaries
 */
export const ViewRenderer: React.FC<ViewRendererProps> = ({
  viewMode,
  permits,
  loadingIds,
  onSelectPermit,
  onAnalyze,
  onClaimLead
}) => {
  if (viewMode === 'analytics') {
    return <ScoringAnalytics permits={permits} />;
  }

  if (viewMode === 'map') {
    return (
      <div className="relative z-0">
        <ErrorBoundary
          fallback={
            <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
              <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-300">Map Unavailable</h3>
              <p className="text-slate-500">
                The map encountered an error. Try the list view instead.
              </p>
            </div>
          }
        >
          <PermitMap
            permits={permits}
            onSelect={(p) => {
              if (p.aiAnalysis) {
                onSelectPermit(p);
              } else {
                alert(
                  'Select a lead to run AI analysis or click the card to view details.'
                );
              }
            }}
          />
        </ErrorBoundary>
      </div>
    );
  }

  // List view (default)
  return (
    <div className="space-y-4">
      {permits.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
          <Search className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-300">No leads found</h3>
          <p className="text-slate-500">
            Try adjusting your filters or city selection.
          </p>
        </div>
      ) : (
        permits.map((permit) => (
          <PermitCardWithVisibility
            key={permit.id}
            permit={permit}
            onSelectPermit={() =>
              permit.aiAnalysis && onSelectPermit(permit)
            }
            onClaimLead={() => onClaimLead(permit)}
            onAnalyze={() => onAnalyze(permit.id, null, () => {})}
            isAnalyzing={loadingIds.has(permit.id)}
          />
        ))
      )}
    </div>
  );
};

export default ViewRenderer;
