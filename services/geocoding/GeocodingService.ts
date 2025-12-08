/**
 * Shared Geocoding Service
 * 
 * Provides centralized geocoding functionality with localStorage caching
 * to avoid repeated API calls. Used by both leadManager and PermitMap.
 */

const GEO_CACHE_KEY = 'finishoutnow_geocache_v1';

export type Coordinates = [number, number]; // [latitude, longitude]

export class GeocodingService {
  private cache: Record<string, Coordinates> = {};

  constructor() {
    this.loadCache();
  }

  /**
   * Load geocoding cache from localStorage
   */
  private loadCache(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const saved = window.localStorage.getItem(GEO_CACHE_KEY);
      this.cache = saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load geocoding cache', error);
      this.cache = {};
    }
  }

  /**
   * Save geocoding cache to localStorage
   */
  private saveCache(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save geocoding cache', error);
    }
  }

  /**
   * Get coordinates from cache
   */
  getCached(address: string): Coordinates | null {
    return this.cache[address] || null;
  }

  /**
   * Check if address is in cache
   */
  isCached(address: string): boolean {
    return address in this.cache;
  }

  /**
   * Geocode a single address using Nominatim API
   */
  async geocodeAddress(address: string): Promise<Coordinates | null> {
    // Check cache first
    if (this.isCached(address)) {
      return this.getCached(address);
    }

    try {
      const query = encodeURIComponent(`${address} Dallas-Fort Worth, TX`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
      
      const response = await fetch(url, { 
        headers: { 'Accept-Language': 'en-US' } 
      });

      if (!response.ok) return null;

      const json = await response.json();
      if (!Array.isArray(json) || json.length === 0) return null;

      const lat = parseFloat(json[0].lat);
      const lon = parseFloat(json[0].lon);

      if (isNaN(lat) || isNaN(lon)) return null;

      const coords: Coordinates = [lat, lon];
      
      // Cache the result
      this.cache[address] = coords;
      this.saveCache();

      return coords;
    } catch (error) {
      console.warn(`Geocoding failed for address: ${address}`, error);
      return null;
    }
  }

  /**
   * Geocode multiple addresses sequentially with rate limiting.
   * Returns a map of address -> coordinates.
   */
  async geocodeBatch(
    addresses: string[], 
    delayMs: number = 900
  ): Promise<Map<string, Coordinates>> {
    const results = new Map<string, Coordinates>();

    for (const address of addresses) {
      // Skip if already in cache
      if (this.isCached(address)) {
        const cached = this.getCached(address);
        if (cached) results.set(address, cached);
        continue;
      }

      // Rate limiting delay
      if (results.size > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      try {
        const coords = await this.geocodeAddress(address);
        if (coords) {
          results.set(address, coords);
        }
      } catch (error) {
        console.warn(`Batch geocoding failed for ${address}`, error);
      }
    }

    return results;
  }

  /**
   * Extract coordinates from a permit object that may have them in different formats.
   * Returns [lat, lng] or null if not found.
   */
  extractCoordinates(permitData: any, address?: string): Coordinates | null {
    // Check for latitude/longitude properties
    if (permitData.latitude !== undefined && permitData.longitude !== undefined) {
      return [Number(permitData.latitude), Number(permitData.longitude)];
    }

    // Check for lat/lng properties
    if (permitData.lat !== undefined && permitData.lng !== undefined) {
      return [Number(permitData.lat), Number(permitData.lng)];
    }

    // Check cache if address is provided
    if (address && this.isCached(address)) {
      return this.getCached(address);
    }

    return null;
  }

  /**
   * Clear the geocoding cache
   */
  clearCache(): void {
    this.cache = {};
    this.saveCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: Object.keys(this.cache).length,
      addresses: Object.keys(this.cache)
    };
  }
}

// Singleton instance
export const geocodingService = new GeocodingService();
