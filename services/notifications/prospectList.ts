/**
 * Prospect List Service
 * Generates and delivers weekly prospect lists to users
 */

import { 
  EnrichedPermit, 
  ProspectListItem, 
  UserPreferences,
  GCSubRelationship,
  SubcontractorRecommendation 
} from '../../types';
import { filterLeadsByPreferences } from '../alerts/alertQueue';
import { generateRecommendations } from '../network/relationshipGraph';

/**
 * Generate prospect list for a user
 */
export function generateProspectList(
  leads: EnrichedPermit[],
  preferences: UserPreferences,
  relationships: GCSubRelationship[],
  minLeadScore: number = 60
): ProspectListItem[] {
  // Filter leads by user preferences
  const matchedLeads = filterLeadsByPreferences(leads, preferences);

  // Further filter by lead score
  const qualifiedLeads = matchedLeads.filter(
    lead => (lead.leadScore ?? 0) >= minLeadScore
  );

  // Sort by lead score descending
  const sortedLeads = qualifiedLeads.sort((a, b) => 
    (b.leadScore ?? 0) - (a.leadScore ?? 0)
  );

  // Generate prospect items with recommendations
  const prospectItems: ProspectListItem[] = [];

  for (const lead of sortedLeads) {
    const recommendations = generateRecommendations(lead, relationships, 30);

    prospectItems.push({
      leadId: lead.id,
      lead,
      recommendations,
      generatedAt: new Date().toISOString()
    });
  }

  return prospectItems;
}

/**
 * Generate weekly digest summary
 */
export interface WeeklyDigest {
  weekOf: string;
  totalLeads: number;
  avgLeadScore: number;
  totalValuation: number;
  topOpportunities: ProspectListItem[];
  categoryBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
}

export function generateWeeklyDigest(
  prospectList: ProspectListItem[],
  topN: number = 10
): WeeklyDigest {
  if (prospectList.length === 0) {
    return {
      weekOf: new Date().toISOString(),
      totalLeads: 0,
      avgLeadScore: 0,
      totalValuation: 0,
      topOpportunities: [],
      categoryBreakdown: {},
      cityBreakdown: {}
    };
  }

  let totalScore = 0;
  let scoreCount = 0;
  let totalValuation = 0;
  const categoryBreakdown: Record<string, number> = {};
  const cityBreakdown: Record<string, number> = {};

  for (const item of prospectList) {
    const lead = item.lead;

    if (lead.leadScore !== undefined) {
      totalScore += lead.leadScore;
      scoreCount++;
    }

    totalValuation += lead.valuation;

    if (lead.aiAnalysis?.category) {
      const cat = lead.aiAnalysis.category;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }

    cityBreakdown[lead.city] = (cityBreakdown[lead.city] || 0) + 1;
  }

  return {
    weekOf: new Date().toISOString(),
    totalLeads: prospectList.length,
    avgLeadScore: scoreCount > 0 ? totalScore / scoreCount : 0,
    totalValuation,
    topOpportunities: prospectList.slice(0, topN),
    categoryBreakdown,
    cityBreakdown
  };
}

/**
 * Format prospect list as HTML email
 */
