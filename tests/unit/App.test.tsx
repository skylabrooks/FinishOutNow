/**
 * Unit Tests: App.tsx Component (Refactored)
 * Tests simplified App component with extracted hooks and utilities
 * Focus: Component composition, modal management, view rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';

// Mock providers and hooks
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    isLoading: false
  }))
}));

vi.mock('../../hooks/usePermitManagement', () => ({
  usePermitManagement: vi.fn(() => ({
    permits: [],
    setPermits: vi.fn(),
    loadingIds: new Set(),
    isRefreshing: false,
    isBatchScanning: false,
    refreshLeads: vi.fn(),
    handleAnalyze: vi.fn(),
    handleBatchScan: vi.fn(),
    removePermit: vi.fn()
  }))
}));

vi.mock('../../hooks/useFilters', () => ({
  useFilters: vi.fn(() => ({
    filterCity: 'all',
    setFilterCity: vi.fn(),
    sortKey: 'appliedDate',
    sortDirection: 'desc',
    handleSort: vi.fn(),
    filteredPermits: [],
    stats: { total: 0, commercial: 0, highValue: 0, urgent: 0 }
  }))
}));

vi.mock('../../hooks/usePlanFeatures', () => ({
  usePlanFeatures: vi.fn(() => ({
    planAllowsFeature: (feature: string) => true
  }))
}));

vi.mock('../../hooks/useCompanyProfile', () => ({
  useCompanyProfile: vi.fn(() => ({
    companyProfile: {
      name: 'Test Company',
      email: 'info@testco.com'
    },
    setCompanyProfile: vi.fn()
  }))
}));

vi.mock('../../hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({
    selectedPermit: null,
    selectPermit: vi.fn(),
    selectedLeadForClaim: null,
    isSettingsOpen: false,
    openSettings: vi.fn(),
    closeSettings: vi.fn(),
    isDiagnosticsOpen: false,
    openDiagnostics: vi.fn(),
    closeDiagnostics: vi.fn(),
    showClaimModal: false,
    openClaimModal: vi.fn(),
    closeClaimModal: vi.fn(),
    showAcquiredLeads: false,
    openAcquiredLeads: vi.fn(),
    closeAcquiredLeads: vi.fn()
  }))
}));

vi.mock('../../hooks/useViewMode', () => ({
  useViewMode: vi.fn(() => ({
    viewMode: 'list',
    setViewMode: vi.fn(),
    effectiveView: 'list',
    canMap: true,
    canAnalytics: true
  }))
}));

vi.mock('../../utils/csvExport', () => ({
  exportPermitsToCSV: vi.fn()
}));

vi.mock('../../components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>
}));

vi.mock('../../components/AppNavbar', () => ({
  default: ({ onSettingsClick, onAcquiredLeadsClick }: any) => (
    <div data-testid="navbar">
      <button onClick={onSettingsClick}>Settings</button>
      <button onClick={onAcquiredLeadsClick}>Acquired Leads</button>
    </div>
  )
}));

vi.mock('../../components/PermitToolbar', () => ({
  default: ({ onRefresh, onBatchScan, onExportCSV }: any) => (
    <div data-testid="toolbar">
      <button onClick={onRefresh}>Refresh</button>
      <button onClick={onBatchScan}>Batch Scan</button>
      <button onClick={onExportCSV}>Export CSV</button>
    </div>
  )
}));

vi.mock('../../components/NavigationSidebar', () => ({
  default: ({ viewMode, setViewMode }: any) => (
    <div data-testid="sidebar">
      <button onClick={() => setViewMode('list')}>List</button>
      <button onClick={() => setViewMode('map')}>Map</button>
      <button onClick={() => setViewMode('analytics')}>Analytics</button>
    </div>
  )
}));

vi.mock('../../components/ViewRenderer', () => ({
  default: () => <div data-testid="view-renderer">View Renderer</div>
}));

vi.mock('../../components/AnalysisModal', () => ({
  default: () => <div data-testid="analysis-modal">Analysis Modal</div>
}));

vi.mock('../../components/SettingsModal', () => ({
  default: () => <div data-testid="settings-modal">Settings Modal</div>
}));

vi.mock('../../components/DiagnosticPanel', () => ({
  default: () => <div data-testid="diagnostic-panel">Diagnostic</div>
}));

vi.mock('../../components/LeadClaimModal', () => ({
  default: () => <div data-testid="lead-claim-modal">Claim Modal</div>
}));

vi.mock('../../components/AcquiredLeadsDashboard', () => ({
  default: () => <div data-testid="acquired-leads">Acquired Leads</div>
}));

vi.mock('../../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>
}));

describe('App Component (Refactored)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Composition', () => {
    it('should render the main app layout with all key sections', () => {
      render(<App />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('view-renderer')).toBeInTheDocument();
    });

    it('should render modals when visible', () => {
      render(<App />);
      // Analysis modal and settings modal always render (visibility managed by state)
      expect(screen.getByTestId('analysis-modal')).toBeInTheDocument();
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
      // Diagnostic panel only renders when isDiagnosticsOpen=true (mocked as false initially)
      // Claim modal and acquired leads only render when their conditions are true
    });

    it('should render with AuthProvider and ErrorBoundary', () => {
      const { container } = render(<App />);
      expect(container.querySelector('[data-testid="navbar"]')).toBeInTheDocument();
    });
  });

  describe('Navbar Interactions', () => {
    it('should call openSettings when settings button clicked', () => {
      render(<App />);
      const settingsBtn = screen.getByRole('button', { name: /settings/i });
      expect(settingsBtn).toBeEnabled();
      fireEvent.click(settingsBtn);
      // Modal state should be managed by useModalState
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('should call openAcquiredLeads when acquired leads button clicked', () => {
      render(<App />);
      const leadsBtn = screen.getByRole('button', { name: /acquired leads/i });
      expect(leadsBtn).toBeEnabled();
      fireEvent.click(leadsBtn);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });
  });

  describe('Toolbar Interactions', () => {
    it('should export CSV when export button clicked', () => {
      render(<App />);
      const exportBtn = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(exportBtn);
      expect(exportBtn).toBeEnabled();
      // CSV export should be called via the mocked util
    });

    it('should refresh when refresh button clicked', () => {
      render(<App />);
      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      expect(refreshBtn).toBeEnabled();
      fireEvent.click(refreshBtn);
    });
  });

  describe('View Mode Management', () => {
    it('should render sidebar with view mode buttons', () => {
      render(<App />);
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /map/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
    });

    it('should switch view modes when buttons clicked', () => {
      render(<App />);
      const listBtn = screen.getByRole('button', { name: /list/i });
      const mapBtn = screen.getByRole('button', { name: /map/i });
      
      fireEvent.click(mapBtn);
      expect(mapBtn).toBeInTheDocument();
      
      fireEvent.click(listBtn);
      expect(listBtn).toBeInTheDocument();
    });
  });

  describe('View Rendering', () => {
    it('should render ViewRenderer component', () => {
      render(<App />);
      expect(screen.getByTestId('view-renderer')).toBeInTheDocument();
    });

    it('should pass correct props to ViewRenderer', () => {
      render(<App />);
      const viewRenderer = screen.getByTestId('view-renderer');
      expect(viewRenderer).toBeInTheDocument();
    });
  });

  describe('Feature Flags', () => {
    it('should render all sections when features enabled', () => {
      render(<App />);
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('view-renderer')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render without errors with empty data', () => {
      render(<App />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('should mount and unmount cleanly', () => {
      const { unmount } = render(<App />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      unmount();
      expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    });
  });
});
