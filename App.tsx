
import React, { useState, useEffect } from 'react';
import { leadManager } from './services/leadManager';
import { analyzePermit } from './services/geminiService';
import { EnrichedPermit, LeadCategory, CompanyProfile } from './types';
import Dashboard from './components/Dashboard';
import AnalysisModal from './components/AnalysisModal';
import SettingsModal from './components/SettingsModal';
import DiagnosticPanel from './components/DiagnosticPanel';
import PermitMap from './components/PermitMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutDashboard, Map as MapIcon, FileText, Settings, Search, Loader2, Sparkles, AlertTriangle, ArrowUpDown, Calendar, DollarSign, Hammer, FileCheck, Shield, Monitor, PenTool, Download, PlayCircle, Zap, RefreshCw, Radio, User, CheckCircle } from 'lucide-react';

// Default Profile for Demo
const DEFAULT_PROFILE: CompanyProfile = {
    name: "Apex Security Integrators",
    industry: LeadCategory.SECURITY,
    contactName: "Mike Ross",
    email: "mike@apexdfw.com",
    phone: "214-555-0199",
    website: "www.apexdfw.com",
    valueProp: "We specialize in rapid access control deployment for high-security commercial tenants."
};

const STORAGE_KEY_PERMITS = 'finishOutNow_permits_v1';
const STORAGE_KEY_PROFILE = 'finishOutNow_profile_v1';

