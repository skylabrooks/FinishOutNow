import { useState, useEffect } from 'react';
import { EnrichedPermit, CompanyProfile } from '../types';
import { leadManager } from '../services/leadManager';
import { analyzePermit } from '../services/geminiService';

const STORAGE_KEY_PERMITS = 'finishOutNow_permits_v1';

export function usePermitManagement(companyProfile: CompanyProfile) {
  const [permits, setPermits] = useState<EnrichedPermit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERMITS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load permits from storage", e);
      return [];
    }
  });

  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBatchScanning, setIsBatchScanning] = useState(false);

  // Persist permits to localStorage
  useEffect(() => {
    if (permits.length > 0) {
      localStorage.setItem(STORAGE_KEY_PERMITS, JSON.stringify(permits));
    }
  }, [permits]);

  // Initial data fetch
  useEffect(() => {
    if (permits.length === 0) {
      refreshLeads();
    }
  }, []);

  const refreshLeads = async () => {
    setIsRefreshing(true);
    try {
      // Preserve existing analysis to not lose money/work
      const analyzedMap = new Map(
        permits.filter(p => p.aiAnalysis).map(p => [p.id, p])
      );

      const freshLeads = await leadManager.fetchAllLeads();

      // Merge: Use fresh data but keep analysis if ID matches
      const merged = freshLeads.map(newLead => {
        const existing = analyzedMap.get(newLead.id);
        if (existing) {
          return { 
            ...newLead, 
            aiAnalysis: (existing as any).aiAnalysis, 
            enrichmentData: (existing as any).enrichmentData 
          };
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

  const handleAnalyze = async (id: string, selectedPermit: EnrichedPermit | null, setSelectedPermit: (permit: EnrichedPermit | null) => void) => {
    const permit = permits.find(p => p.id === id);
    if (!permit || loadingIds.has(id)) return;

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

      // 2. Run Entity Enrichment
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

  const handleBatchScan = async (filteredPermits: EnrichedPermit[], selectedPermit: EnrichedPermit | null, setSelectedPermit: (permit: EnrichedPermit | null) => void) => {
    setIsBatchScanning(true);
    const unanalyzed = filteredPermits.filter(p => !p.aiAnalysis);

    for (const permit of unanalyzed) {
      // Scroll into view if possible
      const element = document.getElementById(`permit-card-${permit.id}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      await handleAnalyze(permit.id, selectedPermit, setSelectedPermit);

      // Artificial delay to respect API Rate Limits
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    setIsBatchScanning(false);
  };

  const removePermit = (id: string) => {
    setPermits(permits.filter(p => p.id !== id));
  };

  return {
    permits,
    setPermits,
    loadingIds,
    isRefreshing,
    isBatchScanning,
    refreshLeads,
    handleAnalyze,
    handleBatchScan,
    removePermit,
  };
}
