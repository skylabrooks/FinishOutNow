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

    // Check local cache first (works offline)
    const cache = JSON.parse(localStorage.getItem(LEAD_VISIBILITY_CACHE) || '{}');
    if (cache[leadId]?.isClaimed) {
      throw new Error(`Lead already claimed by ${cache[leadId].claimedBy}`);
    }

    // Try to check Firestore (may fail if offline, but cache prevents duplicate claims)
    try {
      const existingClaim = await getDoc(doc(db, LEADS_COLLECTION, claimId));
      if (existingClaim.exists()) {
        const existing = existingClaim.data() as LeadClaim;
        throw new Error(`Lead already claimed by ${existing.businessName}`);
      }
    } catch (firebaseErr) {
      // If offline, proceed anyway (cache is the source of truth)
      console.warn('[LeadClaims] Could not check Firestore, relying on cache:', firebaseErr);
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

    // Try to save to Firestore
    try {
      await setDoc(doc(db, LEADS_COLLECTION, claimId), claim);
      console.log(`[LeadClaims] Lead ${leadId} claimed by ${businessName} (Firestore)`);
    } catch (firebaseErr) {
      console.warn('[LeadClaims] Could not save to Firestore, using local cache only:', firebaseErr);
    }

    // Always update local cache for instant UI feedback (works offline)
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
 * Get all claimed leads for a specific business (for Acquired Leads Dashboard)
 */
export async function getClaimedLeadsForBusiness(businessId: string): Promise<LeadClaim[]> {
  try {
    // Try Firestore first
    try {
      const q = query(collection(db, LEADS_COLLECTION), where('businessId', '==', businessId));
      const snapshot = await getDocs(q);
      const claims = snapshot.docs.map(doc => doc.data() as LeadClaim);
      
      if (claims.length > 0) {
        console.log(`[LeadClaims] Retrieved ${claims.length} claimed leads from Firestore for business ${businessId}`);
        return claims;
      }
    } catch (firebaseErr) {
      console.warn('[LeadClaims] Could not fetch from Firestore, using localStorage:', firebaseErr);
    }

    // Fallback to localStorage cache
    const cache = JSON.parse(localStorage.getItem(LEAD_VISIBILITY_CACHE) || '{}');
    const claims: LeadClaim[] = [];

    for (const [leadId, visibility] of Object.entries(cache)) {
      const vis = visibility as any;
      if (vis.isClaimed && vis.claimedBy === businessId) {
        // Reconstruct LeadClaim from cache
        claims.push({
          id: `${businessId}_${leadId}`,
          leadId,
          businessId,
          businessName: vis.businessName || 'Unknown',
          claimedAt: vis.claimedAt || new Date().toISOString(),
          claimedBy: vis.claimedByEmail || 'unknown@example.com',
          paymentStatus: 'free',
          expiresAt: vis.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    if (claims.length > 0) {
      console.log(`[LeadClaims] Retrieved ${claims.length} claimed leads from localStorage cache`);
    }

    return claims;
  } catch (error) {
    console.error('[LeadClaims] Error fetching claimed leads for business:', error);
    return [];
  }
}

/**
 * Clear visibility cache
 */
export function clearVisibilityCache() {
  localStorage.removeItem(LEAD_VISIBILITY_CACHE);
}

// ========================================
// APPOINTMENT SETTING FUNCTIONS
// ========================================

/**
 * Update appointment setting data for a claimed lead
 */
export async function updateAppointmentSetting(
  claimId: string,
  updates: Partial<LeadClaim>
): Promise<void> {
  try {
    // Update Firestore
    try {
      const claimRef = doc(db, LEADS_COLLECTION, claimId);
      await setDoc(claimRef, updates, { merge: true });
      console.log(`[AppointmentSetting] Updated claim ${claimId} in Firestore`);
    } catch (firebaseErr) {
      console.warn('[AppointmentSetting] Could not update Firestore, updating cache only:', firebaseErr);
    }

    // Always update cache for immediate UI feedback
    // Note: Cache structure needs to be extended to store full LeadClaim data
    const fullClaimCache = JSON.parse(localStorage.getItem('full_claims_cache_v1') || '{}');
    fullClaimCache[claimId] = {
      ...fullClaimCache[claimId],
      ...updates,
      appointmentLastUpdated: new Date().toISOString()
    };
    localStorage.setItem('full_claims_cache_v1', JSON.stringify(fullClaimCache));

  } catch (error) {
    console.error('[AppointmentSetting] Error updating appointment setting:', error);
    throw error;
  }
}

/**
 * Get full claim data including appointment setting info
 */
export async function getFullClaimData(claimId: string): Promise<LeadClaim | null> {
  try {
    // Try Firestore first
    try {
      const claimRef = doc(db, LEADS_COLLECTION, claimId);
      const claimDoc = await getDoc(claimRef);
      
      if (claimDoc.exists()) {
        return claimDoc.data() as LeadClaim;
      }
    } catch (firebaseErr) {
      console.warn('[AppointmentSetting] Could not fetch from Firestore, using cache:', firebaseErr);
    }

    // Fallback to cache
    const fullClaimCache = JSON.parse(localStorage.getItem('full_claims_cache_v1') || '{}');
    return fullClaimCache[claimId] || null;

  } catch (error) {
    console.error('[AppointmentSetting] Error getting full claim data:', error);
    return null;
  }
}

/**
 * Save email template for a claim
 */
export async function saveEmailTemplate(
  claimId: string,
  emailTemplate: string
): Promise<void> {
  try {
    await updateAppointmentSetting(claimId, {
      emailTemplate,
      emailGeneratedAt: new Date().toISOString(),
      appointmentStatus: 'email-generated'
    });
    console.log(`[AppointmentSetting] Saved email template for claim ${claimId}`);
  } catch (error) {
    console.error('[AppointmentSetting] Error saving email template:', error);
    throw error;
  }
}

/**
 * Mark email as sent by client
 */
export async function markEmailAsSent(claimId: string): Promise<void> {
  try {
    await updateAppointmentSetting(claimId, {
      emailSentAt: new Date().toISOString(),
      appointmentStatus: 'email-sent'
    });
    console.log(`[AppointmentSetting] Marked email as sent for claim ${claimId}`);
  } catch (error) {
    console.error('[AppointmentSetting] Error marking email as sent:', error);
    throw error;
  }
}

/**
 * Add call attempt to a claim
 */
export async function addCallAttemptToLead(
  claimId: string,
  callAttempt: import('../types').CallAttempt,
  newStatus: import('../types').AppointmentStatus
): Promise<void> {
  try {
    const claim = await getFullClaimData(claimId);
    if (!claim) {
      throw new Error(`Claim ${claimId} not found`);
    }

    const existingAttempts = claim.callAttempts || [];
    
    await updateAppointmentSetting(claimId, {
      callAttempts: [...existingAttempts, callAttempt],
      appointmentStatus: newStatus,
      appointmentLastUpdated: new Date().toISOString()
    });
    
    console.log(`[AppointmentSetting] Added call attempt to claim ${claimId}`);
  } catch (error) {
    console.error('[AppointmentSetting] Error adding call attempt:', error);
    throw error;
  }
}

/**
 * Schedule appointment for a claim
 */
export async function scheduleAppointmentForLead(
  claimId: string,
  appointmentDetails: import('../types').AppointmentDetails
): Promise<void> {
  try {
    await updateAppointmentSetting(claimId, {
      appointmentDetails,
      appointmentStatus: 'appointment-set',
      appointmentLastUpdated: new Date().toISOString()
    });
    console.log(`[AppointmentSetting] Scheduled appointment for claim ${claimId}`);
  } catch (error) {
    console.error('[AppointmentSetting] Error scheduling appointment:', error);
    throw error;
  }
}