export function formatProspectListEmail(
  digest: WeeklyDigest,
  userName: string = 'there'
): string {
  const weekDate = new Date(digest.weekOf).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #2c3e50; }
    .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
    .lead-card { background: #ffffff; border: 1px solid #dee2e6; padding: 16px; margin: 12px 0; border-radius: 8px; }
    .lead-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
    .lead-score { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px; }
    .recommendations { background: #e9ecef; padding: 12px; margin-top: 12px; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Weekly Prospect Report</h1>
      <p>Week of ${weekDate}</p>
    </div>

    <div style="padding: 20px; background: white;">
      <p>Hi ${userName},</p>
      <p>Here's your personalized weekly digest of construction leads matching your criteria.</p>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${digest.totalLeads}</div>
          <div class="stat-label">Total Leads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${digest.avgLeadScore.toFixed(1)}</div>
          <div class="stat-label">Avg Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${(digest.totalValuation / 1000000).toFixed(1)}M</div>
          <div class="stat-label">Total Value</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${digest.topOpportunities.length}</div>
          <div class="stat-label">Top Opportunities</div>
        </div>
      </div>

      <h2>Top Opportunities</h2>
`;

  for (const item of digest.topOpportunities) {
    const lead = item.lead;
    const scoreColor = (lead.leadScore ?? 0) >= 80 ? '#28a745' : 
                      (lead.leadScore ?? 0) >= 60 ? '#ffc107' : '#fd7e14';

    html += `
      <div class="lead-card">
        <div class="lead-title">
          ${lead.city} - ${lead.permitType}
          <span class="lead-score" style="background: ${scoreColor}">
            ${lead.leadScore ?? 0} pts
          </span>
        </div>
        <p><strong>Valuation:</strong> $${lead.valuation.toLocaleString()}</p>
        <p><strong>Applied:</strong> ${new Date(lead.appliedDate).toLocaleDateString()}</p>
        ${lead.aiAnalysis ? `
          <p><strong>Category:</strong> ${lead.aiAnalysis.category}</p>
          <p><strong>Sales Pitch:</strong> ${lead.aiAnalysis.salesPitch}</p>
        ` : ''}
        
        ${item.recommendations.length > 0 ? `
          <div class="recommendations">
            <strong>Recommended Subcontractors:</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
              ${item.recommendations.slice(0, 3).map(rec => `
                <li>${rec.subName} (${rec.relevanceScore} score) - ${rec.reason}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  html += `
      <h3>Breakdown by Category</h3>
      <ul>
        ${Object.entries(digest.categoryBreakdown).map(([cat, count]) => `
          <li>${cat}: ${count} leads</li>
        `).join('')}
      </ul>

      <h3>Breakdown by City</h3>
      <ul>
        ${Object.entries(digest.cityBreakdown).map(([city, count]) => `
          <li>${city}: ${count} leads</li>
        `).join('')}
      </ul>
    </div>

    <div class="footer">
      <p>This is an automated weekly digest from FinishOutNow</p>
      <p>To update your preferences, log in to your dashboard</p>
    </div>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Format prospect list as plain text
 */
export function formatProspectListText(
  digest: WeeklyDigest,
  userName: string = 'there'
): string {
  const weekDate = new Date(digest.weekOf).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  let text = `
WEEKLY PROSPECT REPORT
Week of ${weekDate}

Hi ${userName},

Here's your personalized weekly digest of construction leads.

SUMMARY
-------
Total Leads: ${digest.totalLeads}
Average Score: ${digest.avgLeadScore.toFixed(1)}
Total Valuation: $${(digest.totalValuation / 1000000).toFixed(1)}M
Top Opportunities: ${digest.topOpportunities.length}

TOP OPPORTUNITIES
-----------------
`;

  for (let i = 0; i < digest.topOpportunities.length; i++) {
    const item = digest.topOpportunities[i];
    const lead = item.lead;

    text += `
${i + 1}. ${lead.city} - ${lead.permitType} (Score: ${lead.leadScore ?? 0})
   Valuation: $${lead.valuation.toLocaleString()}
   Applied: ${new Date(lead.appliedDate).toLocaleDateString()}
`;

    if (lead.aiAnalysis) {
      text += `   Category: ${lead.aiAnalysis.category}\n`;
      text += `   ${lead.aiAnalysis.salesPitch}\n`;
    }

    if (item.recommendations.length > 0) {
      text += `   Recommended Subcontractors:\n`;
      for (const rec of item.recommendations.slice(0, 3)) {
        text += `   - ${rec.subName} (${rec.relevanceScore} score)\n`;
      }
    }
  }

  text += `
CATEGORY BREAKDOWN
------------------
`;
  for (const [cat, count] of Object.entries(digest.categoryBreakdown)) {
    text += `${cat}: ${count} leads\n`;
  }

  text += `
CITY BREAKDOWN
--------------
`;
  for (const [city, count] of Object.entries(digest.cityBreakdown)) {
    text += `${city}: ${count} leads\n`;
  }

  text += `
---
This is an automated weekly digest from FinishOutNow
To update your preferences, log in to your dashboard
`;

  return text;
}
