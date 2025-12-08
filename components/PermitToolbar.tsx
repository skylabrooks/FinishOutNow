import React from 'react';
import { RefreshCw, Sparkles, Download } from 'lucide-react';

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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => setFilterCity(city)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filterCity === city
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
          title="Refresh Live Data"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
        </button>

        <button
          onClick={onBatchScan}
          disabled={isBatchScanning || !canBatch}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          {canBatch ? 'Optimize Leads' : 'Upgrade Plan'}
        </button>

        {canExport && (
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium text-sm transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>
    </div>
  );
}
