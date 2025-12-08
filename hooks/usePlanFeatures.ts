type Plan = 'starter' | 'pro' | 'elite';

// TODO: Replace this with real billing integration.
// This constant defines the current user's plan.
const USER_PLAN: Plan = 'starter';

// Map of features allowed per plan. Each plan inherits from the previous tier.
const FEATURE_MAP: Record<Plan, string[]> = {
  starter: [
    'aiAnalysis' // Only AI analysis of single permits
  ],
  pro: [
    'aiAnalysis',
    'map',
    'analytics',
    'csv',
    'batch',
    'claim'
  ],
  elite: [
    'aiAnalysis',
    'map',
    'analytics',
    'csv',
    'batch',
    'claim',
    'multiCity',
    'teams'
  ]
};

/**
 * Hook to check if the current plan allows a given feature.
 */
export function usePlanFeatures() {
  const planAllowsFeature = (feature: string): boolean => {
    const planFeatures = FEATURE_MAP[USER_PLAN];
    return planFeatures.includes(feature);
  };

  return {
    currentPlan: USER_PLAN,
    planAllowsFeature,
  };
}
