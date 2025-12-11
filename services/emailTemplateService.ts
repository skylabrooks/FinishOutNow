import { GoogleGenAI } from "@google/genai";
import { EnrichedPermit, CompanyProfile, LeadCategory } from "../types";

let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Email Template Generation Service
 * Generates high-converting first contact emails for commercial TI leads
 * Tailored for Security, Signage, and Low-Voltage IT contractors in DFW
 */

const EMAIL_GENERATION_PROMPT = `
You are an expert B2B sales copywriter specializing in Commercial Tenant Improvement (TI) projects in the Dallas-Fort Worth area. 
Your task is to write a compelling, personalized first contact email for a contractor reaching out to a prospective client.

CONTEXT:
- The contractor specializes in: {{CONTRACTOR_INDUSTRY}}
- The lead is for a Commercial TI project involving: {{PROJECT_DESCRIPTION}}
- Key opportunity areas: {{TRADE_OPPORTUNITIES}}
- Estimated project value: {{ESTIMATED_VALUE}}
- Location: {{CITY}}, TX
- Business/Tenant Name: {{TENANT_NAME}}

EMAIL REQUIREMENTS:
1. Subject line must be attention-grabbing and relevant (max 60 characters)
2. Opening must reference the specific permit/project to establish credibility
3. Clearly articulate value proposition based on the contractor's specialty
4. Include a soft call-to-action (CTA) for a brief discovery call
5. Professional yet conversational tone
6. Keep body under 150 words
7. Include placeholder for contractor's contact info [CONTRACTOR_NAME], [COMPANY_NAME], [PHONE], [WEBSITE]

OUTPUT FORMAT (JSON):
{
  "subject": "Subject line here",
  "body": "Email body here with all formatting and placeholders"
}

BEST PRACTICES FOR COMMERCIAL TI EMAILS:
- Reference the specific permit number or address to show you've done research
- Highlight time-sensitive nature if relevant (e.g., "noticed your Certificate of Occupancy filing")
- Focus on compliance, efficiency, and ROI
- For Security: emphasize access control, surveillance integration, code compliance
- For Signage: mention branding consistency, ADA compliance, expedited permitting
- For Low-Voltage IT: focus on infrastructure, network readiness, future-proofing

Generate the email now.
`;

interface EmailTemplate {
  subject: string;
  body: string;
}

/**
 * Generate a high-converting first contact email template
 */
export async function generateFirstContactEmail(
  lead: EnrichedPermit,
  companyProfile?: CompanyProfile
): Promise<EmailTemplate> {
  try {
    // Extract relevant data
    const tenantName = lead.aiAnalysis?.extractedEntities?.tenantName || lead.applicant || 'the business';
    const contractorIndustry = companyProfile?.industry || LeadCategory.GENERAL;
    const projectDescription = lead.description || lead.permitType;
    const city = lead.city;
    const estimatedValue = lead.aiAnalysis?.estimatedValue || lead.valuation || 0;
    
    // Determine trade opportunities
    const opportunities = lead.aiAnalysis?.tradeOpportunities;
    const tradeOpps: string[] = [];
    if (opportunities?.securityIntegrator) tradeOpps.push('Security & Access Control');
    if (opportunities?.signage) tradeOpps.push('Signage & Branding');
    if (opportunities?.lowVoltageIT) tradeOpps.push('IT & Low-Voltage Infrastructure');
    const tradeOpportunitiesText = tradeOpps.length > 0 ? tradeOpps.join(', ') : 'General Commercial Build-Out';

    // Build the prompt with real data
    const prompt = EMAIL_GENERATION_PROMPT
      .replace('{{CONTRACTOR_INDUSTRY}}', contractorIndustry)
      .replace('{{PROJECT_DESCRIPTION}}', projectDescription)
      .replace('{{TRADE_OPPORTUNITIES}}', tradeOpportunitiesText)
      .replace('{{ESTIMATED_VALUE}}', `$${estimatedValue.toLocaleString()}`)
      .replace('{{CITY}}', city)
      .replace('{{TENANT_NAME}}', tenantName);

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7, // Slightly creative but still professional
      }
    });

    const text = response.text;
    if (typeof text === "string" && text.trim().length > 0) {
      const parsed = JSON.parse(text) as EmailTemplate;
      
      // Validate response
      if (!parsed.subject || !parsed.body) {
        throw new Error("Invalid email template structure");
      }

      return {
        subject: parsed.subject,
        body: parsed.body
      };
    }

    throw new Error("No response from Gemini");

  } catch (error) {
    console.error("Email generation failed:", error);
    
    // Fallback template
    return generateFallbackEmailTemplate(lead, companyProfile);
  }
}

/**
 * Fallback email template if AI generation fails
 */
function generateFallbackEmailTemplate(
  lead: EnrichedPermit,
  companyProfile?: CompanyProfile
): EmailTemplate {
  const tenantName = lead.aiAnalysis?.extractedEntities?.tenantName || lead.applicant || 'your business';
  const city = lead.city;
  const permitType = lead.permitType;
  const address = lead.address;
  
  const subject = `Commercial ${permitType} Project - ${city}, TX`;
  
  const body = `Hi there,

I noticed ${tenantName}'s recent ${permitType.toLowerCase()} filing at ${address} in ${city}.

${companyProfile ? `At [COMPANY_NAME], we specialize in ${companyProfile.industry.toLowerCase()} for commercial tenant improvement projects throughout DFW.` : 'We specialize in commercial tenant improvement projects throughout DFW.'}

I'd love to discuss how we can support your project with expert service, competitive pricing, and on-time delivery.

Would you be open to a brief 15-minute call this week?

Best regards,
[CONTRACTOR_NAME]
[COMPANY_NAME]
[PHONE]
[WEBSITE]`;

  return { subject, body };
}

/**
 * Personalize email template with contractor details
 */
export function personalizeEmailTemplate(
  template: EmailTemplate,
  companyProfile?: CompanyProfile
): EmailTemplate {
  if (!companyProfile) return template;

  let body = template.body;
  
  // Replace placeholders with actual company info
  body = body.replace(/\[CONTRACTOR_NAME\]/g, companyProfile.contactName || '[Your Name]');
  body = body.replace(/\[COMPANY_NAME\]/g, companyProfile.name || '[Your Company]');
  body = body.replace(/\[PHONE\]/g, companyProfile.phone || '[Your Phone]');
  body = body.replace(/\[WEBSITE\]/g, companyProfile.website || '[Your Website]');

  return {
    subject: template.subject,
    body
  };
}
