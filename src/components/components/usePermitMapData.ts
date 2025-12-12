import { useEffect, useMemo } from 'react';
import { geocodingService, Coordinates } from '../services/geocoding/GeocodingService';
import type { EnrichedPermit } from '../types';

const DEFAULT_CENTER: Coordinates = [32.7767, -96.7970];

export function usePermitMapData(permits: EnrichedPermit[]) {
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
        await new Promise(r => setTimeout(r, 1000));
      }
    })();
    return () => { cancelled = true; };
  }, [toGeocode]);

  // Build list of points from permits using the shared service
  const markerPoints = useMemo(() => permits.map(p => {
    const coords = geocodingService.extractCoordinates(p, p.address);
    return {
      permit: p,
      latlng: coords || DEFAULT_CENTER
    };
  }).filter(pt => !!pt.latlng), [permits]);

  return markerPoints;
}
