import { LeadCategory } from "../../types";

/**
 * Comprehensive keyword sets for lead categorization with expanded trade-specific terms.
 */
const SECURITY_KEYWORDS = [
  "access control", "cctv", "camera", "surveillance", "alarm", "badge", "card reader", 
  "mag lock", "biometric", "security", "door hardware", "panic button", "intercom",
  "gate access", "turnstile", "bollard", "barrier", "secure", "protection"
];

const SIGNAGE_KEYWORDS = [
  "sign", "signage", "awning", "storefront", "facade", "banner", "glazing", "lettering",
  "monument sign", "channel letter", "neon", "pylon", "business sign", "wayfinding",
  "directional", "marquee", "canopy", "display", "exterior finish", "branding"
];

const LOW_VOLTAGE_KEYWORDS = [
  "cabling", "cat6", "fiber", "low voltage", "server room", "data drop", "it",
  "network", "closet", "infrastructure", "riser", "backbone", "cable tray", 
  "equipment room", "structured cabling", "fiber optic", "ethernet", "wi-fi",
  "wireless", "av", "audio visual", "video", "conferencing", "communication"
];

const GENERAL_TI_KEYWORDS = [
  "tenant improvement", "ti", "buildout", "build-out", "new occupancy", "certificate of occupancy",
  "co", "first generation", "white box", "shell", "demising walls", "partition walls",
  "new construction", "remodel", "renovation", "interior walls", "core and shell"
];

/**
 * Normalizes category values from the AI response to match dashboard expectations.
 */
export function normalizeCategory(value?: string): LeadCategory {
  if (!value) return LeadCategory.UNKNOWN;
  const v = value.toLowerCase();
  if (v.includes("security")) return LeadCategory.SECURITY;
  if (v.includes("signage")) return LeadCategory.SIGNAGE;
  if (v.includes("low voltage") || v.includes("it")) return LeadCategory.LOW_VOLTAGE;
  if (v.includes("general")) return LeadCategory.GENERAL;
  if (v.includes("unknown") || v.includes("uncategorized")) return LeadCategory.UNKNOWN;
  return LeadCategory.UNKNOWN;
}

/**
 * Categorizes a permit based on keyword hints in the description with expanded coverage.
 * Returns the strongest match based on keyword density.
 */
export function categorizeFromDescription(description: string, primaryCategory?: string): LeadCategory {
  const lowerDesc = description.toLowerCase();
  
  // Count matches for each category
  const securityCount = SECURITY_KEYWORDS.filter(k => lowerDesc.includes(k)).length;
  const signageCount = SIGNAGE_KEYWORDS.filter(k => lowerDesc.includes(k)).length;
  const lowVoltageCount = LOW_VOLTAGE_KEYWORDS.filter(k => lowerDesc.includes(k)).length;

  // Return the category with the most keyword matches
  if (securityCount > 0 && securityCount >= signageCount && securityCount >= lowVoltageCount) {
    return LeadCategory.SECURITY;
  }
  if (signageCount > 0 && signageCount >= lowVoltageCount) {
    return LeadCategory.SIGNAGE;
  }
  if (lowVoltageCount > 0) {
    return LeadCategory.LOW_VOLTAGE;
  }
  
  // Fallback to AI's primary category or general
  if (primaryCategory) {
    const normalized = normalizeCategory(primaryCategory);
    if (normalized !== LeadCategory.UNKNOWN) return normalized;
  }
  
  // Check for general TI signals
  if (GENERAL_TI_KEYWORDS.some(k => lowerDesc.includes(k))) {
    return LeadCategory.GENERAL;
  }
  
  return LeadCategory.UNKNOWN;
}

/**
 * Detects if a description or permit type indicates maintenance work.
 * Uses expanded maintenance-specific keywords.
 */
export function isMaintenanceLike(description: string, permitType: string): boolean {
  const maintenanceKeywords = [
    "maintenance", "repair", "replace hvac", "filter", "emergency",
    "patch", "fix", "swap", "roof replacement", "sewer line", "paving",
    "stucco", "parking lot", "reseal", "restore", "repaint", "upgrade"
  ];
  
  const lowerDesc = description.toLowerCase();
  const lowerType = permitType.toLowerCase();
  
  return maintenanceKeywords.some(k => lowerDesc.includes(k) || lowerType.includes(k));
}
