/**
 * Analytics module for tracking AI analysis quality metrics.
 * Helps identify patterns and improve analysis accuracy over time.
 */

export interface AnalysisMetric {
  timestamp: number;
  permitId: string;
  description: string;
  valuation: number;
  isCommercialTrigger: boolean;
  confidenceScore: number;
  signalStrength?: string;
  positiveSignalsCount: number;
  negativeSignalsCount: number;
  tradeOpportunitiesMatched: number;
  category: string;
  urgency: string;
}

export interface MetricsAggregate {
  totalAnalyses: number;
  averageConfidenceScore: number;
  commercialTriggerRate: number;
  averageTradeOpportunities: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
  signalStrengthDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
}

const STORAGE_KEY = "finishoutnow_analysis_metrics_v1";
const MAX_STORED_METRICS = 500; // Keep last 500 analyses

class AnalysisMetricsService {
  /**
   * Records an analysis result for tracking and improvement.
   * Automatically manages storage size to prevent excessive usage.
   */
  recordAnalysis(metric: AnalysisMetric): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const existing = this.getStoredMetrics();
      existing.push(metric);

      // Keep only the most recent entries
      const toStore = existing.slice(-MAX_STORED_METRICS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.warn("Failed to store analysis metric:", error);
    }
  }

  /**
   * Retrieves all stored metrics from localStorage.
   */
  getStoredMetrics(): AnalysisMetric[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to retrieve stored metrics:", error);
      return [];
    }
  }

  /**
   * Generates aggregate statistics from stored metrics.
   * Useful for monitoring analysis quality trends.
   */
  getAggregateMetrics(): MetricsAggregate {
    const metrics = this.getStoredMetrics();

    if (metrics.length === 0) {
      return {
        totalAnalyses: 0,
        averageConfidenceScore: 0,
        commercialTriggerRate: 0,
        averageTradeOpportunities: 0,
        highConfidenceCount: 0,
        lowConfidenceCount: 0,
        signalStrengthDistribution: {},
        categoryDistribution: {},
        urgencyDistribution: {}
      };
    }

    const commercialCount = metrics.filter(m => m.isCommercialTrigger).length;
    const avgConfidence = metrics.reduce((sum, m) => sum + m.confidenceScore, 0) / metrics.length;
    const avgOpportunities = metrics.reduce((sum, m) => sum + m.tradeOpportunitiesMatched, 0) / metrics.length;

    const signalDistribution: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};
    const urgencyDistribution: Record<string, number> = {};

    metrics.forEach(m => {
      if (m.signalStrength) {
        signalDistribution[m.signalStrength] = (signalDistribution[m.signalStrength] || 0) + 1;
      }
      categoryDistribution[m.category] = (categoryDistribution[m.category] || 0) + 1;
      urgencyDistribution[m.urgency] = (urgencyDistribution[m.urgency] || 0) + 1;
    });

    return {
      totalAnalyses: metrics.length,
      averageConfidenceScore: Math.round(avgConfidence),
      commercialTriggerRate: Math.round((commercialCount / metrics.length) * 100),
      averageTradeOpportunities: Math.round(avgOpportunities * 100) / 100,
      highConfidenceCount: metrics.filter(m => m.confidenceScore >= 75).length,
      lowConfidenceCount: metrics.filter(m => m.confidenceScore < 35).length,
      signalStrengthDistribution: signalDistribution,
      categoryDistribution: categoryDistribution,
      urgencyDistribution: urgencyDistribution
    };
  }

  /**
   * Clears all stored metrics.
   * Useful for testing or resetting analytics.
   */
  clearMetrics(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Exports metrics as CSV for external analysis.
   */
  exportMetricsAsCSV(): string {
    const metrics = this.getStoredMetrics();

    if (metrics.length === 0) return "No metrics to export";

    const headers = [
      "Timestamp",
      "Permit ID",
      "Is Commercial",
      "Confidence Score",
      "Signal Strength",
      "Positive Signals",
      "Negative Signals",
      "Trade Opportunities",
      "Category",
      "Urgency",
      "Valuation"
    ];

    const rows = metrics.map(m => [
      new Date(m.timestamp).toISOString(),
      m.permitId,
      m.isCommercialTrigger ? "Yes" : "No",
      m.confidenceScore,
      m.signalStrength || "N/A",
      m.positiveSignalsCount,
      m.negativeSignalsCount,
      m.tradeOpportunitiesMatched,
      m.category,
      m.urgency,
      m.valuation
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${v}"`).join(","))
    ].join("\n");

    return csv;
  }
}

export const analysisMetricsService = new AnalysisMetricsService();
