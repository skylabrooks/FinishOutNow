import React from 'react';
import { FileText, MapIcon, Zap, Calendar, DollarSign, ArrowUpDown } from 'lucide-react';

type ViewMode = 'list' | 'map' | 'analytics';
type SortKey = 'appliedDate' | 'valuation' | 'confidence' | 'city';

interface NavigationSidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortKey: SortKey;
  sortDirection: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  canMap: boolean;
  canAnalytics: boolean;
}

const SORT_OPTIONS = [
  { key: 'appliedDate' as SortKey, label: 'Date Applied', icon: Calendar },
  { key: 'valuation' as SortKey, label: 'Valuation', icon: DollarSign },
  { key: 'confidence' as SortKey, label: 'AI Confidence', icon: Zap },
  { key: 'city' as SortKey, label: 'City', icon: FileText },
];

export default function NavigationSidebar({
  viewMode,
  setViewMode,
  sortKey,
  sortDirection,
  onSort,
  canMap,
  canAnalytics,
}: NavigationSidebarProps) {
  return (
    <div className="hidden lg:block space-y-2 sticky top-24">
      <button
        onClick={() => setViewMode('list')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          viewMode === 'list'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
            : 'text-slate-400 hover:bg-slate-800/50'
        }`}
      >
        <FileText size={18} />
        <span className="font-medium">Permit Feed</span>
      </button>

      {canMap && (
        <button
          onClick={() => setViewMode('map')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            viewMode === 'map'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:bg-slate-800/50'
          }`}
        >
          <MapIcon size={18} />
          <span className="font-medium">Map View</span>
        </button>
      )}

      {canAnalytics && (
        <button
          onClick={() => setViewMode('analytics')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            viewMode === 'analytics'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:bg-slate-800/50'
          }`}
        >
          <Zap size={18} />
          <span className="font-medium">Analytics</span>
        </button>
      )}

      <div className="mt-8 px-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Sort By
        </h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map((item) => (
            <button
              key={item.key}
              onClick={() => onSort(item.key)}
              className={`w-full flex items-center justify-between text-sm py-2 group ${
                sortKey === item.key ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <item.icon size={14} />
                {item.label}
              </span>
              {sortKey === item.key && (
                <ArrowUpDown size={12} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
