/**
 * Global test setup file
 * Runs before all tests
 */

import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Setup localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Setup window mock for browser-only features
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
    location: {
      href: 'http://localhost:3000'
    }
  },
  writable: true
});

// Mock process.env for tests
process.env.API_KEY = 'test-gemini-api-key';
process.env.VITE_GEMINI_API_KEY = 'test-gemini-api-key';

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// Global test utilities
export const mockPermit = {
  id: 'TEST-001',
  city: 'Dallas' as const,
  permitType: 'Commercial Remodel',
  address: '123 Main St',
  appliedDate: '2025-01-01',
  description: 'Tenant Improvement for new office space with security system installation',
  valuation: 50000,
  applicant: 'Test Contractor LLC',
  dataSource: 'Test Source'
};

export const mockAIAnalysis = {
  isCommercialTrigger: true,
  confidenceScore: 85,
  category: 'Security' as const,
  salesPitch: 'Perfect opportunity for access control and CCTV installation',
  tradeOpportunities: {
    securityIntegrator: true,
    signage: false,
    lowVoltageIT: true
  },
  extractedEntities: {
    tenantName: 'New Office Corp'
  },
  reasoning: 'Commercial tenant improvement with security system requirements',
  urgency: 'High' as const,
  estimatedValue: 15000
};

console.log('🧪 Test environment initialized');
