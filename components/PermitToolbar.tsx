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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 animate-fade-in">
      <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-800/50 shadow-lg">
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => setFilterCity(city)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterCity === city
                ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
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
          className="p-3 text-slate-400 hover:text-white bg-slate-900/70 backdrop-blur-sm border border-slate-800/70 hover:border-slate-700 hover:shadow-lg rounded-xl transition-all"
          title="Refresh Live Data"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
        </button>

        <button
          onClick={onBatchScan}
          disabled={isBatchScanning || !canBatch}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Sparkles size={16} className={isBatchScanning ? "animate-spin" : ""} />
          {canBatch ? 'Optimize Leads' : 'Upgrade Plan'}
        </button>

        {canExport && (
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/70 hover:bg-slate-700 text-white border border-slate-700/70 hover:border-slate-600 rounded-xl font-medium text-sm transition-all shadow-lg"
          >
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>
    </div>
  );
}
