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
 * Common tenant/business names to identify from descriptions.
 * High-value leads when we can identify the actual business.
 */
const TENANT_NAMES = [
  "chipotle", "starbucks", "subway", "mcdonalds", "burger king", "taco bell", "wendy's",
  "dunkin", "panera", "chick-fil-a", "popeyes", "kfc", "pizza hut", "dominoes",
  "best buy", "target", "walmart", "dollar store", "dollar general",
  "bank of america", "wells fargo", "chase", "citibank", "pnc", "tdbank",
  "planet fitness", "la fitness", "anytime fitness", "gold's gym",
  "urgent care", "cvs", "walgreens", "rite aid", "dental", "medical",
  "salon", "barber", "spa", "gym", "fitness", "office", "law firm", "accounting"
];

/**
 * Extracts contractor name from permit description.
 * Looks for patterns like "General Contractor: Company Name" or "GC: Name"
 */
export function extractContractorName(description: string): string | undefined {
  const patterns = [
    /general\s+contractor[:\s]+([A-Z][^,.\n]+(?:[,.]?\s*(?:Inc|LLC|Ltd|Co|Corp|Group|L\.L\.C\.|P\.C\.))?)/i,
    /gc[:\s]+([A-Z][^,.\n]+(?:[,.]?\s*(?:Inc|LLC|Ltd|Co|Corp|Group|L\.L\.C\.|P\.C\.))?)/i,
    /contractor[:\s]+([A-Z][^,.\n]+(?:[,.]?\s*(?:Inc|LLC|Ltd|Co|Corp|Group|L\.L\.C\.|P\.C\.))?)/i,
    /contractor\s+name[:\s]+([A-Z][^,.\n]+(?:[,.]?\s*(?:Inc|LLC|Ltd|Co|Corp|Group|L\.L\.C\.|P\.C\.))?)/i,
    /(?:performed\s+)?by\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Construction|Builders|Contractors|Inc|LLC|Ltd|Co|Corp|Group))/i
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      let name = match[1]
        .trim()
        .replace(/\.$/, '')  // Remove trailing period
        .replace(/\s+as\s+general.*$/i, '')  // Remove "as general contractor" suffix
        .trim();
      
      // Filter out common false positives
      if (name.length > 2 && name.length < 100 && !name.includes("\\") && name !== "Name") {
        return name;
      }
    }
  }
  
  return undefined;
}

/**
 * Extracts tenant/business name from permit description.
 * Identifies if description mentions a named franchise or business.
 * v2: Prioritizes explicit "Tenant:" patterns over generic keyword matches.
 */
export function extractTenantName(description: string): string | undefined {
  const lowerDesc = description.toLowerCase();
  
  // FIRST: Check for explicit tenant mentions (highest priority)
  const tenantPatterns = [
    /tenant[:\s]*([A-Z][^,.\n]+(?:[,.]?\s*(?:Inc|LLC|Ltd|L\.L\.P\.|P\.C\.))?)/i,
    /for\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:location|space|site|suite)/i,
    /new\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:location|restaurant)/i,
  ];
  
  for (const pattern of tenantPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      let name = match[1]
        .trim()
        .replace(/\.$/, '')  // Remove trailing period
        .replace(/\s+Suite.*$/i, '');  // Remove suite mentions
      
      // Filter out generic words that shouldn't be tenant names
      const genericWords = ['office', 'space', 'suite', 'location', 'restaurant'];
      if (!genericWords.includes(name.toLowerCase()) && name.length > 2) {
        return name;
      }
    }
  }
  
  // SECOND: Check for well-known tenant names (only if no explicit pattern found)
  // Filter out overly generic terms from keyword matching
  const specificTenants = TENANT_NAMES.filter(t => 
    !['office', 'spa', 'salon', 'barber', 'gym', 'fitness'].includes(t.toLowerCase())
  );
  
  for (const tenant of specificTenants) {
    const tenantLower = tenant.toLowerCase();
    if (lowerDesc.includes(tenantLower)) {
      // Return JUST the tenant name, not the full description
      // Capitalize properly
      return tenant
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }
  
  return undefined;
}

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
 * v2.0: Improved weighting for trade-specific signals.
 */
export function categorizeFromDescription(description: string, primaryCategory?: string): LeadCategory {
  const lowerDesc = description.toLowerCase();
  
  // Count matches for each category with slight weighting
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
