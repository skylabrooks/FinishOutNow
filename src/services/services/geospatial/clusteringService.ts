/**
 * Geospatial Clustering Service
 * Implements DBSCAN algorithm for lead clustering and hotspot detection
 */

import { EnrichedPermit, LeadCluster, Hotspot, GeoPoint, LeadCategory } from '../../types';

/**
 * Calculate great circle distance between two points in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
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

/**
 * Point with geospatial coordinates
 */
interface ClusterPoint {
  id: string;
  lat: number;
  lng: number;
  lead: EnrichedPermit;
  clusterId?: number;
  visited?: boolean;
}

/**
 * DBSCAN clustering algorithm
 * @param points - Array of points with coordinates
 * @param epsilonMiles - Maximum distance between points in same cluster
 * @param minPoints - Minimum points to form a cluster
 */
export function dbscan(
  points: ClusterPoint[],
  epsilonMiles: number = 1.0,
  minPoints: number = 3
): Map<number, ClusterPoint[]> {
  const clusters = new Map<number, ClusterPoint[]>();
  let currentClusterId = 0;

  // Reset visited and cluster flags
  points.forEach(p => {
    p.visited = false;
    p.clusterId = undefined;
  });

  for (const point of points) {
    if (point.visited) continue;

    point.visited = true;
    const neighbors = getNeighbors(point, points, epsilonMiles);

    if (neighbors.length < minPoints) {
      // Mark as noise (cluster -1)
      point.clusterId = -1;
      continue;
    }

    // Start a new cluster
    const clusterId = currentClusterId++;
    point.clusterId = clusterId;
    clusters.set(clusterId, [point]);

    // Expand cluster
    expandCluster(point, neighbors, clusterId, epsilonMiles, minPoints, points, clusters);
  }

  return clusters;
}

/**
 * Get neighbors within epsilon distance
 */
function getNeighbors(
  point: ClusterPoint,
  allPoints: ClusterPoint[],
  epsilonMiles: number
): ClusterPoint[] {
  const neighbors: ClusterPoint[] = [];

  for (const other of allPoints) {
    if (point.id === other.id) continue;

    const distance = calculateDistance(point.lat, point.lng, other.lat, other.lng);
    if (distance <= epsilonMiles) {
      neighbors.push(other);
    }
  }

  return neighbors;
}

/**
 * Expand cluster by adding neighbors
 */
function expandCluster(
  point: ClusterPoint,
  neighbors: ClusterPoint[],
  clusterId: number,
  epsilonMiles: number,
  minPoints: number,
  allPoints: ClusterPoint[],
  clusters: Map<number, ClusterPoint[]>
): void {
  const queue = [...neighbors];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (!current.visited) {
      current.visited = true;
      const currentNeighbors = getNeighbors(current, allPoints, epsilonMiles);

      if (currentNeighbors.length >= minPoints) {
        queue.push(...currentNeighbors);
      }
    }

    if (current.clusterId === undefined) {
      current.clusterId = clusterId;
      const clusterPoints = clusters.get(clusterId)!;
      clusterPoints.push(current);
    }
  }
}

/**
 * Calculate centroid of a cluster
 */
function calculateCentroid(points: ClusterPoint[]): GeoPoint {
  let sumLat = 0;
  let sumLng = 0;

  for (const point of points) {
    sumLat += point.lat;
    sumLng += point.lng;
  }

  return {
    type: 'Point',
    coordinates: [sumLng / points.length, sumLat / points.length]
  };
}

/**
 * Calculate cluster radius
 */
function calculateRadius(points: ClusterPoint[], centroid: GeoPoint): number {
  let maxDistance = 0;
  const [centroidLng, centroidLat] = centroid.coordinates;

  for (const point of points) {
    const distance = calculateDistance(centroidLat, centroidLng, point.lat, point.lng);
    maxDistance = Math.max(maxDistance, distance);
  }

  return maxDistance;
}

/**
 * Get top categories in cluster
 */
function getTopCategories(points: ClusterPoint[]): LeadCategory[] {
  const categoryCounts: Record<string, number> = {};

  for (const point of points) {
    const category = point.lead.aiAnalysis?.category;
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  }

  return Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat as LeadCategory);
}

/**
 * Cluster leads using DBSCAN
 */
