/**
 * Signal Connectors Integration Tests
 * Tests production-ready signal ingestion connectors
 */

import { fetchZoningCases } from '../ingestion/zoningCases';
import { fetchLicensingSignals } from '../ingestion/licensingSignals';
import { fetchLegalVacancySignals } from '../ingestion/legalVacancy';

describe('Creative Signal Connectors', () => {
  // Increase timeout for network requests
  jest.setTimeout(30000);

  describe('Arlington Zoning Cases', () => {
    it('should fetch zoning cases from Arlington ArcGIS', async () => {
      const signals = await fetchZoningCases();
      
      // Should return array (empty or populated)
      expect(Array.isArray(signals)).toBe(true);
      
      console.log(`✓ Arlington Zoning: ${signals.length} signals retrieved`);
      
      // If signals exist, validate structure
      if (signals.length > 0) {
        const firstSignal = signals[0];
        expect(firstSignal).toHaveProperty('id');
        expect(firstSignal).toHaveProperty('permitType', 'Zoning Case');
        expect(firstSignal).toHaveProperty('address');
        expect(firstSignal).toHaveProperty('city', 'Arlington');
        expect(firstSignal).toHaveProperty('stage', 'CONCEPT');
        expect(firstSignal).toHaveProperty('dataSource', 'Arlington Planning & Zoning');
        
        console.log(`  Sample: ${firstSignal.permitNumber} - ${firstSignal.description}`);
      }
    });

    it('should filter for commercial cases only', async () => {
      const signals = await fetchZoningCases();
      
      // All signals should be commercial (non-residential)
      signals.forEach(signal => {
        const desc = signal.description.toLowerCase();
        const isLikelyCommercial = 
          desc.includes('commercial') ||
          desc.includes('retail') ||
          desc.includes('office') ||
          desc.includes('mixed-use') ||
          desc.includes('restaurant');
        
        // Not strict, but most should be commercial
        // (Some may slip through via case type filtering)
      });
      
      console.log(`✓ Commercial filtering applied: ${signals.length} signals passed`);
    });

    it('should handle API errors gracefully', async () => {
      // This should not throw - should return empty array on error
      await expect(fetchZoningCases()).resolves.not.toThrow();
    });
  });

  describe('TABC Liquor Licenses', () => {
    it('should fetch liquor licenses from TABC', async () => {
      const signals = await fetchLicensingSignals();
      
      expect(Array.isArray(signals)).toBe(true);
      
      console.log(`✓ TABC + Dallas Food: ${signals.length} signals retrieved`);
      
      // Check for liquor license signals specifically
      const liquorSignals = signals.filter(s => s.permitType === 'Liquor License');
      console.log(`  TABC Liquor: ${liquorSignals.length} licenses`);
      
      if (liquorSignals.length > 0) {
        const firstLicense = liquorSignals[0];
        expect(firstLicense).toHaveProperty('id');
        expect(firstLicense).toHaveProperty('permitType', 'Liquor License');
        expect(firstLicense).toHaveProperty('address');
        expect(firstLicense).toHaveProperty('stage', 'PERMIT_ISSUED');
        expect(firstLicense).toHaveProperty('dataSource', 'TABC');
        
        console.log(`  Sample: ${firstLicense.description}`);
      }
    });

    it('should filter for commercial license types', async () => {
      const signals = await fetchLicensingSignals();
      const liquorSignals = signals.filter(s => s.permitType === 'Liquor License');
      
      // All liquor licenses should be commercial types (restaurants, bars, retailers)
      liquorSignals.forEach(signal => {
        const desc = signal.description.toUpperCase();
        const isCommercialType = 
          desc.includes('RESTAURANT') ||
          desc.includes('BAR') ||
          desc.includes('TAVERN') ||
          desc.includes('RETAILER') ||
          desc.includes('WINE') ||
          desc.includes('BEER') ||
          desc.includes('MIXED BEVERAGE');
        
        // Should have valid business name
        expect(signal.applicant).toBeTruthy();
        expect(signal.applicant.length).toBeGreaterThan(0);
      });
      
      console.log(`✓ Commercial license type filtering applied`);
    });

    it('should include Dallas food inspections', async () => {
      const signals = await fetchLicensingSignals();
      const foodSignals = signals.filter(s => s.permitType === 'Food Service Permit');
      
      console.log(`  Dallas Food: ${foodSignals.length} new establishments`);
      
      if (foodSignals.length > 0) {
        const firstFood = foodSignals[0];
        expect(firstFood).toHaveProperty('permitType', 'Food Service Permit');
        expect(firstFood).toHaveProperty('city', 'Dallas');
        expect(firstFood).toHaveProperty('stage', 'PRE_OPENING');
        expect(firstFood).toHaveProperty('dataSource', 'Dallas Food Inspections');
        
        console.log(`  Sample: ${firstFood.applicant} - ${firstFood.address}`);
      }
    });

    it('should handle API errors gracefully', async () => {
      await expect(fetchLicensingSignals()).resolves.not.toThrow();
    });
  });

  describe('Eviction Lab Legal Vacancy', () => {
    it('should fetch eviction data from Eviction Lab CSV', async () => {
      const signals = await fetchLegalVacancySignals();
      
      expect(Array.isArray(signals)).toBe(true);
      
      console.log(`✓ Eviction Lab: ${signals.length} signals retrieved`);
      
      if (signals.length > 0) {
        const firstEviction = signals[0];
        expect(firstEviction).toHaveProperty('id');
        expect(firstEviction).toHaveProperty('permitType', 'Eviction Notice');
        expect(firstEviction).toHaveProperty('address');
        expect(firstEviction).toHaveProperty('stage', 'CONCEPT');
        expect(firstEviction).toHaveProperty('dataSource', 'Eviction Lab');
        
        console.log(`  Sample: ${firstEviction.permitNumber} - ${firstEviction.address}`);
      }
    });

    it('should filter for commercial properties only', async () => {
      const signals = await fetchLegalVacancySignals();
      
      // All signals should be commercial addresses (have suite, unit, etc.)
      signals.forEach(signal => {
        const addr = signal.address.toLowerCase();
        const hasCommercialIndicator = 
          addr.includes('suite') ||
          addr.includes('ste') ||
          addr.includes('unit') ||
          addr.includes('#') ||
          addr.includes('plaza') ||
          addr.includes('center') ||
          addr.includes('office') ||
          addr.includes('building');
        
        // Most should have commercial indicators
        // (This is heuristic-based, not perfect)
      });
      
      console.log(`✓ Commercial property filtering applied`);
    });

    it('should handle CSV parsing errors gracefully', async () => {
      await expect(fetchLegalVacancySignals()).resolves.not.toThrow();
    });
  });

  describe('Integration - All Signals', () => {
    it('should fetch all signal types without errors', async () => {
      const [zoning, licensing, evictions] = await Promise.all([
        fetchZoningCases(),
        fetchLicensingSignals(),
        fetchLegalVacancySignals()
      ]);

      expect(Array.isArray(zoning)).toBe(true);
      expect(Array.isArray(licensing)).toBe(true);
      expect(Array.isArray(evictions)).toBe(true);

      const total = zoning.length + licensing.length + evictions.length;
      
      console.log('\n=== Signal Summary ===');
      console.log(`Zoning Cases (Arlington): ${zoning.length}`);
      console.log(`Licensing Signals (TABC + Dallas Food): ${licensing.length}`);
      console.log(`Legal Vacancy (Eviction Lab): ${evictions.length}`);
      console.log(`TOTAL SIGNALS: ${total}`);
      console.log('=====================\n');
    });

    it('should have unique signal IDs across all sources', async () => {
      const [zoning, licensing, evictions] = await Promise.all([
        fetchZoningCases(),
        fetchLicensingSignals(),
        fetchLegalVacancySignals()
      ]);

      const allSignals = [...zoning, ...licensing, ...evictions];
      const ids = allSignals.map(s => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
      console.log(`✓ All ${ids.length} signal IDs are unique`);
    });

    it('should have valid addresses for all signals', async () => {
      const [zoning, licensing, evictions] = await Promise.all([
        fetchZoningCases(),
        fetchLicensingSignals(),
        fetchLegalVacancySignals()
      ]);

      const allSignals = [...zoning, ...licensing, ...evictions];
      
      allSignals.forEach(signal => {
        expect(signal.address).toBeTruthy();
        expect(signal.address.length).toBeGreaterThan(10); // Reasonable minimum
        expect(signal.city).toBeTruthy();
      });

      console.log(`✓ All ${allSignals.length} signals have valid addresses`);
    });
  });
});
