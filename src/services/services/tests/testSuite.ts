
import { leadManager } from '../leadManager';
import { normalizeDate, normalizeStatus, normalizeCity, normalizePermitType } from '../normalization';
import { fetchDallasPermits } from '../ingestion/dallas';
import { fetchFortWorthPermits } from '../ingestion/fortWorth';
import { fetchArlingtonPermits } from '../ingestion/arlington';
import { fetchPlanoPermits } from '../ingestion/plano';
import { fetchIrvingPermits } from '../ingestion/irving';
import { searchFranchiseTaxpayer } from '../enrichment/comptroller';
import { analyzePermit } from '../geminiService';
import { Permit, LeadCategory } from '../../types';

export interface TestResult {
  id: string;
  name: string;
  category: 'Unit' | 'Integration' | 'AI' | 'System';
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export const SYSTEM_TESTS = [
  // --- UNIT TESTS: Normalization ---
  {
    id: 'unit-norm-city',
    name: 'Normalization: City Names',
    category: 'Unit',
    run: async () => {
      const cases = [
        { input: 'dallas ', expected: 'Dallas' },
        { input: 'Ft. Worth', expected: 'Fort Worth' },
        { input: 'ARLINGTON', expected: 'Arlington' },
      ];
      cases.forEach(c => {
        const res = normalizeCity(c.input);
        if (res !== c.expected) throw new Error(`Expected ${c.expected} for input "${c.input}", got ${res}`);
      });
      return "City names normalized correctly.";
    }
  },
  {
    id: 'unit-norm-date',
    name: 'Normalization: Dates',
    category: 'Unit',
    run: async () => {
      const today = new Date().toISOString().split('T')[0];
      if (normalizeDate(undefined) !== today) throw new Error("Undefined date did not default to today");
      if (normalizeDate('2023-01-01T00:00:00') !== '2023-01-01') throw new Error("ISO string parse failed");
      return "Dates parsed correctly.";
    }
  },
  {
    id: 'unit-norm-type',
    name: 'Normalization: Permit Types',
    category: 'Unit',
    run: async () => {
      if (normalizePermitType('CO', 'New Occupancy') !== 'Certificate of Occupancy') throw new Error("Failed to detect CO");
      if (normalizePermitType('Building', 'New Construction of Shell') !== 'New Construction') throw new Error("Failed to detect New Construction");
      return "Permit types mapped correctly.";
    }
  },

  // --- INTEGRATION TESTS: Ingestion ---
  {
    id: 'int-dallas-api',
    name: 'Ingestion: Dallas API Connectivity',
    category: 'Integration',
    run: async () => {
      const results = await fetchDallasPermits();
      if (!Array.isArray(results)) throw new Error("Did not return an array");
      if (results.length > 0) {
        if (results[0].city !== 'Dallas') throw new Error("Dallas connector returned wrong city");
        if (results[0].dataSource !== 'Dallas Open Data') throw new Error("Missing Data Source Label");
      }
      return `Fetched ${results.length} permits from Dallas Socrata API.`;
    }
  },
  {
    id: 'int-fw-api',
    name: 'Ingestion: Fort Worth API Connectivity',
    category: 'Integration',
    run: async () => {
      const results = await fetchFortWorthPermits();
      if (!Array.isArray(results)) throw new Error("Did not return an array");
       if (results.length > 0) {
        if (results[0].city !== 'Fort Worth') throw new Error("FW connector returned wrong city");
      }
      return `Fetched ${results.length} permits from Fort Worth API.`;
    }
  },
  {
    id: 'int-arlington-api',
    name: 'Ingestion: Arlington Connector',
    category: 'Integration',
    run: async () => {
      const results = await fetchArlingtonPermits();
      if (!Array.isArray(results)) throw new Error("Did not return an array");
      if (results.length > 0) {
         if (results[0].city !== 'Arlington') throw new Error("Arlington connector returned wrong city");
      }
      return `Fetched ${results.length} permits from Arlington (Simulated/Live).`;
    }
  },
  {
    id: 'int-plano-api',
    name: 'Ingestion: Plano Excel Connector',
    category: 'Integration',
    run: async () => {
      const results = await fetchPlanoPermits();
      if (!Array.isArray(results)) throw new Error("Did not return an array");
      if (results.length > 0) {
         if (results[0].city !== 'Plano') throw new Error("Plano connector returned wrong city");
         if (results[0].dataSource !== 'Plano Permitting') throw new Error("Missing Data Source Label");
      }
      return `Fetched ${results.length} permits from Plano (Excel Parser).`;
    }
  },
  {
    id: 'int-irving-api',
    name: 'Ingestion: Irving ArcGIS Connector',
    category: 'Integration',
    run: async () => {
      const results = await fetchIrvingPermits();
      if (!Array.isArray(results)) throw new Error("Did not return an array");
      if (results.length > 0) {
         if (results[0].city !== 'Irving') throw new Error("Irving connector returned wrong city");
      }
      return `Fetched ${results.length} permits from Irving (ArcGIS).`;
    }
  },
  {
    id: 'int-lead-mgr',
    name: 'Lead Manager: Aggregation & Deduplication',
    category: 'System',
    run: async () => {
      const leads = await leadManager.fetchAllLeads();
      if (leads.length === 0) throw new Error("Lead Manager returned 0 leads");
      
      // Check for duplicates
      const ids = leads.map(l => l.id);
      const unique = new Set(ids);
      if (ids.length !== unique.size) throw new Error(`Duplicate IDs found: ${ids.length} total vs ${unique.size} unique`);
      
      return `Lead Manager aggregated ${leads.length} unique leads from all sources.`;
    }
  },

  // --- INTEGRATION TESTS: Enrichment ---
  {
    id: 'int-enrichment',
    name: 'Enrichment: TX Comptroller Search',
    category: 'Integration',
    run: async () => {
      // Test with a known entity
      const result = await searchFranchiseTaxpayer("Starbucks");
      // Note: If API is down/mocked, check if structure is valid
      if (!result) throw new Error("Enrichment returned null for known entity");
      if (typeof result.verified !== 'boolean') throw new Error("Invalid enrichment structure");
      return `Enrichment check passed. Verified: ${result.verified}`;
    }
  },

  // --- INTEGRATION TESTS: AI ---
  {
    id: 'int-ai-mock',
    name: 'AI Service: Response Structure',
    category: 'AI',
    run: async () => {
      // Test the service handles a request (even if it hits mock fallback due to missing key)
      const result = await analyzePermit(
        "Tenant improvement for new coffee shop",
        50000,
        "Dallas",
        "Commercial Remodel"
      );
      
      if (!result.category) throw new Error("AI Result missing category");
      if (result.confidenceScore < 0 || result.confidenceScore > 100) throw new Error("Invalid confidence score");
      
      return `AI Service returned valid structure. Reasoning: ${result.reasoning.substring(0, 30)}...`;
    }
  }
];