const App: React.FC = () => {
  // Persistence: Load from LocalStorage or Fallback to Mock
  const [permits, setPermits] = useState<EnrichedPermit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERMITS);
      return saved ? JSON.parse(saved) : []; 
    } catch (e) {
      console.error("Failed to load permits from storage", e);
      return [];
    }
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  });

  const [selectedPermit, setSelectedPermit] = useState<EnrichedPermit | null>(null);
  const [filterCity, setFilterCity] = useState<string>('All');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Sorting state
  const [sortKey, setSortKey] = useState<'appliedDate' | 'valuation' | 'city' | 'confidence'>('appliedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
        if (permits.length === 0) {
            await refreshLeads();
        }
    };
    initData();
  }, []);

  // Persistence: Save on Change
  useEffect(() => {
    if (permits.length > 0) {
        localStorage.setItem(STORAGE_KEY_PERMITS, JSON.stringify(permits));
    }
  }, [permits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(companyProfile));
  }, [companyProfile]);

  const refreshLeads = async () => {
      setIsRefreshing(true);
      try {
          // preserve existing analysis to not lose money/work
          const analyzedMap = new Map(
            permits.filter(p => p.aiAnalysis).map(p => [p.id, p])
          );

          const freshLeads = await leadManager.fetchAllLeads();
          
          // Merge: Use fresh data but keep analysis if ID matches
          const merged = freshLeads.map(newLead => {
              const existing = analyzedMap.get(newLead.id);
              if (existing) {
                  return { ...newLead, aiAnalysis: existing.aiAnalysis, enrichmentData: existing.enrichmentData };
              }
              return newLead;
          });

          setPermits(merged);
      } catch (error) {
          console.error("Failed to refresh leads", error);
      } finally {
          setIsRefreshing(false);
      }
  };

  const handleAnalyze = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Find permit
    const permit = permits.find(p => p.id === id);
    if (!permit) return;

    // Prevent double click
    if (loadingIds.has(id)) return;

    setLoadingIds(prev => new Set(prev).add(id));

    try {
      // 1. Run AI Analysis
      const analysis = await analyzePermit(
          permit.description, 
          permit.valuation, 
          permit.city,
          permit.permitType,
          companyProfile
      );

      let updatedPermit: EnrichedPermit = { ...permit, aiAnalysis: analysis };

      // 2. Run Entity Enrichment (Resolution)
      // This uses the extracted tenant name from Gemini to find the legal entity
      updatedPermit = await leadManager.enrichPermit(updatedPermit);

      setPermits(prev => prev.map(p => p.id === id ? updatedPermit : p));
      
      // If modal is open for this item, update it
      if (selectedPermit && selectedPermit.id === id) {
          setSelectedPermit(updatedPermit);
      }

    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBatchScan = async () => {
      setIsBatchScanning(true);
      const unanalyzed = filteredPermits.filter(p => !p.aiAnalysis);
      
      for (const permit of unanalyzed) {
          // Scroll into view if possible
          const element = document.getElementById(`permit-card-${permit.id}`);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          await handleAnalyze(permit.id);
          
          // Artificial delay to respect API Rate Limits and "Vibe"
          await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setIsBatchScanning(false);
  };

  const handleDownloadCSV = () => {
    const headers = ["ID", "City", "Date Applied", "Permit Type", "Description", "Address", "Valuation", "Applicant", "Tenant Name", "Category", "Is Commercial", "Confidence %", "Urgency", "Est. Opportunity Value", "Sales Pitch", "Verified Entity", "Entity Name", "Taxpayer ID", "Mailing Address"];
    const rows = filteredPermits
        .map(p => [
            p.id,
            p.city,
            p.appliedDate,
            p.permitType,
            p.description.substring(0, 100), // Truncate for readability
            p.address,
            p.valuation,
            p.applicant,
            p.aiAnalysis?.extractedEntities.tenantName || "N/A",
            p.aiAnalysis?.category || "Uncategorized",
            p.aiAnalysis?.isCommercialTrigger ? "Yes" : "No",
            p.aiAnalysis?.confidenceScore || 0,
            p.aiAnalysis?.urgency || "Unknown",
            p.aiAnalysis?.estimatedOpportunityValue || 0,
            `"${p.aiAnalysis?.salesPitch?.replace(/"/g, '""') || ''}"`, // Escape quotes
            p.enrichmentData?.verified ? "Yes" : "No",
            p.enrichmentData?.taxpayerName || "N/A",
            p.enrichmentData?.taxpayerNumber || "N/A",
            `"${p.enrichmentData?.officialMailingAddress?.replace(/"/g, '""') || 'N/A'}"` // Escape quotes
        ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finishout_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: typeof sortKey) => {
      if (sortKey === key) {
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortKey(key);
          setSortDirection('desc');
      }
  };

  // Stats Calculation
  const stats = {
    totalValue: permits.reduce((acc, p) => acc + (p.aiAnalysis?.estimatedOpportunityValue || 0), 0),
    activeLeads: permits.filter(p => p.aiAnalysis).length,
    highPriority: permits.filter(p => p.aiAnalysis?.urgency === 'High').length,
    avgConfidence: Math.round(permits.reduce((acc, p) => acc + (p.aiAnalysis?.confidenceScore || 0), 0) / (permits.filter(p => p.aiAnalysis).length || 1))
  };

  // Filter & Sort Logic
  const filteredPermits = permits
    .filter(p => filterCity === 'All' || p.city === filterCity)
    .sort((a, b) => {
        let valA: any = a[sortKey as keyof EnrichedPermit];
        let valB: any = b[sortKey as keyof EnrichedPermit];

        // Handle nested confidence score
        if (sortKey === 'confidence') {
            valA = a.aiAnalysis?.confidenceScore || 0;
            valB = b.aiAnalysis?.confidenceScore || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">FinishOutNow</h1>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Intel Engine v1.2</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {isBatchScanning && (
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/20 text-blue-400 rounded-full border border-blue-800/50">
                     <Loader2 size={14} className="animate-spin" />
                     <span className="text-xs font-medium">Batch Processing...</span>
                 </div>
             )}
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <Settings size={20} />
            </button>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                    <p className="text-xs font-medium text-white">{companyProfile.contactName}</p>
                    <p className="text-[10px] text-slate-500">{companyProfile.name}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                    {companyProfile.contactName.charAt(0)}
                </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Dashboard Stats */}
        <Dashboard stats={stats} />

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {['All', 'Dallas', 'Fort Worth', 'Plano', 'Arlington', 'Irving', 'Frisco'].map(city => (
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
                    onClick={refreshLeads}
                    disabled={isRefreshing}
                    className="p-2.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
                    title="Refresh Live Data"
                >
                    <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                </button>
                
                 <button 
                    onClick={handleBatchScan}
                    disabled={isBatchScanning}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles size={16} />
                    Scan Page
                </button>

                <button 
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium text-sm transition-all"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <div className="hidden lg:block space-y-2 sticky top-24">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800/50'}`}
                >
                    <FileText size={18} />
                    <span className="font-medium">Permit Feed</span>
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800/50'}`}
                >
                    <MapIcon size={18} />
                    <span className="font-medium">Map View</span>
                </button>
                
                <div className="mt-8 px-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Sort By</h3>
                    <div className="space-y-1">
                        {[
                            { key: 'appliedDate', label: 'Date Applied', icon: Calendar },
                            { key: 'valuation', label: 'Valuation', icon: DollarSign },
                            { key: 'confidence', label: 'AI Confidence', icon: Zap },
                        ].map((item) => (
                             <button 
                                key={item.key}
                                onClick={() => handleSort(item.key as any)}
                                className={`w-full flex items-center justify-between text-sm py-2 group ${sortKey === item.key ? 'text-blue-400' : 'text-slate-400'}`}
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

            {/* List / Map View */}
            <div className="lg:col-span-3">
                
                {viewMode === 'map' ? (
                    <ErrorBoundary fallback={
                      <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                        <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-slate-300">Map Unavailable</h3>
                        <p className="text-slate-500">The map encountered an error. Try the list view instead.</p>
                      </div>
                    }>
                      <PermitMap permits={filteredPermits} onSelect={(p) => { if (p.aiAnalysis) setSelectedPermit(p); else alert('Select a lead to run AI analysis or click the card to view details.'); }} />
                    </ErrorBoundary>
                ) : (
                    <div className="space-y-4">
                        {filteredPermits.length === 0 ? (
                            <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                                <Search className="mx-auto text-slate-600 mb-4" size={48} />
                                <h3 className="text-lg font-medium text-slate-300">No leads found</h3>
                                <p className="text-slate-500">Try adjusting your filters or city selection.</p>
                            </div>
                        ) : (
                            filteredPermits.map(permit => (
                                <div 
                                    key={permit.id} 
                                    id={`permit-card-${permit.id}`}
                                    onClick={() => permit.aiAnalysis && setSelectedPermit(permit)}
                                    className={`group bg-slate-900 border transition-all duration-300 rounded-xl overflow-hidden relative
                                        ${permit.aiAnalysis?.isCommercialTrigger 
                                            ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-900/10' 
                                            : 'border-slate-800 hover:border-slate-700 hover:shadow-xl'
                                        }
                                        ${permit.aiAnalysis ? 'cursor-pointer' : ''}
                                    `}
                                >
                                    {/* Verification Status Stripe */}
                                    {permit.enrichmentData?.verified && (
                                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-700"></div>
                                    )}

                                    <div className="p-5 flex flex-col md:flex-row gap-6">
                                        {/* Left: Metadata */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                    ${permit.permitType === 'Certificate of Occupancy' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}
                                                `}>
                                                    {permit.permitType}
                                                </span>
                                                {permit.dataSource && (
                                                   <span className="text-[10px] text-slate-600 border border-slate-800 px-1 rounded bg-slate-900">
                                                       {permit.dataSource}
                                                   </span>
                                                )}
                                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                                    <Calendar size={12} /> {permit.appliedDate}
                                                </span>
                                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                                    • {permit.city}
                                                </span>
                                            </div>
                                            
                                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                                {permit.description.length > 80 ? permit.description.substring(0, 80) + '...' : permit.description}
                                            </h3>
                                            <p className="text-slate-400 text-sm flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                                {permit.address}
                                            </p>
                                            
                                            <div className="mt-4 flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                                                    <DollarSign size={12} className="text-emerald-400" />
                                                    {permit.valuation.toLocaleString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                                                    <User size={12} className="text-blue-400" />
                                                    {permit.applicant}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: AI Intel or Action */}
                                        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                                            {permit.aiAnalysis ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500 font-semibold uppercase">Confidence</span>
                                                        <span className={`text-lg font-bold ${
                                                            permit.aiAnalysis.confidenceScore > 80 ? 'text-emerald-400' : 
                                                            permit.aiAnalysis.confidenceScore > 50 ? 'text-yellow-400' : 'text-slate-400'
                                                        }`}>
                                                            {permit.aiAnalysis.confidenceScore}%
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Category Badge */}
                                                    <div className="flex items-center gap-2">
                                                        {permit.aiAnalysis.category === LeadCategory.SECURITY && <Shield size={14} className="text-red-400" />}
                                                        {permit.aiAnalysis.category === LeadCategory.LOW_VOLTAGE && <Monitor size={14} className="text-cyan-400" />}
                                                        {permit.aiAnalysis.category === LeadCategory.SIGNAGE && <PenTool size={14} className="text-amber-400" />}
                                                        <span className="text-sm font-medium text-white">{permit.aiAnalysis.category}</span>
                                                    </div>

                                                    {/* Verification Badge */}
                                                    {permit.enrichmentData?.verified && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50 w-fit">
                                                            <CheckCircle size={10} /> Verified Entity
                                                        </div>
                                                    )}

                                                    <button className="w-full mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1">
                                                        View Analysis <PlayCircle size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center">
                                                    <button 
                                                        onClick={(e) => handleAnalyze(permit.id, e)}
                                                        disabled={loadingIds.has(permit.id)}
                                                        className="w-full bg-slate-800 hover:bg-blue-600 hover:text-white border border-slate-700 text-slate-400 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 group/btn"
                                                    >
                                                        {loadingIds.has(permit.id) ? (
                                                            <>
                                                                <Loader2 size={16} className="animate-spin" /> Analyzing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles size={16} className="text-blue-500 group-hover/btn:text-white transition-colors" /> Run AI Analysis
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      <AnalysisModal 
        permit={selectedPermit} 
        onClose={() => setSelectedPermit(null)}
        companyProfile={companyProfile}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        profile={companyProfile}
        onSave={setCompanyProfile}
        onOpenDiagnostics={() => {
            setIsSettingsOpen(false);
            setIsDiagnosticsOpen(true);
        }}
      />

      {isDiagnosticsOpen && (
          <DiagnosticPanel onClose={() => setIsDiagnosticsOpen(false)} />
      )}

    </div>
  );
};

export default App;
