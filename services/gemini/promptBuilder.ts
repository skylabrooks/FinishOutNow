import { CompanyProfile } from "../../types";

/**
 * Builds the context prompt for Gemini API based on permit details and company profile.
 * Includes enhanced few-shot examples to improve accuracy of commercial trigger detection.
 * v2.0: Tier-based classification with better edge cases.
 */
export function buildPrompt(
  description: string,
  valuation: number,
  city: string,
  permitType: string,
  companyProfile?: CompanyProfile
): string {
  let prompt = `Analyze this ${permitType} permit description: "${description}" located in ${city}, TX with a total project valuation of $${valuation}.

Apply the Tier-based Vibe Coding rules. Examples below:

TIER 1 EXAMPLES - EXTREME CONFIDENCE (85-100):
1. "Tenant improvement for new Chipotle location - includes interior demolition, new electrical/plumbing for kitchen, POS system wiring, and customer badge access entry system"
   → TIER 1: CO/TI marker + business name + multiple systems → confidence: 92 | is_commercial_trigger: true
   
2. "Certificate of Occupancy work for suite 300 - new partition walls, cabling for IT infrastructure, and security access control system installation"
   → TIER 1: CO marker explicitly stated → confidence: 95 | is_commercial_trigger: true
   
3. "Build-out of 5,000 SF commercial space - includes new storefront glazing, interior demolition, electrical reconfiguration, fiber optic cabling, and security system rough-in. Valuation $350,000"
   → TIER 1: Build-out + storefront + multiple trades + high valuation → confidence: 90 | is_commercial_trigger: true

TIER 2 EXAMPLES - STRONG SIGNALS (60-79):
1. "Interior remodel for office space - selective demolition, new partition walls, painting, and flooring. General Contractor: ABC Construction. Valuation $75,000"
   → TIER 2: Remodel + partition walls + contractor named + mid valuation → confidence: 72 | is_commercial_trigger: true
   
2. "Storefront renovation including new facade, monument sign installation, and interior finish. Valuation $95,000"
   → TIER 2: Storefront + signage + finish work → confidence: 75 | is_commercial_trigger: true
   
3. "First generation tenant space improvements - electrical rough-in for server room, low voltage cabling infrastructure, and network closet buildout. Valuation $68,000"
   → TIER 2: 1st gen + IT infrastructure specifics → confidence: 78 | is_commercial_trigger: true

TIER 3 EXAMPLES - MODERATE SIGNALS (40-59):
1. "Office buildout including interior walls, electrical work, and painting. Valuation $35,000"
   → TIER 3: Buildout term present but minimal specific signals, lower valuation → confidence: 52 | is_commercial_trigger: true (buildout + valuation >$30K)
   
2. "Commercial space remodel - minor interior finish work, paint, and flooring. Valuation $28,000"
   → TIER 3: Remodel word but mostly cosmetic, below sweet spot → confidence: 45 | is_commercial_trigger: false

NEGATIVE EXAMPLES - WEAK/NONE (0-39):
1. "Roof replacement and HVAC maintenance on commercial building. Valuation $22,000"
   → None tier: Pure maintenance, no TI signals, low valuation → confidence: 18 | is_commercial_trigger: false
   
2. "Emergency repair to storm damage - roof tarping, water damage mitigation, temporary stabilization. Valuation $5,000"
   → None tier: Emergency + repair only → confidence: 5 | is_commercial_trigger: false
   
3. "Painting and landscaping for residential property. Valuation $3,000"
   → None tier: Residential + cosmetic → confidence: 3 | is_commercial_trigger: false
   
4. "HVAC unit replacement and electrical panel upgrade. Valuation $18,000"
   → Weak tier: Pure maintenance, no commercial TI signals → confidence: 22 | is_commercial_trigger: false

EDGE CASES & CONTEXT CLUES:
- "Paint" alone = low confidence. "Paint as part of office build-out" = high confidence.
- "Roof replacement" alone = maintenance. "New roof on new construction building" = part of TI.
- Generic "interior remodel" without valuation context = moderate. With $100K+ = strong.
- "Repair" = suspect. "Repair/upgrade as part of tenant improvement" = suspect turns positive.

---

Now apply this enhanced tier framework to the permit above. Be strategic:
- Use valuation as a tiebreaker when signals are mixed
- Co or TI keywords are golden signals
- Contractor and business names = high quality signal
- Set confidence based on tier + additional signal count`;

  if (companyProfile) {
    prompt += `
        
CRITICAL INSTRUCTION FOR "sales_pitch":
You are generating a lead specifically for:
- Company: ${companyProfile.name}
- Industry: ${companyProfile.industry}
- Contact Person: ${companyProfile.contactName}
- Value Proposition: "${companyProfile.valueProp}"

Customize the "sales_pitch" field to be a cold email opening line written by ${companyProfile.contactName} from ${companyProfile.name}.
Reference specific project details from the permit (e.g., "saw you're starting the suite 400 build-out", "noticed the new Chipotle location needs access control").
Keep it professional, direct, and under 2 sentences.`;
  }

  return prompt;
}