export function clusterLeads(
  leads: EnrichedPermit[],
  epsilonMiles: number = 1.0,
  minPoints: number = 3
): LeadCluster[] {
  // Convert leads to cluster points
  const points: ClusterPoint[] = [];

  for (const lead of leads) {
    const lat = (lead as any).latitude;
    const lng = (lead as any).longitude;

    if (lat !== undefined && lng !== undefined) {
      points.push({
        id: lead.id,
        lat: Number(lat),
        lng: Number(lng),
        lead
      });
    }
  }

  if (points.length === 0) return [];

  // Run DBSCAN
  const clusterMap = dbscan(points, epsilonMiles, minPoints);

  // Convert to LeadCluster objects
  const clusters: LeadCluster[] = [];

  for (const [clusterId, clusterPoints] of clusterMap) {
    if (clusterId === -1) continue; // Skip noise

    const centroid = calculateCentroid(clusterPoints);
    const radius = calculateRadius(clusterPoints, centroid);
    const leadIds = clusterPoints.map(p => p.id);
    
    let totalScore = 0;
    let scoreCount = 0;
    let totalValuation = 0;

    for (const point of clusterPoints) {
      if (point.lead.leadScore !== undefined) {
        totalScore += point.lead.leadScore;
        scoreCount++;
      }
      totalValuation += point.lead.valuation;
    }

    const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;
    const [centroidLng, centroidLat] = centroid.coordinates;
    const density = clusterPoints.length / (Math.PI * radius * radius);

    clusters.push({
      id: `cluster_${clusterId}_${Date.now()}`,
      centroid,
      leads: leadIds,
      averageScore: avgScore,
      totalValuation,
      radiusMiles: radius,
      density,
      topCategories: getTopCategories(clusterPoints),
      createdAt: new Date().toISOString()
    });
  }

  return clusters.sort((a, b) => b.averageScore - a.averageScore);
}

/**
 * Detect hotspots using kernel density estimation
 */
export function detectHotspots(
  leads: EnrichedPermit[],
  gridSize: number = 0.5, // miles
  minIntensity: number = 30
): Hotspot[] {
  const points: ClusterPoint[] = [];

  for (const lead of leads) {
    const lat = (lead as any).latitude;
    const lng = (lead as any).longitude;

    if (lat !== undefined && lng !== undefined) {
      points.push({
        id: lead.id,
        lat: Number(lat),
        lng: Number(lng),
        lead
      });
    }
  }

  if (points.length === 0) return [];

  // Find bounding box
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }

  // Create grid
  const hotspots: Hotspot[] = [];
  const bandwidth = 1.0; // miles for kernel

  // Sample grid points
  const latStep = gridSize / 69; // roughly 1 degree lat = 69 miles
  const lngStep = gridSize / (69 * Math.cos(toRadians((minLat + maxLat) / 2)));

  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lng = minLng; lng <= maxLng; lng += lngStep) {
      let intensity = 0;
      let leadCount = 0;
      let totalValuation = 0;

      // Calculate kernel density at this point
      for (const p of points) {
        const distance = calculateDistance(lat, lng, p.lat, p.lng);
        
        if (distance <= bandwidth) {
          // Gaussian kernel
          const kernelValue = Math.exp(-0.5 * Math.pow(distance / bandwidth, 2));
          intensity += kernelValue;
          leadCount++;
          totalValuation += p.lead.valuation;
        }
      }

      // Normalize intensity to 0-100
      const normalizedIntensity = Math.min(100, (intensity / points.length) * 100);

      if (normalizedIntensity >= minIntensity && leadCount > 0) {
        hotspots.push({
          id: `hotspot_${lat.toFixed(4)}_${lng.toFixed(4)}`,
          center: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          intensity: Math.round(normalizedIntensity),
          leadCount,
          avgValuation: totalValuation / leadCount,
          radiusMiles: bandwidth
        });
      }
    }
  }

  return hotspots.sort((a, b) => b.intensity - a.intensity);
}

/**
 * Filter clusters by criteria
 */
export function filterClusters(
  clusters: LeadCluster[],
  minScore?: number,
  minValuation?: number,
  maxRadiusMiles?: number
): LeadCluster[] {
  return clusters.filter(cluster => {
    if (minScore !== undefined && cluster.averageScore < minScore) {
      return false;
    }
    if (minValuation !== undefined && cluster.totalValuation < minValuation) {
      return false;
    }
    if (maxRadiusMiles !== undefined && cluster.radiusMiles > maxRadiusMiles) {
      return false;
    }
    return true;
  });
}

/**
 * Get leads within a cluster
 */
export function getClusterLeads(
  cluster: LeadCluster,
  allLeads: EnrichedPermit[]
): EnrichedPermit[] {
  const leadMap = new Map(allLeads.map(l => [l.id, l]));
  return cluster.leads.map(id => leadMap.get(id)).filter(Boolean) as EnrichedPermit[];
}
