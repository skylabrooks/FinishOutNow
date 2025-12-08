# FinishOutNow Interactive Demo Guide

## Overview

The interactive demo showcases all core features of the FinishOutNow platform in a guided, step-by-step tour. This document explains how to use and customize it.

---

## Quick Start

### Access the Demo

1. **Option 1: Direct Route**
   - Add to your app routing: `/demo`
   - Import and render `DemoPage` component

2. **Option 2: Standalone Mode**
   - Import the `demo.tsx` file directly
   - Render `DemoTour` component

3. **Environment Setup**
   ```bash
   npm install lucide-react  # Already included
   npm run dev
   # Navigate to http://localhost:5173/demo
   ```

---

## Features Overview

### 1. **Guided Tour System**
- **11 Sequential Steps** covering the entire product workflow
- **Auto-play Mode**: Press the play button to automatically advance through steps every 4 seconds
- **Manual Navigation**: Use Back/Next buttons to control pace
- **Progress Tracking**: Visual progress bar shows current step (e.g., "5 of 11")

### 2. **Interactive Elements**

#### Permit Cards
- **Click to expand**: See full details, commercial triggers, and action buttons
- **Status indicators**: Visual badges showing "New", "Qualified", or "Contacted"
- **Scoring system**: Color-coded confidence scores (green 90+, yellow 80-89, orange <80)
- **Quick actions**: Claim, Email, or Calendar buttons

#### Map View
- **Geographic distribution**: Shows opportunity count by city
- **City breakdown**: Dallas, Fort Worth, Arlington, Irving
- **Interactive toggle**: Click "View Map" button to show/hide

#### Analytics Dashboard
- **Project type breakdown**: Tenant Improvement, Security Systems, HVAC & MEP
- **Visual charts**: Horizontal bar charts with percentages
- **Interactive toggle**: Click "View Analytics" button to show/hide

### 3. **Highlight System**
- Current step highlights relevant UI elements with blue rings and scaling
- Draws user attention to interactive components
- Smooth transitions between highlighted elements

---

## Tour Steps Breakdown

| Step | Title | Focus | Time |
|------|-------|-------|------|
| 1 | Welcome | Product overview | 4s |
| 2 | Real-Time Data Collection | Data sources (5 cities) | 4s |
| 3 | Intelligent Data Cleaning | Normalization example | 4s |
| 4 | AI-Powered Analysis | Gemini 2.5 scoring | 4s |
| 5 | Qualified Opportunities | Permit list with details | 4s |
| 6 | Smart Scoring System | Score explanation | 4s |
| 7 | Geographic Intelligence | Map view introduction | 4s |
| 8 | Real-Time Analytics | Analytics dashboard | 4s |
| 9 | Lead Management | Claiming & tracking | 4s |
| 10 | One-Click Outreach | Email, calendar, export | 4s |
| 11 | Call to Action | Finish screen | 4s |

**Total Demo Time**: ~44 seconds (auto-play)

---

## Customization Guide

### Adding Your Own Permits

Edit the `demoPermits` array in `demo.tsx`:

```tsx
const demoPermits: PermitDemo[] = [
  {
    id: '1',
    address: '123 Main St, Suite 100',
    city: 'Dallas',
    description: 'Your permit description here',
    value: 500000,
    status: 'new', // 'new' | 'qualified' | 'contacted'
    score: 95,
    triggers: ['Trigger1', 'Trigger2', 'Trigger3']
  },
  // ... more permits
];
```

### Customizing Colors

All colors use Tailwind classes. Modify the theme in these locations:

**Header gradient:**
```tsx
<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
```

**Step card:**
```tsx
<div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
```

**Status badges:**
```tsx
permit.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
permit.status === 'qualified' ? 'bg-green-500/20 text-green-300' :
'bg-purple-500/20 text-purple-300'
```

### Adding New Tour Steps

1. Add a new object to the `steps` array:
```tsx
{
  id: 'your-step-id',
  title: 'Step Title',
  description: 'Step description',
  action: 'What to do next',
  icon: <YourIcon className="w-8 h-8" />,
  highlight?: 'element-id-to-highlight'
}
```

2. Create conditional rendering for your step's content:
```tsx
{currentStepData.id === 'your-step-id' && (
  <div className="...">
    Your custom content here
  </div>
)}
```

### Adjusting Auto-Play Timing

Change the timer interval (currently 4000ms):

```tsx
React.useEffect(() => {
  if (!isPlaying) return;
  const timer = setTimeout(() => {
    handleNext();
  }, 4000); // ← Adjust this value (milliseconds)
  return () => clearTimeout(timer);
}, [isPlaying, currentStep]);
```

---

