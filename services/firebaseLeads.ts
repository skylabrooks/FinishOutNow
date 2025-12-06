import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { LeadClaim, LeadVisibility } from '../types';

const LEADS_COLLECTION = 'claimed_leads';
const LEAD_VISIBILITY_CACHE = 'lead_visibility_cache_v1';

/**
 * Claim a lead for a business
 */
export async function claimLead(
  leadId: string,
  businessId: string,
  businessName: string,
  userEmail: string,
  paymentStatus: 'pending' | 'paid' | 'free' = 'pending'
): Promise<LeadClaim> {
  try {
    const claimId = `${businessId}_${leadId}`;
    const now = new Date().toISOString();

    // Check if already claimed
    const existingClaim = await getDoc(doc(db, LEADS_COLLECTION, claimId));
    if (existingClaim.exists()) {
      const existing = existingClaim.data() as LeadClaim;
      throw new Error(`Lead already claimed by ${existing.businessName}`);
    }

    const claim: LeadClaim = {
      id: claimId,
      leadId,
      businessId,
      businessName,
      claimedAt: now,
      claimedBy: userEmail,
      paymentStatus,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    await setDoc(doc(db, LEADS_COLLECTION, claimId), claim);

    // Update local cache for instant UI feedback
    const cache = JSON.parse(localStorage.getItem(LEAD_VISIBILITY_CACHE) || '{}');
    cache[leadId] = {
      leadId,
      isClaimed: true,
      claimedBy: businessName,
      hiddenFields: [],
      visibleFields: [
        'permitType',
        'city',
        'status',
        'appliedDate',
        'applicant',
        'address',
        'valuation',
        'description',
      ],
    } as LeadVisibility;
    localStorage.setItem(LEAD_VISIBILITY_CACHE, JSON.stringify(cache));

    console.log(`[LeadClaims] Lead ${leadId} claimed by ${businessName}`);
    return claim;
  } catch (error) {
    console.error('[LeadClaims] Error claiming lead:', error);
    throw error;
  }
}

/**
 * Get lead visibility status (claimed or not)
 */
export async function getLeadVisibility(leadId: string): Promise<LeadVisibility> {
  try {
    // Check cache first
    const cache = JSON.parse(localStorage.getItem(LEAD_VISIBILITY_CACHE) || '{}');
    if (cache[leadId]) {
      return cache[leadId];
    }

    // Query Firestore for any claims on this lead
    const q = query(collection(db, LEADS_COLLECTION), where('leadId', '==', leadId));
    const snapshot = await getDocs(q);

    const visibility: LeadVisibility = {
      leadId,
      isClaimed: !snapshot.empty,
      claimedBy: snapshot.empty ? undefined : (snapshot.docs[0].data() as LeadClaim).businessName,
      hiddenFields: snapshot.empty
        ? ['applicant', 'address', 'valuation', 'description']
        : [],
      visibleFields: snapshot.empty
        ? ['permitType', 'city', 'status', 'appliedDate']
        : [
            'permitType',
            'city',
            'status',
            'appliedDate',
            'applicant',
            'address',
            'valuation',
            'description',
          ],
    };

    // Cache the result
    cache[leadId] = visibility;
    localStorage.setItem(LEAD_VISIBILITY_CACHE, JSON.stringify(cache));

    return visibility;
  } catch (error) {
    console.error('[LeadClaims] Error getting lead visibility:', error);
    // Fallback: assume unclaimed (hide details)
    return {
      leadId,
      isClaimed: false,
      hiddenFields: ['applicant', 'address', 'valuation', 'description'],
      visibleFields: ['permitType', 'city', 'status', 'appliedDate'],
    };
  }
}

/**
 * Check if current user can claim a lead (payment validation)
 */
export async function canClaimLead(
  userEmail: string,
  businessId: string
): Promise<boolean> {
  try {
    // For now, allow all authenticated users (demo)
    // In production, check:
    // 1. User subscription status
    // 2. Credit balance
    // 3. Monthly claim limit
    if (!userEmail || !businessId) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('[LeadClaims] Error checking claim permission:', error);
    return false;
  }
}

/**
 * Get all claims for a business
 */
export async function getBusinessClaims(businessId: string): Promise<LeadClaim[]> {
  try {
    const q = query(collection(db, LEADS_COLLECTION), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as LeadClaim);
  } catch (error) {
    console.error('[LeadClaims] Error fetching business claims:', error);
    return [];
  }
}

/**
 * Clear visibility cache
 */
export function clearVisibilityCache() {
  localStorage.removeItem(LEAD_VISIBILITY_CACHE);
}
