/**
 * Cluster Insights Component
 * Dashboard widget showing cluster analysis and statistics
 */

import React from 'react';
import { LeadCluster, Hotspot } from '../types';
import { HotspotSummary } from '../services/geospatial/heatmapService';

interface ClusterInsightsProps {
  clusters: LeadCluster[];
  hotspots?: Hotspot[];
  hotspotSummary?: HotspotSummary;
}

export const ClusterInsights: React.FC<ClusterInsightsProps> = ({
  clusters,
  hotspots,
  hotspotSummary
}) => {
  const topClusters = clusters.slice(0, 5);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ffffff', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
        Cluster Insights
      </h2>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          label="Total Clusters"
          value={clusters.length}
          icon="🎯"
        />
        <StatCard
          label="Total Hotspots"
          value={hotspotSummary?.totalHotspots ?? hotspots?.length ?? 0}
          icon="🔥"
        />
        <StatCard
          label="Total Leads"
          value={clusters.reduce((sum, c) => sum + c.leads.length, 0)}
          icon="📊"
        />
        <StatCard
          label="Avg Score"
          value={
            clusters.length > 0
              ? (clusters.reduce((sum, c) => sum + c.averageScore, 0) / clusters.length).toFixed(1)
              : '0'
          }
          icon="⭐"
        />
      </div>

      {/* Top Clusters Table */}
      <div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
          Top Performing Clusters
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#f8f9fa', 
                borderBottom: '2px solid #dee2e6' 
              }}>
                <th style={headerStyle}>Rank</th>
                <th style={headerStyle}>Leads</th>
                <th style={headerStyle}>Avg Score</th>
                <th style={headerStyle}>Valuation</th>
                <th style={headerStyle}>Radius (mi)</th>
                <th style={headerStyle}>Density</th>
                <th style={headerStyle}>Top Category</th>
              </tr>
            </thead>
            <tbody>
              {topClusters.map((cluster, index) => (
                <tr 
                  key={cluster.id}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <td style={cellStyle}>#{index + 1}</td>
                  <td style={cellStyle}>{cluster.leads.length}</td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: getScoreColor(cluster.averageScore),
                      color: '#fff',
                      fontWeight: 600
                    }}>
                      {cluster.averageScore.toFixed(1)}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    ${(cluster.totalValuation / 1000).toFixed(0)}k
                  </td>
                  <td style={cellStyle}>{cluster.radiusMiles.toFixed(2)}</td>
                  <td style={cellStyle}>{cluster.density.toFixed(1)}</td>
                  <td style={cellStyle}>
                    {cluster.topCategories[0] ?? 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hotspot Summary if available */}
      {hotspotSummary && hotspotSummary.totalHotspots > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
            Hotspot Summary
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px'
          }}>
            <InfoCard
              label="Avg Intensity"
              value={hotspotSummary.avgIntensity.toFixed(1)}
            />
            <InfoCard
              label="Total Leads in Hotspots"
              value={hotspotSummary.totalLeads.toString()}
            />
            <InfoCard
              label="Total Hotspot Valuation"
              value={`$${(hotspotSummary.totalValuation / 1000000).toFixed(1)}M`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({
  label,
  value,
  icon
}) => (
  <div style={{ 
    padding: '16px', 
    backgroundColor: '#f8f9fa', 
    borderRadius: '6px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
      {value}
    </div>
    <div style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase' }}>
      {label}
    </div>
  </div>
);

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ 
    padding: '12px', 
    backgroundColor: '#e9ecef', 
    borderRadius: '4px' 
  }}>
    <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
      {label}
    </div>
    <div style={{ fontSize: '18px', fontWeight: 600 }}>
      {value}
    </div>
  </div>
);

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 80) return '#28a745'; // Green
  if (score >= 60) return '#ffc107'; // Yellow
  if (score >= 40) return '#fd7e14'; // Orange
  return '#dc3545'; // Red
}

const headerStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#495057'
};

const cellStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left'
};