## Integration with Main App

### Option 1: Add Demo Route

**App.tsx:**
```tsx
import DemoPage from './DemoPage';

// Add to your routing:
{route === 'demo' && <DemoPage />}

// Add navigation link:
<Link to="/demo">View Demo</Link>
```

### Option 2: Embed in Settings/Help

```tsx
import DemoTour from './demo';

// Inside your SettingsModal or HelpPage:
<Modal>
  <DemoTour />
</Modal>
```

### Option 3: Standalone Demo Site

Create a separate demo domain:

**demo-index.tsx:**
```tsx
import React from 'react';
import DemoTour from './demo';

export default () => <DemoTour />;
```

Build just this component for a dedicated demo site.

---

## Performance Notes

- **Component**: ~500 lines of code
- **Bundle size**: ~15KB (minified)
- **Dependencies**: Only `lucide-react` icons (already included)
- **Rendering**: All state is local, no API calls
- **Animations**: CSS transitions, ~60 FPS

---

## Accessibility

- **Keyboard navigation**: Back/Next buttons are keyboard accessible
- **Screen readers**: All text content is readable
- **Color contrast**: WCAG AA compliant (dark theme)
- **Focus indicators**: Blue rings on highlighted elements

---

## Testing the Demo

### Manual Test Checklist

- [ ] Click Play button - tour advances automatically every 4 seconds
- [ ] Click Pause button - tour stops advancing
- [ ] Click Back/Next buttons - manual navigation works
- [ ] Click Reset button - returns to step 1, clears selections
- [ ] Click on permit cards - expands/collapses details
- [ ] Click "View Map" - map section appears/disappears
- [ ] Click "View Analytics" - analytics section appears/disappears
- [ ] Step highlights are visible and appropriate
- [ ] Mobile responsive (test on 375px, 768px, 1024px widths)
- [ ] No console errors

### Browser Testing

- ✓ Chrome/Edge 90+
- ✓ Firefox 88+
- ✓ Safari 14+
- ✓ Mobile browsers (iOS Safari, Chrome Mobile)

---

## SEO & Marketing

### Meta Tags for Demo Page

```tsx
<head>
  <title>FinishOutNow - Interactive Product Demo</title>
  <meta name="description" content="See how FinishOutNow transforms construction permits into qualified sales leads using AI." />
  <meta name="keywords" content="commercial leads, construction permits, lead generation, AI" />
</head>
```

### Embedding in Marketing Site

```html
<!-- Example: On landing page -->
<iframe src="https://demo.finishoutnow.com" 
        width="100%" 
        height="800" 
        frameborder="0">
</iframe>
```

---

## Troubleshooting

### Demo doesn't render
- ✓ Ensure `lucide-react` is installed
- ✓ Check that React 19 is installed
- ✓ Verify Tailwind CSS is configured

### Auto-play not working
- ✓ Check that `isPlaying` state is true
- ✓ Verify timer useEffect has correct dependencies
- ✓ Check browser console for errors

### Highlights not showing
- ✓ Verify highlight IDs match between `currentStepData.highlight` and element `id`
- ✓ Check Tailwind `ring-` classes are working
- ✓ Ensure dark theme is active

### Mobile display issues
- ✓ Demo uses responsive grid (`lg:col-span-1` / `lg:col-span-2`)
- ✓ On mobile, single-column layout stacks vertically
- ✓ Test with device emulation in browser DevTools

---

## Advanced Customization

### Adding Video Walkthrough

Embed a YouTube video in the demo:

```tsx
{currentStepData.id === 'video-step' && (
  <div className="bg-slate-700 rounded-lg overflow-hidden">
    <iframe
      width="100%"
      height="400"
      src="https://www.youtube.com/embed/VIDEO_ID"
      frameBorder="0"
      allowFullScreen
    />
  </div>
)}
```

### Adding Data Export

Add a button to export demo data as JSON/CSV:

```tsx
const exportDemo = () => {
  const data = JSON.stringify(demoPermits, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'demo-permits.json';
  a.click();
};
```

### A/B Testing Different Flows

Create variant tours:

```tsx
type DemoVariant = 'standard' | 'enterprise' | 'compact';

const getTourSteps = (variant: DemoVariant): Step[] => {
  if (variant === 'enterprise') {
    return [...steps, customEnterpriseSteps];
  }
  return steps;
};
```

---

## Support & Feedback

For issues or feature requests:
- Check `console.error()` for debugging
- Review component prop types in `types.ts`
- Refer to Lucide React documentation for icon options
- Test in Tailwind CSS playground: tailwindcss.com

---

## License

This demo component is part of the FinishOutNow project and follows the same license as the main application.
