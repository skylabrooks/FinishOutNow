/**
 * Hotspot Map Component
 * Visualizes lead hotspots on an interactive map
 */

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { Hotspot, LeadCluster } from '../types';
import 'leaflet/dist/leaflet.css';

interface HotspotMapProps {
  hotspots: Hotspot[];
  clusters?: LeadCluster[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({
  hotspots,
  clusters,
  center = [32.7767, -96.7970], // Dallas center
  zoom = 10,
  height = '500px'
}) => {
  // Color scale for intensity
  const getColor = (intensity: number): string => {
    if (intensity >= 80) return '#ff0000'; // Red
    if (intensity >= 60) return '#ff6600'; // Orange
    if (intensity >= 40) return '#ffcc00'; // Yellow
    if (intensity >= 20) return '#66ff66'; // Light green
    return '#0066ff'; // Blue
  };

  // Calculate radius based on intensity
  const getRadius = (intensity: number, leadCount: number): number => {
    const baseRadius = 200;
    return baseRadius + (intensity / 100) * 200 + (leadCount * 10);
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render hotspots */}
      {hotspots.map(hotspot => {
        const [lng, lat] = hotspot.center.coordinates;
        const color = getColor(hotspot.intensity);
        const radius = getRadius(hotspot.intensity, hotspot.leadCount);

        return (
          <CircleMarker
            key={hotspot.id}
            center={[lat, lng]}
            radius={radius / 100} // Scale down for map
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.4,
              color: color,
              weight: 2,
              opacity: 0.6
            }}
          >
            <Popup>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Hotspot Details</h3>
                <p style={{ margin: '4px 0' }}>
                  <strong>Intensity:</strong> {hotspot.intensity}/100
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Leads:</strong> {hotspot.leadCount}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Avg Valuation:</strong> ${hotspot.avgValuation.toLocaleString()}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Radius:</strong> {hotspot.radiusMiles.toFixed(2)} miles
                </p>
              </div>
            </Popup>
            <Tooltip direction="top" opacity={0.9}>
              {hotspot.leadCount} leads (${Math.round(hotspot.avgValuation / 1000)}k avg)
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Render clusters if provided */}
      {clusters?.map(cluster => {
        const [lng, lat] = cluster.centroid.coordinates;

        return (
          <CircleMarker
            key={cluster.id}
            center={[lat, lng]}
            radius={cluster.radiusMiles * 10}
            pathOptions={{
              fillColor: '#4169e1',
              fillOpacity: 0.2,
              color: '#0000ff',
              weight: 2,
              opacity: 0.8,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Cluster Details</h3>
                <p style={{ margin: '4px 0' }}>
                  <strong>Leads:</strong> {cluster.leads.length}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Avg Score:</strong> {cluster.averageScore.toFixed(1)}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Total Valuation:</strong> ${cluster.totalValuation.toLocaleString()}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Density:</strong> {cluster.density.toFixed(2)} leads/sq mi
                </p>
                {cluster.topCategories.length > 0 && (
                  <p style={{ margin: '4px 0' }}>
                    <strong>Top Categories:</strong>
                    <br />
                    {cluster.topCategories.join(', ')}
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};
