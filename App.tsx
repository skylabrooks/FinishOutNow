import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import AppNavbar from './components/AppNavbar';
import NavigationSidebar from './components/NavigationSidebar';
import Dashboard from './components/Dashboard';
import PermitMap from './components/PermitMap';
import AcquiredLeadsDashboard from './components/AcquiredLeadsDashboard';
import AnalysisModal from './components/AnalysisModal';
import SettingsModal from './components/SettingsModal';
import AlertPreferencesModal from './components/AlertPreferencesModal';
import LeadClaimModal from './components/LeadClaimModal';
import { EnrichedPermit } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { usePermitManagement } from './hooks/usePermitManagement';
import { useCompanyProfile } from './hooks/useCompanyProfile';
import { useFilters } from './hooks/useFilters';
import { usePlanFeatures } from './hooks/usePlanFeatures';
import ViewRenderer from './components/ViewRenderer';
import PermitToolbar from './components/PermitToolbar';
import { exportPermitsToCSV } from './utils/csvExport';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedPermit, setSelectedPermit] = useState<EnrichedPermit | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Hooks for data management
  const { companyProfile, setCompanyProfile } = useCompanyProfile();
  const {
    permits,
    setPermits,
    loadingIds,
    isRefreshing,
    isBatchScanning,
    refreshLeads,
    handleAnalyze,
    handleBatchScan,
  } = usePermitManagement(companyProfile);

  const {
    filterCity,
    setFilterCity,
    sortKey,
    sortDirection,
    handleSort,
    filteredPermits,
    stats
  } = useFilters(permits);

  const { planAllowsFeature } = usePlanFeatures();

  // Handle permit selection from any child component
  useEffect(() => {
    const handleOpenPermit = (event: CustomEvent<EnrichedPermit>) => {
      setSelectedPermit(event.detail);
      setIsAnalysisModalOpen(true);
    };

    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenAlerts = () => setIsAlertsOpen(true);
    
    const handleClaimPermit = (event: CustomEvent<EnrichedPermit>) => {
      setSelectedPermit(event.detail);
      setIsClaimModalOpen(true);
    };

    window.addEventListener('open-permit-details', handleOpenPermit as EventListener);
    window.addEventListener('open-settings', handleOpenSettings);
    window.addEventListener('open-alerts', handleOpenAlerts);
    window.addEventListener('claim-permit', handleClaimPermit as EventListener);

    return () => {
      window.removeEventListener('open-permit-details', handleOpenPermit as EventListener);
      window.removeEventListener('open-settings', handleOpenSettings);
      window.removeEventListener('open-alerts', handleOpenAlerts);
      window.removeEventListener('claim-permit', handleClaimPermit as EventListener);
    };
  }, []);

  const closeAnalysisModal = () => {
    setIsAnalysisModalOpen(false);
    setSelectedPermit(null);
  };

  const closeClaimModal = () => {
    setIsClaimModalOpen(false);
    setSelectedPermit(null);
  };

  const handleClaimSuccess = () => {
    closeClaimModal();
    // Remove the claimed permit from the main list if desired, or refresh
    if (selectedPermit) {
       setPermits(prev => prev.filter(p => p.id !== selectedPermit.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">FinishOutNow</h1>
          <p className="text-slate-400 mb-8">Sign in to access the intelligence platform</p>
          <button 
            onClick={() => { /* Trigger login logic here if needed, or rely on AuthContext */ }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-lg transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            <Dashboard stats={stats} />
            <PermitToolbar
              filterCity={filterCity}
              setFilterCity={setFilterCity}
              onRefresh={refreshLeads}
              isRefreshing={isRefreshing}
              onBatchScan={() => handleBatchScan(filteredPermits, null, () => {})}
              isBatchScanning={isBatchScanning}
              onExportCSV={() => exportPermitsToCSV(filteredPermits)}
              canBatch={planAllowsFeature('batch')}
              canExport={planAllowsFeature('csv')}
            />
            <ViewRenderer
              viewMode="list"
              permits={filteredPermits}
              loadingIds={loadingIds}
              onSelectPermit={(p) => {
                setSelectedPermit(p);
                setIsAnalysisModalOpen(true);
              }}
              onAnalyze={handleAnalyze}
              onClaimLead={(p) => {
                setSelectedPermit(p);
                setIsClaimModalOpen(true);
              }}
            />
          </>
        );
      case 'map':
        return <PermitMap permits={filteredPermits} />;
      case 'leads':
        return (
            <AcquiredLeadsDashboard 
                businessId={user.uid} 
                isOpen={true} 
                onClose={() => setActiveView('dashboard')} 
                permits={permits} 
                companyProfile={companyProfile} 
            />
        );
      default:
        return <Dashboard stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <NavigationSidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <AppNavbar user={user} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnalysisModal
        isOpen={isAnalysisModalOpen} // Changed from permit={...} to isOpen/onClose pattern if component supports it, or check props
        onClose={closeAnalysisModal}
        permit={selectedPermit}
        companyProfile={companyProfile}
        onRemoveClaimed={handleClaimSuccess}
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={companyProfile}
        onSave={setCompanyProfile}
        onOpenDiagnostics={() => {}}
      />

      <AlertPreferencesModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />

      <LeadClaimModal
        isOpen={isClaimModalOpen} // Check if component supports isOpen
        onClose={closeClaimModal}
        permit={selectedPermit}
        businessName={companyProfile.name}
        userEmail={user.email || ''}
        businessId={user.uid}
        onClaimed={handleClaimSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
