import { CompanyProfile } from "../../types";

/**
 * Builds the context prompt for Gemini API based on permit details and company profile.
 * Includes few-shot examples to improve accuracy of commercial trigger detection.
 */
export function buildPrompt(
  description: string,
  valuation: number,
  city: string,
  permitType: string,
  companyProfile?: CompanyProfile
): string {
  let prompt = `Analyze this ${permitType} permit description: "${description}" located in ${city}, TX with a total project valuation of $${valuation}.

CONTEXT AND EXAMPLES:

HIGH-CONFIDENCE COMMERCIAL TRIGGERS (Study these patterns):
1. "Tenant improvement for new coffee shop - includes new partition walls, electrical reconfiguration, and point-of-sale systems installation"
   → is_commercial_trigger: true | signal_strength: "Very Strong" | confidence_score: 85+
   
2. "Build-out of suite 400 for law office - new cabling, access control system, and network closet installation"
   → is_commercial_trigger: true | signal_strength: "Very Strong" | confidence_score: 90+
   
3. "First generation build-out for retail space - interior demolition, storefront glazing, and security system wiring"
   → is_commercial_trigger: true | signal_strength: "Very Strong" | confidence_score: 88+

MODERATE/LOW-CONFIDENCE CASES (Study these patterns):
1. "Roof replacement and HVAC maintenance on commercial building"
   → is_commercial_trigger: false | signal_strength: "Weak" | confidence_score: 15-25
   
2. "General maintenance and interior painting"
   → is_commercial_trigger: false | signal_strength: "None" | confidence_score: 5-10
   
3. "Emergency repair to storm damage"
   → is_commercial_trigger: false | signal_strength: "None" | confidence_score: 0-5

---

Now apply this framework to the permit provided and return a detailed analysis.`;

  if (companyProfile) {
    prompt += `
        
CRITICAL INSTRUCTION FOR "sales_pitch":
You are generating a lead specifically for:
- Company: ${companyProfile.name}
- Industry: ${companyProfile.industry}
- Contact Person: ${companyProfile.contactName}
- Value Proposition: "${companyProfile.valueProp}"

Customize the "sales_pitch" field to be a cold email opening line written by ${companyProfile.contactName} from ${companyProfile.name}.
It must specifically reference the project details (e.g., "saw you are starting the suite 400 buildout") and weave in the company's value proposition.
Keep it professional, direct, and under 2 sentences.`;
  }

  return prompt;
}
