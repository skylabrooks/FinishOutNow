import { AIAnalysisResult } from "../../types";
import { categorizeFromDescription, isMaintenanceLike } from "./categoryClassifier";

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
 * Factors in:
 * - Signal strength assessment
 * - Trade opportunity matches
 * - Valuation thresholds
 * - Maintenance detection
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

  // Apply signal strength penalty if weak
  if (raw.signal_strength) {
    const signalMap: Record<string, number> = {
      "Very Strong": 95,
      "Strong": 75,
      "Moderate": 50,
      "Weak": 25,
      "None": 5
    };
    const signalFloor = signalMap[raw.signal_strength] || score;
    score = Math.min(score, signalFloor);
  }

  // Penalize if more negative than positive signals
  const posCount = raw.positive_signals?.length || 0;
  const negCount = raw.negative_signals?.length || 0;
  if (negCount > posCount) {
    score = Math.max(0, score - (negCount - posCount) * 10);
  }

  // Trade opportunity bonus: +5 points per match (max +15)
  const opportunityCount = [
    raw.trade_opportunities.security_integrator,
    raw.trade_opportunities.signage,
    raw.trade_opportunities.low_voltage_it
  ].filter(Boolean).length;
  score += opportunityCount * 5;

  // Valuation-based adjustments
  if (valuation < 1000) {
    score = Math.min(score, 20);
  } else if (valuation > 100000) {
    score = Math.min(100, score + 10); // Bonus for high-value projects
  }

  // Maintenance detection hard penalty
  if (maintenanceLike) {
    score = Math.min(score, 30);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Maps the snake_case API response from Gemini to camelCase for the application.
 * Also applies business logic like maintenance detection and confidence adjustments.
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
      tenantName: raw.extracted_entities?.tenant_name,
      generalContractor: raw.extracted_entities?.general_contractor
    },
    reasoning: raw.reasoning,
    category: categorizeFromDescription(description, raw.primary_category),
    salesPitch: raw.sales_pitch,
    urgency: (raw.urgency || "Low") as "High" | "Medium" | "Low",
    estimatedValue: raw.estimated_opportunity_value
  };
}
