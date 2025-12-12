import { AIAnalysisResult } from "../../types";
import { categorizeFromDescription, isMaintenanceLike, extractContractorName, extractTenantName } from "./categoryClassifier";

interface RawGeminiResponse {
  is_commercial_trigger: boolean;
  confidence_score: number;
  project_type: string;
  signal_strength?: string;
  positive_signals?: string[];
  negative_signals?: string[];
  trade_opportunities: {
    security_integrator: boolean;
    signage: boolean;
    low_voltage_it: boolean;
  };
  extracted_entities: {
    tenant_name?: string;
    general_contractor?: string;
  };
  reasoning: string;
  primary_category: string;
  sales_pitch: string;
  urgency: string;
  estimated_opportunity_value: number;
}

/**
 * Calculates adjusted confidence score based on multiple signals and business rules.
 * v2.0: Aligns with Tier 1/2/3 framework from schema.ts
 * Factors in:
 * - Signal strength assessment (now mapped to Tier baselines)
 * - Trade opportunity matches
 * - Valuation thresholds (acts as tiebreaker for Tier 2/3)
 * - Maintenance detection (hard cap at 30)
 * - Signal balance (positive vs negative)
 */
function calculateAdjustedConfidence(
  raw: RawGeminiResponse,
  description: string,
  permitType: string,
  valuation: number
): number {
  let score = raw.confidence_score ?? 0;
  const maintenanceLike = isMaintenanceLike(description, permitType);

  // Apply signal strength flooring per Tier 1/2/3 framework
  // Tier 1 = Extreme Confidence (85+), Tier 2 = Strong (60-79), Tier 3 = Moderate (40-59), None = <40
  if (raw.signal_strength) {
    const signalMap: Record<string, number> = {
      "Tier 1": 85,        // Extreme Confidence: CO, TI, Build-out signals
      "Tier 2": 72,        // Strong: Demolition, Storefront, Data infrastructure
      "Tier 3": 50,        // Moderate: Single strong indicator or mixed signals
      "Very Strong": 85,   // Legacy support
      "Strong": 72,        // Legacy support (adjusted from 75 to align with Tier 2)
      "Moderate": 50,      // Maintains consistency with Tier 3
      "Weak": 25,
      "None": 5
    };
    const signalFloor = signalMap[raw.signal_strength] || score;
    // Use signal floor as minimum, allowing score to exceed it for excellent cases
    score = Math.max(score, signalFloor);
  }

  // Penalize if negative signals outnumber positive signals
  const posCount = raw.positive_signals?.length || 0;
  const negCount = raw.negative_signals?.length || 0;
  if (negCount > posCount) {
    // More aggressive penalty for signal imbalance
    score = Math.max(0, score - (negCount - posCount) * 12);
  }

  // Trade opportunity bonus: +5 points per match (max +15)
  // Rewards permits that match contractor specialization
  const opportunityCount = [
    raw.trade_opportunities.security_integrator,
    raw.trade_opportunities.signage,
    raw.trade_opportunities.low_voltage_it
  ].filter(Boolean).length;
  score += opportunityCount * 5;

  // Valuation-based adjustments (acts as tiebreaker for Tier 2/3 cases)
  if (valuation < 5000) {
    // Very small projects: hard cap at 40 (below Tier 3 threshold)
    score = Math.min(score, 40);
  } else if (valuation >= 50000 && valuation < 100000) {
    // Mid-range commercial (sweet spot): boost by 5 points
    score = Math.min(100, score + 5);
  } else if (valuation >= 100000) {
    // High-value projects: significant boost (valuation validates commercial intent)
    score = Math.min(100, score + 12);
  }

  // Maintenance detection hard cap (prevents false positives on maintenance work)
  // Even if other signals suggest commercial, maintenance-focused description caps at 30
  if (maintenanceLike) {
    score = Math.min(score, 30);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}


/**
 * Maps the snake_case API response from Gemini to camelCase for the application.
 * Also applies business logic like maintenance detection and confidence adjustments.
 * v2.0: Enriches extracted entities with client-side extraction patterns.
 */
export function mapGeminiResponse(
  raw: RawGeminiResponse,
  description: string,
  permitType: string,
  valuation: number
): AIAnalysisResult {
  const maintenanceLike = isMaintenanceLike(description, permitType);
  
  // Calculate adjusted confidence with multi-signal logic
  const adjustedConfidence = calculateAdjustedConfidence(raw, description, permitType, valuation);
  
  // Re-evaluate commercial trigger if confidence is very low after adjustment
  const derivedIsCommercial = adjustedConfidence < 35 ? false : raw.is_commercial_trigger;

  // Enhance extracted entities with client-side pattern matching
  // Gemini provides the primary extraction, but we augment with fallback patterns
  const tenantName = raw.extracted_entities?.tenant_name || extractTenantName(description);
  const generalContractor = raw.extracted_entities?.general_contractor || extractContractorName(description);

  return {
    isCommercialTrigger: derivedIsCommercial,
    confidenceScore: adjustedConfidence,
    projectType: (raw.project_type || "Maintenance/Repair") as "Tenant Improvement" | "New Construction" | "Maintenance/Repair" | "Certificate of Occupancy",
    tradeOpportunities: {
      securityIntegrator: raw.trade_opportunities?.security_integrator ?? false,
      signage: raw.trade_opportunities?.signage ?? false,
      lowVoltageIT: raw.trade_opportunities?.low_voltage_it ?? false
    },
    extractedEntities: {
      tenantName,
      generalContractor
    },
    reasoning: raw.reasoning,
    category: categorizeFromDescription(description, raw.primary_category),
    salesPitch: raw.sales_pitch,
    urgency: (raw.urgency || "Low") as "High" | "Medium" | "Low",
    estimatedValue: raw.estimated_opportunity_value
  };
}
