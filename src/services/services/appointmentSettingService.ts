import { LeadClaim, CallAttempt, AppointmentDetails, AppointmentStatus } from '../types';

/**
 * Appointment Setting Service
 * Manages E BookGov's appointment setting process:
 * - Track cold call attempts (max 6 over 2 weeks)
 * - Manage appointment scheduling
 * - Track rep assignments and outcomes
 */

export interface AppointmentSettingConfig {
  maxAttempts: number;
  windowDays: number;
  attemptIntervalDays: number;
}

// Default configuration: 6 attempts over 14 days
export const DEFAULT_APPOINTMENT_CONFIG: AppointmentSettingConfig = {
  maxAttempts: 6,
  windowDays: 14,
  attemptIntervalDays: 2 // Minimum days between attempts
};

/**
 * Initialize appointment setting for a claimed lead
 */
export function initializeAppointmentSetting(
  claim: LeadClaim,
  assignedRepId?: string,
  assignedRepName?: string
): LeadClaim {
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + DEFAULT_APPOINTMENT_CONFIG.windowDays);

  return {
    ...claim,
    appointmentStatus: 'not-started',
    callAttempts: [],
    callWindowStartDate: now.toISOString(),
    callWindowEndDate: windowEnd.toISOString(),
    assignedRepId,
    assignedRepName,
    appointmentLastUpdated: now.toISOString()
  };
}

/**
 * Add a call attempt to the lead
 */
export function addCallAttempt(
  claim: LeadClaim,
  outcome: CallAttempt['outcome'],
  notes?: string,
  repName?: string
): { updatedClaim: LeadClaim; error?: string } {
  const attempts = claim.callAttempts || [];
  
  // Check if max attempts reached
  if (attempts.length >= DEFAULT_APPOINTMENT_CONFIG.maxAttempts) {
    return {
      updatedClaim: claim,
      error: `Maximum attempts (${DEFAULT_APPOINTMENT_CONFIG.maxAttempts}) already reached`
    };
  }

  // Check calling window
  const now = new Date();
  const windowEnd = claim.callWindowEndDate ? new Date(claim.callWindowEndDate) : null;
  if (windowEnd && now > windowEnd) {
    return {
      updatedClaim: claim,
      error: 'Call window has expired'
    };
  }

  // Check minimum interval between attempts (except for first attempt)
  if (attempts.length > 0) {
    const lastAttempt = attempts[attempts.length - 1];
    const lastAttemptDate = new Date(lastAttempt.timestamp);
    const daysSinceLastAttempt = (now.getTime() - lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastAttempt < DEFAULT_APPOINTMENT_CONFIG.attemptIntervalDays) {
      return {
        updatedClaim: claim,
        error: `Must wait ${DEFAULT_APPOINTMENT_CONFIG.attemptIntervalDays} days between attempts`
      };
    }
  }

  const newAttempt: CallAttempt = {
    attemptNumber: attempts.length + 1,
    timestamp: now.toISOString(),
    outcome,
    notes,
    repName: repName || claim.assignedRepName
  };

  const newAttempts = [...attempts, newAttempt];
  
  // Determine new status
  let newStatus: AppointmentStatus = 'calling-in-progress';
  
  if (outcome === 'appointment-set') {
    newStatus = 'appointment-set';
  } else if (outcome === 'wrong-number') {
    newStatus = 'lead-unqualified';
  } else if (newAttempts.length >= DEFAULT_APPOINTMENT_CONFIG.maxAttempts) {
    newStatus = 'max-attempts-reached';
  }

  return {
    updatedClaim: {
      ...claim,
      callAttempts: newAttempts,
      appointmentStatus: newStatus,
      appointmentLastUpdated: now.toISOString()
    }
  };
}

/**
 * Schedule an appointment
 */
export function scheduleAppointment(
  claim: LeadClaim,
  appointmentDetails: AppointmentDetails
): LeadClaim {
  return {
    ...claim,
    appointmentStatus: 'appointment-set',
    appointmentDetails,
    appointmentLastUpdated: new Date().toISOString()
  };
}

