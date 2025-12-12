// Geocoding manager: batch geocodes and applies coordinates to permits
import { EnrichedPermit } from '../types';
import { geocodingService } from './geocoding/GeocodingService';
import { Logger } from './logger';

export async function geocodePermits(permits: EnrichedPermit[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  // Collect addresses that need geocoding
  const toGeocode: string[] = [];
  for (const permit of permits) {
    const existingCoords = geocodingService.extractCoordinates(permit, permit.address);
    if (existingCoords) continue;
    if (permit.address && !geocodingService.isCached(permit.address)) {
      toGeocode.push(permit.address);
    }
  }
  if (toGeocode.length === 0) return;
  Logger.info(`Geocoding ${toGeocode.length} addresses...`);
  await geocodingService.geocodeBatch(toGeocode, 900);
  // Apply coordinates back to permits
  for (const permit of permits) {
    const anyP = permit as any;
    const coords = geocodingService.extractCoordinates(permit, permit.address);
    if (coords && !(anyP.latitude !== undefined && anyP.longitude !== undefined)) {
      anyP.latitude = coords[0];
      anyP.longitude = coords[1];
    }
  }
}
