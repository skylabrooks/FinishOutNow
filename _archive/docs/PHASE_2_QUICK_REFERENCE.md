# Phase 2 Quick Reference Guide

Quick lookup for developers working with the refactored codebase.

---

## 🎨 Badge Components

### Usage:
```tsx
import { StatusBadge } from './components/badges/StatusBadge';
import { CategoryBadge } from './components/badges/CategoryBadge';
import { UrgencyBadge } from './components/badges/UrgencyBadge';

<StatusBadge status="active" />
<CategoryBadge category={LeadCategory.SECURITY} />
<UrgencyBadge urgency="High" showLabel={true} />
```

### Location:
- `components/badges/StatusBadge.tsx`
- `components/badges/CategoryBadge.tsx`
- `components/badges/UrgencyBadge.tsx`

---

## 🎣 Custom Hooks

### `useAcquiredLeads`
**Purpose:** Manage claimed leads data, filtering, sorting, and stats

```tsx
import { useAcquiredLeads } from '../hooks/useAcquiredLeads';

const {
  claimedLeads,      // Raw leads data
  loading,           // Loading state
  filter,            // Current filter
  setFilter,         // Set filter function
  sortBy,            // Current sort key
  setSortBy,         // Set sort function
  sortedLeads,       // Filtered and sorted leads
  stats,             // Calculated statistics
  loadClaimedLeads,  // Refresh function
} = useAcquiredLeads(businessId, permits, isOpen);
```

**Location:** `hooks/useAcquiredLeads.ts`

### `useScoringAnalytics`
**Purpose:** Process permit data for analytics charts

```tsx
import { useScoringAnalytics } from '../hooks/useScoringAnalytics';

const {
  analyzed,           // Filtered analyzed permits
  scoreDistribution,  // Score bins for histogram
  byPermitType,      // Avg scores by permit type
  byCity,            // Avg scores by city
  byCategory,        // Lead distribution by category
  stats,             // Overall analytics stats
  scoreTrend,        // Recent score timeline
} = useScoringAnalytics(permits);
```

**Location:** `hooks/useScoringAnalytics.ts`

---

## 🎨 Color & Style Utilities

### Import:
```tsx
import {
  getCategoryColor,
  getStatusColor,
  getUrgencyColor,
  getConfidenceScoreColor,
  CHART_COLORS,
} from '../utils/colorMappings';
```

### Usage:
```tsx
const categoryClass = getCategoryColor(LeadCategory.SECURITY);
// Returns: 'text-red-400 border-red-400 bg-red-900/20'

const statusClass = getStatusColor('active');
// Returns: 'bg-blue-500/20 text-blue-400 border-blue-500/30'

const urgencyClass = getUrgencyColor('High');
// Returns: 'text-red-400'

const scoreColor = getConfidenceScoreColor(85);
// Returns: '#10b981' (hex color)

const chartPalette = CHART_COLORS.primary;
// Returns: ['#10b981', '#f59e0b', ...]
```

**Location:** `utils/colorMappings.ts`

---

## 📊 Chart Components

### Basic Usage:
```tsx
import { ScoreDistributionChart } from '../components/charts/ScoreDistributionChart';
import { ScoreTrendChart } from '../components/charts/ScoreTrendChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { ScoreByGroup } from '../components/charts/ScoreByGroup';
import { StatsCards } from '../components/charts/StatsCards';
import { KeyInsights } from '../components/charts/KeyInsights';

// Get data from hook:
const { scoreDistribution, scoreTrend, byCategory, byPermitType, stats, analyzed } 
  = useScoringAnalytics(permits);

// Render charts:
<ScoreDistributionChart data={scoreDistribution} />
<ScoreTrendChart data={scoreTrend} />
<CategoryPieChart data={byCategory} />
<ScoreByGroup 
  title="Average Score by Permit Type"
  data={byPermitType}
  barColor="bg-blue-500"
  textColor="text-blue-300"
/>
<StatsCards stats={stats} analyzed={analyzed} />
<KeyInsights 
  byPermitType={byPermitType}
  byCity={byCity}
  byCategory={byCategory}
  stats={stats}
  analyzed={analyzed}
/>
```

### Chart Configuration:
```tsx
import {
  CHART_THEME,
  CHART_TOOLTIP_STYLE,
  CHART_GRID_PROPS,
  CHART_AXIS_PROPS,
} from '../utils/chartConfig';

// Use in custom Recharts components:
<CartesianGrid {...CHART_GRID_PROPS} />
<XAxis {...CHART_AXIS_PROPS} />
<Tooltip {...CHART_TOOLTIP_STYLE} />
```

**Locations:**
- `components/charts/*.tsx`
- `utils/chartConfig.ts`

---

## 📧 Email & Calendar Helpers

### Email Generation:
```tsx
import { generateEmailLink, copyToClipboard } from '../utils/emailHelpers';

// Generate mailto link:
const emailLink = generateEmailLink(permit, companyProfile);
window.location.href = emailLink;

// Copy text to clipboard:
const success = await copyToClipboard(salesPitch);
if (success) {
  alert('Copied!');
}
```

**Location:** `utils/emailHelpers.ts`

### Calendar Export:
```tsx
import { exportLeadToCalendar } from '../utils/calendarHelpers';

// Export as .ics file:
exportLeadToCalendar(permit);
```

**Location:** `utils/calendarHelpers.ts`

---

## 📄 CSV Export

