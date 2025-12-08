import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EnrichedPermit } from '../types';
import { geocodingService, Coordinates } from '../services/geocoding/GeocodingService';

// Fix default icon path for Vite builds
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

interface Props {
  permits: EnrichedPermit[];
  onSelect?: (permit: EnrichedPermit) => void;
}

const DEFAULT_CENTER: Coordinates = [32.7767, -96.7970]; // Dallas

function FitBounds({ points }: { points: Coordinates[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!points || points.length === 0) {
      map.setView(DEFAULT_CENTER, 10);
      return;
    }
    const latLngs = points.map(p => L.latLng(p[0], p[1]));
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds.pad(0.25));
  }, [map, points]);

  return null;
}

// Basic color mapping for categories
const categoryColor = (category?: string) => {
  switch (category) {
    case 'Security & Access Control':
      return '#ef4444'; // red
    case 'IT & Low Voltage':
      return '#06b6d4'; // cyan
    case 'Signage & Branding':
      return '#f59e0b'; // amber
    default:
      return '#60a5fa'; // blue
  }
};

export default function PermitMap({ permits, onSelect }: Props) {
  // Extract addresses that need geocoding
  const toGeocode = useMemo(() => {
    return permits
      .filter(p => {
        const existingCoords = geocodingService.extractCoordinates(p, p.address);
        return !existingCoords && p.address && !geocodingService.isCached(p.address);
      })
      .map(p => p.address);
  }, [permits]);

  // Geocode missing addresses with the shared service
  useEffect(() => {
    if (toGeocode.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const addr of toGeocode) {
        if (cancelled) break;
        await geocodingService.geocodeAddress(addr);
        // Throttle to respect rate limits
        await new Promise(r => setTimeout(r, 1000));
      }
    })();

    return () => { cancelled = true; };
  }, [toGeocode]);

  // Build list of points from permits using the shared service
  const points: { permit: EnrichedPermit; latlng: Coordinates }[] = permits.map(p => {
    const coords = geocodingService.extractCoordinates(p, p.address);
    return {
      permit: p,
      latlng: coords || DEFAULT_CENTER
    };
  });

  const markerPoints = points.filter(pt => !!pt.latlng);

  return (
    <div className="h-[600px] rounded-xl overflow-hidden border border-slate-800 relative z-0">
      <MapContainer key={`map-${markerPoints.length}`} center={DEFAULT_CENTER} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markerPoints.map(({ permit, latlng }) => (
          <CircleMarker
            key={permit.id}
            center={latlng}
            radius={8}
            pathOptions={{ color: categoryColor(permit.aiAnalysis?.category), fillColor: categoryColor(permit.aiAnalysis?.category), fillOpacity: 0.9, weight: 1 }}
            eventHandlers={{
              click: () => onSelect && onSelect(permit)
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold mb-1">{permit.description}</div>
                <div className="text-xs text-slate-600">{permit.address}</div>
                <div className="mt-1 text-xs">{permit.city} • {permit.appliedDate}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <FitBounds points={markerPoints.map(m => m.latlng)} />
      </MapContainer>
    </div>
  );
}
