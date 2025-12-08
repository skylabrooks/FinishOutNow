import React, { useState, useEffect } from 'react';
import { getClaimedLeadsForBusiness } from '../services/firebaseLeads';
import { EnrichedPermit, LeadClaim } from '../types';
import { 
  Archive, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  X,
  MapPin,
  User
} from 'lucide-react';

interface AcquiredLeadsDashboardProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
  permits: EnrichedPermit[];
  companyProfile: any;
}

interface ClaimedLeadWithPermit extends LeadClaim {
  permit?: EnrichedPermit;
  status: 'active' | 'contacted' | 'qualified' | 'won' | 'lost';
}

export default function AcquiredLeadsDashboard({
  businessId,
  isOpen,
  onClose,
  permits,
  companyProfile,
}: AcquiredLeadsDashboardProps) {
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
      const merged: ClaimedLeadWithPermit[] = claims.map(claim => {
        const permit = permits.find(p => p.id === claim.leadId);
        return {
          ...claim,
          permit,
          status: 'active' as const // Default status - can be enhanced with Firestore tracking
        };
      });

      setClaimedLeads(merged);
    } catch (error) {
      console.error('Failed to load claimed leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = claimedLeads.filter(lead => {
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

  // Calculate stats
  const stats = {
    total: claimedLeads.length,
    active: claimedLeads.filter(l => l.status === 'active').length,
    contacted: claimedLeads.filter(l => l.status === 'contacted').length,
    qualified: claimedLeads.filter(l => l.status === 'qualified').length,
    won: claimedLeads.filter(l => l.status === 'won').length,
    totalValue: claimedLeads.reduce((sum, l) => sum + (l.permit?.aiAnalysis?.estimatedValue || 0), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'contacted':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'qualified':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'won':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'lost':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'text-red-400';
      case 'Medium':
        return 'text-yellow-400';
      case 'Low':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  const exportCSV = () => {
    const headers = [
      'Lead ID',
      'Address',
      'City',
      'Est. Value',
      'Confidence',
      'Urgency',
      'Claimed Date',
      'Status',
      'Project Type'
    ];

    const rows = sortedLeads.map(lead => [
      lead.leadId,
      lead.permit?.address || 'N/A',
      lead.permit?.city || 'N/A',
      `$${(lead.permit?.aiAnalysis?.estimatedValue || 0).toLocaleString()}`,
      `${lead.permit?.aiAnalysis?.confidenceScore || 0}%`,
      lead.permit?.aiAnalysis?.urgency || 'N/A',
      new Date(lead.claimedAt).toLocaleDateString(),
      lead.status,
      lead.permit?.permitType || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `acquired_leads_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-start justify-end overflow-hidden">
      {/* Sliding Panel */}
      <div className="bg-slate-900 border-l border-slate-700 h-full w-full max-w-4xl flex flex-col overflow-hidden animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-900 sticky top-0 z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Archive size={24} />
                Acquired Leads
              </h2>
              <p className="text-sm text-slate-400 mt-1">{companyProfile.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-400 hover:text-white" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 uppercase">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
              <p className="text-xs text-blue-400 uppercase">Active</p>
              <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
            </div>
            <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
              <p className="text-xs text-purple-400 uppercase">Qualified</p>
              <p className="text-2xl font-bold text-purple-400">{stats.qualified}</p>
            </div>
            <div className="bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30">
              <p className="text-xs text-emerald-400 uppercase">Won</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.won}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 uppercase">Total Value</p>
              <p className="text-lg font-bold text-white">${(stats.totalValue / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="border-b border-slate-700 bg-slate-900/50 px-6 py-4 flex items-center gap-3 flex-wrap">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'active', 'contacted', 'qualified', 'won', 'lost'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded text-xs font-medium uppercase transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="ml-auto flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-medium"
            >
              <option value="date">Sort: Newest</option>
              <option value="value">Sort: Highest Value</option>
              <option value="urgency">Sort: Highest Urgency</option>
            </select>

            <button
              onClick={exportCSV}
              disabled={sortedLeads.length === 0}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Download size={14} />
              Export
            </button>

            <button
              onClick={loadClaimedLeads}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-slate-400">Loading acquired leads...</p>
              </div>
            </div>
          ) : sortedLeads.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle size={32} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {claimedLeads.length === 0
                    ? 'No acquired leads yet. Claim leads from the dashboard!'
                    : 'No leads match this filter.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {sortedLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-sm">
                          {lead.permit?.address || `Lead ${lead.leadId}`}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(lead.status)}`}>
                          {lead.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={12} />
                        {lead.permit?.city}, {lead.permit?.permitType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        ${(lead.permit?.aiAnalysis?.estimatedValue || 0).toLocaleString()}
                      </p>
                      <p className={`text-xs font-medium ${getUrgencyColor(lead.permit?.aiAnalysis?.urgency || '')}`}>
                        {lead.permit?.aiAnalysis?.urgency || 'N/A'} Priority
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-3 pb-3 border-b border-slate-700">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Confidence</p>
                      <p className="text-sm font-bold text-blue-400">{lead.permit?.aiAnalysis?.confidenceScore || 0}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Applied</p>
                      <p className="text-sm font-medium text-slate-300">
                        {new Date(lead.permit?.appliedDate || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Claimed</p>
                      <p className="text-sm font-medium text-slate-300">
                        {new Date(lead.claimedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Expires</p>
                      <p className="text-sm font-medium text-slate-300">
                        {new Date(lead.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors">
                      <Mail size={14} />
                      Email
                    </button>
                    <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors">
                      <Phone size={14} />
                      Call
                    </button>
                    <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors">
                      <Calendar size={14} />
                      Schedule
                    </button>
                    <button className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded border border-red-600/50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