### Export Claimed Leads:
```tsx
import { exportAcquiredLeadsCSV } from '../utils/csvExportHelpers';

exportAcquiredLeadsCSV(sortedLeads);
// Downloads: acquired_leads_YYYY-MM-DD.csv
```

### Export General Permits:
```tsx
import { exportPermitsCSV } from '../utils/csvExportHelpers';

exportPermitsCSV(filteredPermits);
// Downloads: permits_export_YYYY-MM-DD.csv
```

**Location:** `utils/csvExportHelpers.ts`

---

## 🧩 Analysis Modal Components

### Trade Opportunities:
```tsx
import { TradeOpportunities } from '../components/analysis/TradeOpportunities';

<TradeOpportunities 
  tradeOpportunities={permit.aiAnalysis.tradeOpportunities} 
/>
```

### Enrichment Verification:
```tsx
import { EnrichmentVerification } from '../components/analysis/EnrichmentVerification';

<EnrichmentVerification permit={permit} />
```

### Analysis Actions Panel:
```tsx
import { AnalysisActions } from '../components/analysis/AnalysisActions';

<AnalysisActions
  permit={permit}
  companyProfile={companyProfile}
  onRemoveClaimed={handleRemove}
  onClose={handleClose}
/>
```

**Location:** `components/analysis/*.tsx`

---

## 🎯 Common Patterns

### Adding a New Badge Type:
1. Create `components/badges/NewBadge.tsx`
2. Define props interface
3. Use `colorMappings` utility for colors
4. Export component

```tsx
import React from 'react';
import { getSomeColor } from '../../utils/colorMappings';

interface NewBadgeProps {
  value: string;
  className?: string;
}

export const NewBadge: React.FC<NewBadgeProps> = ({ value, className = '' }) => {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSomeColor(value)} ${className}`}>
      {value.toUpperCase()}
    </span>
  );
};
```

### Adding a New Chart:
1. Create `components/charts/NewChart.tsx`
2. Import chart config from `utils/chartConfig.ts`
3. Use Recharts with shared styling
4. Export component

```tsx
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { CHART_GRID_PROPS, CHART_AXIS_PROPS, CHART_TOOLTIP_STYLE } from '../../utils/chartConfig';

interface NewChartProps {
  data: any[];
}

export const NewChart: React.FC<NewChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Chart Title</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid {...CHART_GRID_PROPS} />
          <XAxis {...CHART_AXIS_PROPS} />
          <YAxis {...CHART_AXIS_PROPS} />
          <Tooltip {...CHART_TOOLTIP_STYLE} />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Adding a New Utility Function:
1. Identify the appropriate utility file (or create new one)
2. Add function with TypeScript types
3. Export function

```tsx
// In utils/someHelpers.ts
export const newHelperFunction = (param: string): string => {
  // Implementation
  return result;
};
```

---

## 🔍 Finding the Right Module

### Need to...
| Task | Module | Location |
|------|--------|----------|
| Display a status badge | `StatusBadge` | `components/badges/` |
| Show category badge | `CategoryBadge` | `components/badges/` |
| Get color for category | `getCategoryColor()` | `utils/colorMappings.ts` |
| Fetch claimed leads | `useAcquiredLeads` | `hooks/useAcquiredLeads.ts` |
| Process analytics data | `useScoringAnalytics` | `hooks/useScoringAnalytics.ts` |
| Export CSV | `exportAcquiredLeadsCSV()` | `utils/csvExportHelpers.ts` |
| Generate email link | `generateEmailLink()` | `utils/emailHelpers.ts` |
| Export to calendar | `exportLeadToCalendar()` | `utils/calendarHelpers.ts` |
| Display bar chart | `ScoreDistributionChart` | `components/charts/` |
| Display line chart | `ScoreTrendChart` | `components/charts/` |
| Display pie chart | `CategoryPieChart` | `components/charts/` |
| Style Recharts | `CHART_*` constants | `utils/chartConfig.ts` |

---

## 🐛 Troubleshooting

### Badge not showing correct color:
✅ **Check:** Import from `utils/colorMappings.ts`  
✅ **Verify:** Enum value matches (e.g., `LeadCategory.SECURITY`)

### Chart not rendering:
✅ **Check:** Data format matches chart component's expected interface  
✅ **Verify:** ResponsiveContainer has height/width  
✅ **Ensure:** Recharts is imported correctly

### Hook not updating:
✅ **Check:** Dependencies array in useEffect/useMemo  
✅ **Verify:** State is being set correctly  
✅ **Ensure:** Component is re-rendering

### CSV export not working:
✅ **Check:** Data array is not empty  
✅ **Verify:** Browser allows downloads  
✅ **Ensure:** Proper escaping of quotes in data

---

## 📝 Testing Checklist

When modifying refactored components:

- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] Props pass correct types
- [ ] Component renders without errors
- [ ] Styling appears as expected
- [ ] Interactions work (clicks, hovers, etc.)
- [ ] Data flows correctly through hooks
- [ ] Side effects execute properly (CSV download, calendar export, etc.)
- [ ] No console errors or warnings
- [ ] Responsive design maintained

---

## 🚀 Performance Tips

1. **Memoize expensive computations:** Use `useMemo` for data processing
2. **Lazy load charts:** Use `React.lazy()` for chart components if needed
3. **Debounce filters:** Add debouncing to filter/sort inputs
4. **Virtualize large lists:** Use react-window for 100+ items

---

**Last Updated:** December 8, 2025  
**Version:** Phase 2 Complete
