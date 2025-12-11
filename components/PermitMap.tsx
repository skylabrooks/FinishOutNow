import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EnrichedPermit } from '../types';
import { geocodingService, Coordinates } from '../services/geocoding/GeocodingService';
import { Building, Calendar, DollarSign } from 'lucide-react';

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
    <div className="h-[600px] rounded-xl overflow-hidden border border-slate-800 relative z-0 shadow-2xl">
      <MapContainer key={`map-${markerPoints.length}`} center={DEFAULT_CENTER} zoom={10} style={{ height: '100%', width: '100%', background: '#020617' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds points={markerPoints.map(p => p.latlng)} />
        {markerPoints.map(({ permit, latlng }) => (
          <Marker 
            key={permit.id} 
            position={latlng}
            eventHandlers={{
              click: () => onSelect?.(permit),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        permit.permitType === 'Commercial' 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}>
                        {permit.permitType}
                    </span>
                    <span className="text-emerald-400 font-bold text-xs">
                        ${(permit.valuation || 0).toLocaleString()}
                    </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{permit.projectDescription}</h3>
                <p className="text-xs text-slate-500 mb-2">{permit.address}</p>
                
                <button 
                    onClick={() => onSelect?.(permit)}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 rounded transition-colors"
                >
                    View Details
                </button>
              </div>
            </Popup>
          </Marker>
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
          margin: 0.75rem;
        }
        .leaflet-popup-tip {
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}
