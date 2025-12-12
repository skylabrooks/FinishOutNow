import { useState, useMemo } from 'react';
import { EnrichedPermit } from '../types';

type SortKey = 'appliedDate' | 'valuation' | 'city' | 'confidence';
type SortDirection = 'asc' | 'desc';

export function useFilters(permits: EnrichedPermit[]) {
  const [filterCity, setFilterCity] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('appliedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const filteredPermits = useMemo(() => {
    return permits
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
  }, [permits, filterCity, sortKey, sortDirection]);

  const stats = useMemo(() => {
    return {
      totalValue: permits.reduce((acc, p) => acc + (p.aiAnalysis?.estimatedValue || 0), 0),
      activeLeads: permits.filter(p => p.aiAnalysis).length,
      highPriority: permits.filter(p => p.aiAnalysis?.urgency === 'High').length,
      avgConfidence: Math.round(
        permits.reduce((acc, p) => acc + (p.aiAnalysis?.confidenceScore || 0), 0) / 
        (permits.filter(p => p.aiAnalysis).length || 1)
      )
    };
  }, [permits]);

  return {
    filterCity,
    setFilterCity,
    sortKey,
    sortDirection,
    handleSort,
    filteredPermits,
    stats,
  };
}
