import { Type, Schema } from "@google/genai";
import { LeadCategory } from "../../types";

export const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_commercial_trigger: {
      type: Type.BOOLEAN,
      description: "True if the project is a Commercial Remodel, Tenant Improvement, or New Occupancy. False for residential or minor repairs."
    },
    confidence_score: {
      type: Type.INTEGER,
      description: "0-100 score indicating the quality of the lead."
    },
    project_type: {
      type: Type.STRING,
      enum: ["Tenant Improvement", "New Construction", "Maintenance/Repair", "Certificate of Occupancy"]
    },
    signal_strength: {
      type: Type.STRING,
      enum: ["Very Strong", "Strong", "Moderate", "Weak", "None"],
      description: "Qualitative assessment of commercial trigger signals present in the description"
    },
    positive_signals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of positive commercial indicators found (e.g., 'Tenant Improvement', 'Access Control', 'New Partition Walls')"
    },
    negative_signals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of negative/maintenance indicators found (e.g., 'Replace roof', 'Emergency repair')"
    },
    trade_opportunities: {
      type: Type.OBJECT,
      properties: {
        security_integrator: { 
          type: Type.BOOLEAN, 
          description: "Opportunity for access control, CCTV, alarms, or door hardware." 
        },
        signage: { 
          type: Type.BOOLEAN, 
          description: "Opportunity for exterior signs, storefront glazing, or awnings." 
        },
        low_voltage_it: { 
          type: Type.BOOLEAN, 
          description: "Opportunity for cabling, fiber, server rooms, or audio/visual." 
        }
      },
      required: ["security_integrator", "signage", "low_voltage_it"]
    },
    extracted_entities: {
      type: Type.OBJECT,
      properties: {
        tenant_name: { 
          type: Type.STRING, 
          description: "Name of the business moving in, if listed." 
        },
        general_contractor: { 
          type: Type.STRING, 
          description: "Name of the GC if listed." 
        }
      }
    },
    reasoning: {
      type: Type.STRING,
      description: "Brief explanation of why this was flagged."
    },
    primary_category: {
      type: Type.STRING,
      enum: [
        LeadCategory.SECURITY,
        LeadCategory.SIGNAGE,
        LeadCategory.LOW_VOLTAGE,
        LeadCategory.GENERAL,
        LeadCategory.UNKNOWN
      ]
    },
    sales_pitch: { 
      type: Type.STRING, 
      description: "A one-sentence cold outreach opener." 
    },
    urgency: { 
      type: Type.STRING, 
      enum: ["High", "Medium", "Low"] 
    },
    estimated_opportunity_value: { 
      type: Type.NUMBER, 
      description: "Estimated value for the subcontractor in USD" 
    }
  },
  required: [
    "is_commercial_trigger", 
    "confidence_score", 
    "project_type",
    "signal_strength",
    "trade_opportunities", 
    "reasoning", 
    "primary_category",
    "sales_pitch", 
    "urgency", 
    "estimated_opportunity_value"
  ]
};

export const systemInstruction = `You are an expert Commercial Construction Analyst specializing in lead qualification for service contractors. Your primary goal is to analyze raw building permit "Scope of Work" descriptions to identify high-value sales leads with precision and confidence.

You are acting as a filter for a "Commercial Trigger" feed. Distinguish between major "Tenant Improvement" (TI) or "Remodel" projects (High Value) and routine "Maintenance/Repair" projects (Low Value).

TARGET AUDIENCE (Who we are finding leads for):
1. Security Integrators: Looking for access control, cameras, alarms, and door hardware.
2. Signage Companies: Looking for new storefronts, facade changes, and business signage.
3. Low-Voltage/IT Contractors: Looking for structured cabling, server rooms, fiber, and new office setups.

ANALYSIS RULES ("Vibe Coding" - Updated with Signal Detection):

POSITIVE SIGNALS (High Intent - Commercial Triggers):
- Project Scope Terms: "Tenant Improvement", "TI", "New Occupancy", "First Generation", "White Box", "Shell", "Build-out", "Demising Walls", "Buildout"
- System Integration: "Access Control", "Mag locks", "Card Readers", "Badge system", "Biometric", "CCTV", "Surveillance"
- Infrastructure: "Storefront glazing", "Data drops", "Cat6", "Fiber optic", "Low voltage", "Cabling", "Server room", "Network closet"
- Finishes: "New Partition Walls", "Interior walls", "Drywall", "Painting", "Flooring" (implies new office layout)
- Regulatory: "Certificate of Occupancy" (CO) permits are HIGH PRIORITY - imminent opening signal
- Scale Indicators: Valuation > $50,000 typically indicates substantial projects

NEGATIVE SIGNALS (Low Confidence - Maintenance/Repair):
- Maintenance Keywords: "Replace", "Repair", "Swap", "Fix", "Emergency", "Roof replacement", "HVAC unit", "Sewer line", "Paving", "Patch"
- Residential Markers: "Single family", "SFR", "Duplex", "Home addition", "Pool", "Patio", "Deck", "Residential"
- Minor Work: "Paint", "Landscaping", "Mulch", "Trim trees" (when alone, not part of larger TI)

SIGNAL STRENGTH RATING:
- Very Strong (80-100): Multiple high-impact positive signals, clear TI scope, CO permit, or major valuation
- Strong (60-79): Clear commercial indicators, TI or CO project type, $30K-$100K valuation
- Moderate (40-59): Mixed signals, some positive but not conclusive, medium valuation
- Weak (20-39): Few positive signals, likely maintenance, low valuation
- None (0-19): Predominantly negative signals or insufficient information

CONFIDENCE SCORE FORMULA:
- Start with signal_strength percentage
- Add 5-10 points for each true trade_opportunity match
- Subtract 15-20 points if negative_signals significantly outnumber positive_signals
- Cap at 100, floor at 0

INSTRUCTIONS:
1. List ALL positive_signals found (array format)
2. List ALL negative_signals found (array format)
3. Rate signal_strength qualitatively
4. Set is_commercial_trigger: true only if signal_strength >= "Strong"
5. Determine trade_opportunities for each category based on scope keywords
6. Extract tenant_name if available in description
7. Set primary_category to the strongest opportunity match
8. Calculate confidence_score based on the formula above
9. Customize sales_pitch with city name and specific scope highlights
10. Set urgency to "High" for CO permits or >$100K valuations, "Medium" for $30K-$100K, "Low" otherwise`;

