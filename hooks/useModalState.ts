import { useState } from 'react';
import type { EnrichedPermit } from '../types';

/**
 * Custom hook to manage modal and dialog visibility states
 * Centralizes modal state management for cleaner AppContent
 */
export const useModalState = () => {
  const [selectedPermit, setSelectedPermit] = useState<EnrichedPermit | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedLeadForClaim, setSelectedLeadForClaim] = useState<EnrichedPermit | null>(null);
  const [showAcquiredLeads, setShowAcquiredLeads] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const openDiagnostics = () => {
    closeSettings();
    setIsDiagnosticsOpen(true);
  };
  const closeDiagnostics = () => setIsDiagnosticsOpen(false);

  const openAcquiredLeads = () => setShowAcquiredLeads(true);
  const closeAcquiredLeads = () => setShowAcquiredLeads(false);

  const selectPermit = (permit: EnrichedPermit | null) => setSelectedPermit(permit);

  const openClaimModal = (permit: EnrichedPermit) => {
    setSelectedLeadForClaim(permit);
    setShowClaimModal(true);
  };

  const closeClaimModal = () => {
    setShowClaimModal(false);
    setSelectedLeadForClaim(null);
  };

  return {
    // Selected permits
    selectedPermit,
    selectPermit,
    selectedLeadForClaim,

    // Modal visibility
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
  };
};
