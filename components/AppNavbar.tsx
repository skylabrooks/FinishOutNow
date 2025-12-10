import React from 'react';
import { LayoutDashboard, Settings, Archive, Loader2 } from 'lucide-react';
import { CompanyProfile } from '../types';

interface AppNavbarProps {
  companyProfile: CompanyProfile;
  isBatchScanning: boolean;
  onSettingsClick: () => void;
  onAcquiredLeadsClick: () => void;
  canViewAcquiredLeads: boolean;
}

export default function AppNavbar({
  companyProfile,
  isBatchScanning,
  onSettingsClick,
  onAcquiredLeadsClick,
  canViewAcquiredLeads,
}: AppNavbarProps) {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              FinishOutNow
            </h1>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              Intel Engine v1.2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isBatchScanning && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-900/20 text-blue-400 rounded-full border border-blue-800/50">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-[10px] font-medium">Batch Processing...</span>
            </div>
          )}

          {canViewAcquiredLeads && (
            <button
              onClick={onAcquiredLeadsClick}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="View acquired leads"
            >
              <Archive size={18} />
            </button>
          )}

          <button
            onClick={onSettingsClick}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <Settings size={18} />
          </button>

          <div className="h-6 w-[1px] bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <p className="text-[11px] font-medium text-white">{companyProfile.contactName}</p>
              <p className="text-[9px] text-slate-500">{companyProfile.name}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-400">
              {companyProfile.contactName.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
