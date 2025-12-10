
import { GoogleGenAI } from "@google/genai";
import { AIAnalysisResult, LeadCategory, CompanyProfile } from "../types";
import { analysisSchema, systemInstruction } from "./gemini/schema";
import { buildPrompt } from "./gemini/promptBuilder";
import { mapGeminiResponse } from "./gemini/responseMapper";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
// Initialize with a placeholder - will fail gracefully if API key is missing
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzePermit = async (
    description: string, 
    valuation: number, 
    city: string, 
    permitType: string,
    companyProfile?: CompanyProfile
): Promise<AIAnalysisResult> => {
  // Check if API key is configured
  if (!ai) {
    console.warn('[Gemini] API key not configured. Returning default analysis.');
    return {
      category: LeadCategory.GENERAL,
      confidenceScore: 0,
      reasoning: 'AI analysis unavailable (API key not configured)',
      estimatedRevenue: valuation * 0.05,
      isCommercialTrigger: false,
      priority: 0,
      rawDescription: description,
      permitType,
      valuation
    };
  }

  const MAX_RETRIES = 3;
  let lastError: any;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const contextPrompt = buildPrompt(description, valuation, city, permitType, companyProfile);

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contextPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: analysisSchema
        }
      });

      const text = response.text;

      if (typeof text === "string" && text.trim().length > 0) {
        const raw = JSON.parse(text);
        return mapGeminiResponse(raw, description, permitType, valuation);
      }
      
      throw new Error("No response text from Gemini");

    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === MAX_RETRIES - 1;
      const isNetworkError = error instanceof Error && 
        (error.message.includes('fetch') || 
         error.message.includes('Network') || 
         error.message.includes('503') ||
         error.message.includes('timeout'));
      
      if (isLastAttempt || !isNetworkError) {
        break;
      }
      
      // Exponential backoff: 500ms, 1500ms, 4500ms
      const backoffMs = 500 * Math.pow(3, attempt);
      console.warn(`AI analysis attempt ${attempt + 1} failed, retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  console.error("Gemini Analysis Failed after retries:", lastError);
  // Fallback for demo purposes if API key fails or network error
  return {
    isCommercialTrigger: false,
    confidenceScore: 0,
    projectType: "Maintenance/Repair",
    tradeOpportunities: { securityIntegrator: false, signage: false, lowVoltageIT: false },
    extractedEntities: {},
    reasoning: "Analysis failed or API error.",
    category: LeadCategory.UNKNOWN,
    salesPitch: "Could not analyze at this time.",
    urgency: "Low",
    estimatedValue: 0
  };
};
