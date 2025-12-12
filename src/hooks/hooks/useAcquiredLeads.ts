import { useState, useEffect } from 'react';
import { getClaimedLeadsForBusiness } from '../services/firebaseLeads';
import { EnrichedPermit, LeadClaim } from '../types';

export interface ClaimedLeadWithPermit extends LeadClaim {
  permit?: EnrichedPermit;
  status: 'active' | 'contacted' | 'qualified' | 'won' | 'lost';
}

export interface LeadStats {
  total: number;
  active: number;
  contacted: number;
  qualified: number;
  won: number;
  totalValue: number;
}

export const useAcquiredLeads = (
  businessId: string,
  permits: EnrichedPermit[],
  isOpen: boolean
) => {
  const [claimedLeads, setClaimedLeads] = useState<ClaimedLeadWithPermit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'contacted' | 'qualified' | 'won' | 'lost'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'urgency'>('date');

  useEffect(() => {
    if (isOpen) {
      loadClaimedLeads();
    }
  }, [isOpen, businessId]);

  const loadClaimedLeads = async () => {
    setLoading(true);
    try {
      const claims = await getClaimedLeadsForBusiness(businessId);

      // Merge with permit data
      const merged: ClaimedLeadWithPermit[] = claims.map((claim) => {
        const permit = permits.find((p) => p.id === claim.leadId);
        return {
          ...claim,
          permit,
          status: 'active' as const, // Default status - can be enhanced with Firestore tracking
        };
      });

      setClaimedLeads(merged);
    } catch (error) {
      console.error('Failed to load claimed leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = claimedLeads.filter((lead) => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime();
    } else if (sortBy === 'value') {
      const valA = a.permit?.aiAnalysis?.estimatedValue || 0;
      const valB = b.permit?.aiAnalysis?.estimatedValue || 0;
      return valB - valA;
    } else if (sortBy === 'urgency') {
      const urgencyMap = { High: 3, Medium: 2, Low: 1 };
      const urgA = urgencyMap[a.permit?.aiAnalysis?.urgency as keyof typeof urgencyMap] || 0;
      const urgB = urgencyMap[b.permit?.aiAnalysis?.urgency as keyof typeof urgencyMap] || 0;
      return urgB - urgA;
    }
    return 0;
  });

  const stats: LeadStats = {
    total: claimedLeads.length,
    active: claimedLeads.filter((l) => l.status === 'active').length,
    contacted: claimedLeads.filter((l) => l.status === 'contacted').length,
    qualified: claimedLeads.filter((l) => l.status === 'qualified').length,
    won: claimedLeads.filter((l) => l.status === 'won').length,
    totalValue: claimedLeads.reduce((sum, l) => sum + (l.permit?.aiAnalysis?.estimatedValue || 0), 0),
  };

  return {
    claimedLeads,
    loading,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    filteredLeads,
    sortedLeads,
    stats,
    loadClaimedLeads,
  };
};