/**
 * Mark appointment as completed
 */
export function completeAppointment(
  claim: LeadClaim,
  notes?: string
): LeadClaim {
  return {
    ...claim,
    appointmentStatus: 'completed',
    appointmentDetails: {
      ...claim.appointmentDetails,
      notes: notes || claim.appointmentDetails?.notes
    },
    appointmentLastUpdated: new Date().toISOString()
  };
}

/**
 * Check if lead can receive more call attempts
 */
export function canMakeCallAttempt(claim: LeadClaim): { canCall: boolean; reason?: string } {
  const attempts = claim.callAttempts || [];
  
  // Check max attempts
  if (attempts.length >= DEFAULT_APPOINTMENT_CONFIG.maxAttempts) {
    return { canCall: false, reason: 'Maximum attempts reached' };
  }

  // Check if already successful
  if (claim.appointmentStatus === 'appointment-set' || claim.appointmentStatus === 'completed') {
    return { canCall: false, reason: 'Appointment already set' };
  }

  // Check if disqualified
  if (claim.appointmentStatus === 'lead-unqualified') {
    return { canCall: false, reason: 'Lead disqualified' };
  }

  // Check calling window
  const now = new Date();
  const windowEnd = claim.callWindowEndDate ? new Date(claim.callWindowEndDate) : null;
  if (windowEnd && now > windowEnd) {
    return { canCall: false, reason: 'Call window expired' };
  }

  // Check interval
  if (attempts.length > 0) {
    const lastAttempt = attempts[attempts.length - 1];
    const lastAttemptDate = new Date(lastAttempt.timestamp);
    const daysSinceLastAttempt = (now.getTime() - lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastAttempt < DEFAULT_APPOINTMENT_CONFIG.attemptIntervalDays) {
      const nextCallDate = new Date(lastAttemptDate);
      nextCallDate.setDate(nextCallDate.getDate() + DEFAULT_APPOINTMENT_CONFIG.attemptIntervalDays);
      return { 
        canCall: false, 
        reason: `Next attempt available on ${nextCallDate.toLocaleDateString()}` 
      };
    }
  }

  return { canCall: true };
}

/**
 * Get statistics for appointment setting
 */
export function getAppointmentStats(claim: LeadClaim) {
  const attempts = claim.callAttempts || [];
  const maxAttempts = DEFAULT_APPOINTMENT_CONFIG.maxAttempts;
  const windowEnd = claim.callWindowEndDate ? new Date(claim.callWindowEndDate) : null;
  const now = new Date();
  
  const daysRemaining = windowEnd 
    ? Math.max(0, Math.ceil((windowEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
  const lastAttemptOutcome = lastAttempt?.outcome;

  return {
    totalAttempts: attempts.length,
    maxAttempts,
    attemptsRemaining: maxAttempts - attempts.length,
    daysRemaining,
    lastAttemptDate: lastAttempt?.timestamp,
    lastAttemptOutcome,
    status: claim.appointmentStatus || 'not-started',
    isAppointmentSet: claim.appointmentStatus === 'appointment-set',
    isCompleted: claim.appointmentStatus === 'completed',
    canMakeAttempt: canMakeCallAttempt(claim).canCall
  };
}

/**
 * Mark email as sent by client
 */
export function markEmailSent(claim: LeadClaim): LeadClaim {
  return {
    ...claim,
    appointmentStatus: 'email-sent',
    emailSentAt: new Date().toISOString(),
    appointmentLastUpdated: new Date().toISOString()
  };
}

/**
 * Assign rep to lead
 */
export function assignRep(
  claim: LeadClaim,
  repId: string,
  repName: string
): LeadClaim {
  return {
    ...claim,
    assignedRepId: repId,
    assignedRepName: repName,
    appointmentLastUpdated: new Date().toISOString()
  };
}
