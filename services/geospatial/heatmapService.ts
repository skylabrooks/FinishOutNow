/**
 * Heatmap Data Service
 * Generates heatmap data for visualization
 */

import { EnrichedPermit, Hotspot } from '../../types';
import { detectHotspots } from './clusteringService';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  valuation: number;
}

/**
 * Convert leads to heatmap points
 */
export function leadsToHeatmapPoints(leads: EnrichedPermit[]): HeatmapPoint[] {
  const points: HeatmapPoint[] = [];

  for (const lead of leads) {
    const lat = (lead as any).latitude;
    const lng = (lead as any).longitude;

    if (lat !== undefined && lng !== undefined) {
      // Calculate intensity based on lead score and valuation
      let intensity = 0.5; // Base intensity

      if (lead.leadScore !== undefined) {
        intensity = lead.leadScore / 100;
      }

      // Boost intensity for high valuation
      if (lead.valuation > 500000) {
        intensity = Math.min(1.0, intensity * 1.5);
      } else if (lead.valuation > 100000) {
        intensity = Math.min(1.0, intensity * 1.2);
      }

      points.push({
        lat: Number(lat),
        lng: Number(lng),
        intensity,
        valuation: lead.valuation
      });
    }
  }

  return points;
}

/**
 * Get heatmap configuration for Leaflet
 */
export interface HeatmapConfig {
  radius: number;
  blur: number;
  maxZoom: number;
  max: number;
  gradient: Record<number, string>;
}

export function getHeatmapConfig(): HeatmapConfig {
  return {
    radius: 25,
    blur: 15,
    maxZoom: 17,
    max: 1.0,
    gradient: {
      0.0: 'blue',
      0.2: 'cyan',
      0.4: 'lime',
      0.6: 'yellow',
      0.8: 'orange',
      1.0: 'red'
    }
  };
}

/**
 * Generate hotspot summary statistics
 */
export interface HotspotSummary {
  totalHotspots: number;
  topHotspots: Hotspot[];
  avgIntensity: number;
  totalLeads: number;
  totalValuation: number;
}

export function generateHotspotSummary(
  hotspots: Hotspot[],
  topN: number = 5
): HotspotSummary {
  if (hotspots.length === 0) {
    return {
      totalHotspots: 0,
      topHotspots: [],
      avgIntensity: 0,
      totalLeads: 0,
      totalValuation: 0
    };
  }

  const totalIntensity = hotspots.reduce((sum, h) => sum + h.intensity, 0);
  const totalLeads = hotspots.reduce((sum, h) => sum + h.leadCount, 0);
  const totalValuation = hotspots.reduce((sum, h) => sum + (h.avgValuation * h.leadCount), 0);

  return {
    totalHotspots: hotspots.length,
    topHotspots: hotspots.slice(0, topN),
    avgIntensity: totalIntensity / hotspots.length,
    totalLeads,
    totalValuation
  };
}

/**
 * Filter hotspots by geographic area
 */
export function filterHotspotsByArea(
  hotspots: Hotspot[],
  centerLat: number,
  centerLng: number,
  radiusMiles: number
): Hotspot[] {
  return hotspots.filter(hotspot => {
    const [lng, lat] = hotspot.center.coordinates;
    const distance = calculateDistance(centerLat, centerLng, lat, lng);
    return distance <= radiusMiles;
  });
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
