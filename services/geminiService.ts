
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, LeadCategory, CompanyProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });

const analysisSchema: Schema = {
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
    trade_opportunities: {
      type: Type.OBJECT,
      properties: {
        security_integrator: { type: Type.BOOLEAN, description: "Opportunity for access control, CCTV, alarms, or door hardware." },
        signage: { type: Type.BOOLEAN, description: "Opportunity for exterior signs, storefront glazing, or awnings." },
        low_voltage_it: { type: Type.BOOLEAN, description: "Opportunity for cabling, fiber, server rooms, or audio/visual." }
      },
      required: ["security_integrator", "signage", "low_voltage_it"]
    },
    extracted_entities: {
      type: Type.OBJECT,
      properties: {
        tenant_name: { type: Type.STRING, description: "Name of the business moving in, if listed." },
        general_contractor: { type: Type.STRING, description: "Name of the GC if listed." }
      }
    },
    reasoning: {
      type: Type.STRING,
      description: "Brief explanation of why this was flagged."
    },
    // Additional fields for UI
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
    sales_pitch: { type: Type.STRING, description: "A one-sentence cold outreach opener." },
    urgency: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
    estimated_opportunity_value: { type: Type.NUMBER, description: "Estimated value for the subcontractor in USD" }
  },
  required: [
    "is_commercial_trigger", "confidence_score", "project_type", 
    "trade_opportunities", "reasoning", "primary_category", 
    "sales_pitch", "urgency", "estimated_opportunity_value"
  ]
};

export const analyzePermit = async (
    description: string, 
    valuation: number, 
    city: string, 
    permitType: string,
    companyProfile?: CompanyProfile
): Promise<AIAnalysisResult> => {
  try {
    let contextPrompt = `Analyze this ${permitType} permit description: "${description}" located in ${city}, TX with a total project valuation of $${valuation}.`;

    if (companyProfile) {
        contextPrompt += `
        
        CRITICAL INSTRUCTION FOR "sales_pitch":
        You are generating a lead specifically for:
        - Company: ${companyProfile.name}
        - Industry: ${companyProfile.industry}
        - Contact Person: ${companyProfile.contactName}
        - Value Proposition: "${companyProfile.valueProp}"

        Customize the "sales_pitch" field to be a cold email opening line written by ${companyProfile.contactName} from ${companyProfile.name}.
        It must specifically reference the project details (e.g., "saw you are starting the suite 400 buildout") and weave in the company's value proposition.
        Keep it professional, direct, and under 2 sentences.
        `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
      config: {
        systemInstruction: `You are an expert Commercial Construction Analyst. Your primary goal is to analyze raw building permit "Scope of Work" descriptions to identify high-value sales leads for specific vendor categories.

        You are acting as a filter for a "Commercial Trigger" feed. You must distinguish between major "Tenant Improvement" (TI) or "Remodel" projects (which are High Value) and routine "Maintenance/Repair" projects (which are Low Value).

        TARGET AUDIENCE (Who we are finding leads for):
        1. Security Integrators: Looking for access control, cameras, alarms, and door hardware.
        2. Signage Companies: Looking for new storefronts, facade changes, and business signage.
        3. Low-Voltage/IT Contractors: Looking for structured cabling, server rooms, fiber, and new office setups.

        ANALYSIS RULES ("Vibe Coding"):
        - Positive Signals (High Intent):
            - Terms like "Tenant Improvement", "TI", "New Occupancy", "First Generation", "White Box", "Shell", "Build-out", "Demising Walls".
            - Mentions of "Access Control", "Mag locks", "Card Readers", "Storefront glazing", "Data drops", "Cat6", "Low voltage".
            - "New Partition Walls" implies new office layouts, which require new cabling and safety devices.
            - "Certificate of Occupancy" (CO) permits are high priority as they signal imminent opening.
        
        - Negative Signals (Ignore/Low Confidence):
            - Residential keywords: "Single family", "SFR", "Duplex", "Home addition", "Pool", "Patio".
            - Maintenance keywords: "Replace roof", "Repair stucco", "Swap HVAC unit", "Emergency repair", "Sewer line replacement", "Paving".
        
        INSTRUCTIONS:
        - Populate 'is_commercial_trigger' based on the signals above.
        - Determine 'trade_opportunities' for each category.
        - Extract 'tenant_name' if available (e.g., 'Starbucks', 'Law Office').
        - Select the strongest 'primary_category' for the dashboard.
        - Customize the 'sales_pitch' to mention the city and specific scope.
        `,
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    const text = typeof response.text === "function" ? response.text() : response.text;

    if (typeof text === "string" && text.trim().length > 0) {
        const raw = JSON.parse(text);

        const lowerDesc = description.toLowerCase();

        // Normalize category values to match dashboard/test expectations
        const normalizeCategory = (value?: string): LeadCategory => {
        if (!value) return "Unknown" as LeadCategory;
        const v = value.toLowerCase();
        if (v.includes("security")) return "Security" as LeadCategory;
        if (v.includes("signage")) return "Signage" as LeadCategory;
        if (v.includes("low voltage") || v.includes("it")) return "Low Voltage" as LeadCategory;
        if (v.includes("general")) return "General" as LeadCategory;
        if (v.includes("unknown") || v.includes("uncategorized")) return "Unknown" as LeadCategory;
        return "Unknown" as LeadCategory;
      };

        const categorizeFromDescription = (): LeadCategory => {
          const signageHints = ["sign", "signage", "awning", "storefront", "facade", "banner"];
          const lowVoltageHints = ["cabling", "cat6", "fiber", "low voltage", "server room", "data drop", "it"];
          const securityHints = ["access control", "cctv", "camera", "alarm", "badge", "card reader"];

          if (signageHints.some(h => lowerDesc.includes(h))) return "Signage" as LeadCategory;
          if (lowVoltageHints.some(h => lowerDesc.includes(h))) return "Low Voltage" as LeadCategory;
          if (securityHints.some(h => lowerDesc.includes(h))) return "Security" as LeadCategory;
          return normalizeCategory(raw.primary_category);
        };
      
      // Map Snake Case from API to Camel Case for App
        const maintenanceLike = (
          lowerDesc.includes("maintenance") ||
          lowerDesc.includes("repair") ||
          lowerDesc.includes("replace hvac") ||
          lowerDesc.includes("filter") ||
          permitType.toLowerCase().includes("maintenance")
        );

        const derivedIsCommercial = maintenanceLike || valuation < 1000 ? false : raw.is_commercial_trigger;
        const derivedConfidence = derivedIsCommercial === false && (maintenanceLike || valuation < 1000)
          ? Math.min(raw.confidence_score ?? 0, 30)
          : raw.confidence_score;

      return {
          isCommercialTrigger: derivedIsCommercial,
          confidenceScore: derivedConfidence,
        projectType: raw.project_type,
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
          category: categorizeFromDescription(),
        salesPitch: raw.sales_pitch,
        urgency: raw.urgency,
        estimatedValue: raw.estimated_opportunity_value
      };
    }
    
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback for demo purposes if API key fails or network error
    return {
      isCommercialTrigger: false,
      confidenceScore: 0,
      projectType: "Maintenance/Repair",
      tradeOpportunities: { securityIntegrator: false, signage: false, lowVoltageIT: false },
      extractedEntities: {},
      reasoning: "Analysis failed or API error.",
      category: "Unknown" as LeadCategory,
      salesPitch: "Could not analyze at this time.",
      urgency: "Low",
      estimatedValue: 0
    };
  }
};
