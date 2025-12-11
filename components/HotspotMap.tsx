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
    if (intensity >= 80) return '#ef4444'; // Red-500
    if (intensity >= 60) return '#f97316'; // Orange-500
    if (intensity >= 40) return '#eab308'; // Yellow-500
    if (intensity >= 20) return '#10b981'; // Emerald-500
    return '#3b82f6'; // Blue-500
  };

  // Calculate radius based on intensity
  const getRadius = (intensity: number, leadCount: number): number => {
    const baseRadius = 200;
    return baseRadius + (intensity / 100) * 200 + (leadCount * 10);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%', background: '#020617' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Render Hotspots */}
        {hotspots.map((hotspot) => (
          <CircleMarker
            key={hotspot.id}
            center={hotspot.center}
            radius={20} // Visual radius in pixels
            pathOptions={{
              color: getColor(hotspot.intensity),
              fillColor: getColor(hotspot.intensity),
              fillOpacity: 0.4,
              weight: 2
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Hotspot Zone</h3>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Intensity:</strong> {hotspot.intensity.toFixed(1)}</p>
                  <p><strong>Leads:</strong> {hotspot.leadCount}</p>
                  <p><strong>Value:</strong> ${(hotspot.totalValuation / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="font-bold">{hotspot.leadCount} Leads</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Render Clusters if provided */}
        {clusters?.map((cluster) => (
          <CircleMarker
            key={cluster.id}
            center={cluster.center}
            radius={10}
            pathOptions={{
              color: '#a855f7', // Purple-500
              fillColor: '#a855f7',
              fillOpacity: 0.6,
              weight: 1
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Cluster</h3>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Leads:</strong> {cluster.leads.length}</p>
                  <p><strong>Avg Score:</strong> {cluster.averageScore.toFixed(1)}</p>
                  <p><strong>Density:</strong> {cluster.density.toFixed(1)}</p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #ffffff;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 0;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0.5rem;
        }
        .leaflet-popup-tip {
          background: #ffffff;
        }
      `}</style>
    </div>
  );
};
