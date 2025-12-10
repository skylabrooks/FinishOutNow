
import React from 'react';
import { EnrichedPermit } from './types';
import Dashboard from './components/Dashboard';
import AppNavbar from './components/AppNavbar';
import PermitToolbar from './components/PermitToolbar';
import NavigationSidebar from './components/NavigationSidebar';
import AnalysisModal from './components/AnalysisModal';
import SettingsModal from './components/SettingsModal';
import DiagnosticPanel from './components/DiagnosticPanel';
import LeadClaimModal from './components/LeadClaimModal';
import AcquiredLeadsDashboard from './components/AcquiredLeadsDashboard';
import ViewRenderer from './components/ViewRenderer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePermitManagement } from './hooks/usePermitManagement';
import { useFilters } from './hooks/useFilters';
import { usePlanFeatures } from './hooks/usePlanFeatures';
import { useCompanyProfile } from './hooks/useCompanyProfile';
import { useModalState } from './hooks/useModalState';
import { useViewMode } from './hooks/useViewMode';
import { exportPermitsToCSV } from './utils/csvExport';



const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
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
    removePermit
  } = usePermitManagement(companyProfile);

  // Use centralized modal state hook
  const {
    selectedPermit,
    selectPermit,
    selectedLeadForClaim,
    isSettingsOpen,
    openSettings,
    closeSettings,
    isDiagnosticsOpen,
    openDiagnostics,
    closeDiagnostics,
    showClaimModal,
    openClaimModal,
    closeClaimModal,
    showAcquiredLeads,
    openAcquiredLeads,
    closeAcquiredLeads
  } = useModalState();

  // Use view mode hook with ESC key handling
  const { viewMode, setViewMode, effectiveView, canMap, canAnalytics } = useViewMode(
    !!selectedPermit,
    isSettingsOpen || isDiagnosticsOpen || showClaimModal
  );

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

  // Handlers
  const handleClaimLead = (permit: EnrichedPermit) => {
    openClaimModal(permit);
  };

  const handleLeadClaimed = () => {
    if (selectedLeadForClaim) {
      setPermits(permits.filter(p => p.id !== selectedLeadForClaim.id));
      selectPermit(null);
      closeClaimModal();
    }
  };

  const handleRemoveClaimedLead = () => {
    if (selectedPermit) {
      setPermits(permits.filter(p => p.id !== selectedPermit.id));
      selectPermit(null);
    }
  };

  const handleDownloadCSV = () => {
    exportPermitsToCSV(filteredPermits);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <AppNavbar
        companyProfile={companyProfile}
        isBatchScanning={isBatchScanning}
        onSettingsClick={openSettings}
        onAcquiredLeadsClick={openAcquiredLeads}
        canViewAcquiredLeads={planAllowsFeature('claim')}
      />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Dashboard Stats */}
        <Dashboard stats={stats} />

        {/* Toolbar */}
        <PermitToolbar
          filterCity={filterCity}
          setFilterCity={setFilterCity}
          onRefresh={refreshLeads}
          isRefreshing={isRefreshing}
          onBatchScan={() => handleBatchScan(filteredPermits, selectedPermit, selectPermit)}
          isBatchScanning={isBatchScanning}
          onExportCSV={handleDownloadCSV}
          canBatch={planAllowsFeature('batch')}
          canExport={planAllowsFeature('csv')}
        />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* Sidebar Navigation */}
          <NavigationSidebar
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            canMap={canMap}
            canAnalytics={canAnalytics}
          />

          {/* List / Map / Analytics View */}
          <div className="lg:col-span-3 relative z-0">
            <ViewRenderer
              viewMode={effectiveView}
              permits={filteredPermits}
              loadingIds={loadingIds}
              onSelectPermit={selectPermit}
              onAnalyze={handleAnalyze}
              onClaimLead={handleClaimLead}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnalysisModal
        permit={selectedPermit}
        onClose={() => selectPermit(null)}
        companyProfile={companyProfile}
        onRemoveClaimed={handleRemoveClaimedLead}
      />

      {showClaimModal && selectedLeadForClaim && (
        <LeadClaimModal
          permit={selectedLeadForClaim}
          businessName={companyProfile.name}
          userEmail={user?.email || 'user@example.com'}
          businessId={user?.uid || 'demo-business'}
          onClaimed={handleLeadClaimed}
          onClose={closeClaimModal}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        profile={companyProfile}
        onSave={setCompanyProfile}
        onOpenDiagnostics={openDiagnostics}
      />

      {isDiagnosticsOpen && <DiagnosticPanel onClose={closeDiagnostics} />}

      {/* Show acquired leads dashboard only when claim feature is enabled */}
      {planAllowsFeature('claim') && (
        <AcquiredLeadsDashboard
          businessId={user?.uid || 'demo-business'}
          isOpen={showAcquiredLeads}
          onClose={closeAcquiredLeads}
          permits={permits}
          companyProfile={companyProfile}
        />
      )}
    </div>
  );
};

// Wrap app with Firebase Auth provider
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
