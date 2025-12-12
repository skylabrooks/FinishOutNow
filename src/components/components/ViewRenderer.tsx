import React from 'react';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';
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
      <div className="relative z-0 h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        <ErrorBoundary
          fallback={
            <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-slate-400">
              <AlertTriangle className="mb-4 text-amber-500" size={48} />
              <h3 className="text-lg font-medium text-white">Map Unavailable</h3>
              <p className="text-sm">The map component encountered an error.</p>
            </div>
          }
        >
          <PermitMap
            permits={permits}
            onSelect={(p) => {
              if (p.aiAnalysis) {
                onSelectPermit(p);
              } else {
                // Optional: Trigger analysis if not present
                alert('Select a lead to view details.');
              }
            }}
          />
        </ErrorBoundary>
      </div>
    );
  }

  // List view (default)
  return (
    <div className="space-y-3">
      {permits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
          <div className="bg-slate-800 p-4 rounded-full mb-4">
            <Search className="text-slate-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-white">No leads found</h3>
          <p className="text-slate-500 max-w-xs text-center mt-2">
            Try adjusting your city filters or run a new scan to find permits.
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
