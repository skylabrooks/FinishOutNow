/**
 * Reusable Recharts configuration and theme for consistent styling
 */

export const CHART_THEME = {
  backgroundColor: '#1e293b',
  borderColor: '#475569',
  textColor: '#f8fafc',
  gridColor: '#334155',
  tooltipBg: '#1e293b',
  tooltipBorder: '#475569',
  axisStroke: '#94a3b8',
};

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: CHART_THEME.tooltipBg,
    borderColor: CHART_THEME.tooltipBorder,
    color: CHART_THEME.textColor,
  },
};

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: CHART_THEME.gridColor,
  vertical: false,
};

export const CHART_AXIS_PROPS = {
  stroke: CHART_THEME.axisStroke,
};

export const CHART_BAR_RADIUS = [4, 4, 0, 0] as [number, number, number, number];
