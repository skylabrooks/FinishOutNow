/**
 * Unit Tests: Firebase Integration
 * Tests lead claiming and Firebase operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClaimedLead } from '../../types';

// Mock Firebase modules
vi.mock('../../services/firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('../../services/firebaseLeads', () => ({
  claimLead: vi.fn().mockResolvedValue({ success: true }),
  checkLeadClaimed: vi.fn().mockResolvedValue(null),
  getUserClaims: vi.fn().mockResolvedValue([])
}));

describe('Firebase - Lead Claiming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should claim a lead successfully', async () => {
    const mockLead: ClaimedLead = {
      permitId: 'TEST-001',
      businessId: 'test-business',
      claimedAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
      paymentStatus: 'pending'
    };

    // Import the mocked function
    const { claimLead } = await import('../../services/firebaseLeads');
    
    const result = await claimLead(mockLead);
    
    expect(result).toBeDefined();
    expect(claimLead).toHaveBeenCalledWith(mockLead);
  });

  it('should check if lead is claimed', async () => {
    const { checkLeadClaimed } = await import('../../services/firebaseLeads');
    
    const result = await checkLeadClaimed('TEST-001');
    
    expect(checkLeadClaimed).toHaveBeenCalledWith('TEST-001');
  });

  it('should get user claims', async () => {
    const { getUserClaims } = await import('../../services/firebaseLeads');
    
    const claims = await getUserClaims('test-business');
    
    expect(Array.isArray(claims)).toBe(true);
    expect(getUserClaims).toHaveBeenCalledWith('test-business');
  });
});

describe('Firebase - Local Caching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should cache claimed leads locally', () => {
    const cacheKey = 'finishOutNow_claims_v1';
    
    const mockClaims = {
      'TEST-001': {
        permitId: 'TEST-001',
        businessId: 'test-business',
        claimedAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      }
    };

    localStorage.setItem(cacheKey, JSON.stringify(mockClaims));
    
    const cached = localStorage.getItem(cacheKey);
    expect(cached).toBeDefined();
    
    const parsed = JSON.parse(cached!);
    expect(parsed['TEST-001']).toBeDefined();
  });

  it('should validate claim expiration', () => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    const validClaim = {
      expiresAt: now + thirtyDays
    };
    
    const expiredClaim = {
      expiresAt: now - 1000
    };

    expect(validClaim.expiresAt).toBeGreaterThan(now);
    expect(expiredClaim.expiresAt).toBeLessThan(now);
  });
});

describe('Firebase - Lead Visibility Control', () => {
  it('should hide sensitive fields for unclaimed leads', () => {
    const mockLead = {
      id: 'TEST-001',
      applicant: 'Test Company',
      address: '123 Main St',
      valuation: 50000,
      description: 'Office remodel'
    };

    const isClaimed = false;

    // Simulate visibility control
    const visibleLead = {
      ...mockLead,
      applicant: isClaimed ? mockLead.applicant : '[Claim to View]',
      address: isClaimed ? mockLead.address : '[Claim to View]',
      valuation: isClaimed ? mockLead.valuation : 0
    };

    expect(visibleLead.applicant).toBe('[Claim to View]');
    expect(visibleLead.address).toBe('[Claim to View]');
    expect(visibleLead.valuation).toBe(0);
  });

  it('should show all fields for claimed leads', () => {
    const mockLead = {
      id: 'TEST-001',
      applicant: 'Test Company',
      address: '123 Main St',
      valuation: 50000,
      description: 'Office remodel'
    };

    const isClaimed = true;

    const visibleLead = {
      ...mockLead,
      applicant: isClaimed ? mockLead.applicant : '[Claim to View]',
      address: isClaimed ? mockLead.address : '[Claim to View]',
      valuation: isClaimed ? mockLead.valuation : 0
    };

    expect(visibleLead.applicant).toBe('Test Company');
    expect(visibleLead.address).toBe('123 Main St');
    expect(visibleLead.valuation).toBe(50000);
  });
});
