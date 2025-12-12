import React from 'react';
import { RefreshCw, Sparkles, Download, Filter, MapPin } from 'lucide-react';

interface PermitToolbarProps {
  filterCity: string;
  setFilterCity: (city: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onBatchScan: () => void;
  isBatchScanning: boolean;
  onExportCSV: () => void;
  canBatch: boolean;
  canExport: boolean;
}

const CITIES = ['All', 'Dallas', 'Fort Worth', 'Plano', 'Arlington', 'Irving', 'Frisco'];

export default function PermitToolbar({
  filterCity,
  setFilterCity,
  onRefresh,
  isRefreshing,
  onBatchScan,
  isBatchScanning,
  onExportCSV,
  canBatch,
  canExport,
}: PermitToolbarProps) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 bg-slate-900/30 p-2 rounded-xl border border-slate-800/50 backdrop-blur-sm">
      
      {/* City Filter */}
      <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide">
        <div className="flex items-center gap-2 px-2 text-slate-500 border-r border-slate-800 mr-2">
          <MapPin size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Region</span>
        </div>
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => setFilterCity(city)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filterCity === city
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 border border-indigo-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all disabled:opacity-50"
          title="Refresh Live Data"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        <button
          onClick={onBatchScan}
          disabled={isBatchScanning || !canBatch}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-medium text-xs transition-all shadow-lg shadow-indigo-900/20 border border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={14} />
          {isBatchScanning ? 'Analyzing...' : canBatch ? 'Run AI Analysis' : 'Upgrade Plan'}
        </button>

        {canExport && (
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium text-xs transition-all"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>
    </div>
  );
}
