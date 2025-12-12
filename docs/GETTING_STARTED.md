# Getting Started with FinishOutNow

**Last Updated:** December 11, 2025  
**Status:** Production Ready

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+
- Git

### Installation

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Add your API keys to .env.local

# 3. Run development servers
npm run dev        # Frontend: http://localhost:3000
npm run dev:api    # Backend: http://localhost:3001

# Or run both:
npm run dev:full
```

### First Steps
1. Open http://localhost:3000
2. Click "Sign In" (use `dev@test.com` in development mode)
3. Click "Refresh Leads" to fetch permit data
4. Explore the dashboard and map views

---

## 📖 Documentation by Role

### 👨‍💻 **Developers (60 min)**
**Goal:** Understand the codebase and start contributing

1. **Architecture Overview** → [`docs/02_Architecture_and_Overview/01_DEVELOPER_HANDOFF.md`](./02_Architecture_and_Overview/01_DEVELOPER_HANDOFF.md)
2. **Project Status** → [`docs/02_Architecture_and_Overview/02_PROJECT_COMPLETION.md`](./02_Architecture_and_Overview/02_PROJECT_COMPLETION.md)
3. **AI Features** → [`docs/features/AI_FEATURES_QUICKSTART.md`](./features/AI_FEATURES_QUICKSTART.md)
4. **Data Pipeline** → [`docs/architecture/01_data_sources_and_ingestion.md`](./architecture/01_data_sources_and_ingestion.md)
5. **API Setup** → [`docs/05_Production_and_Deployment/03_Setup_and_Configuration/03_API_SETUP.md`](./05_Production_and_Deployment/03_Setup_and_Configuration/03_API_SETUP.md)

**Key Directories:**
- `/services` - Business logic, API integrations, AI services
- `/components` - React UI components
- `/hooks` - React hooks for state management
- `/api` - Backend proxy routes

---

### 🏗️ **Backend Engineers (90 min)**
**Goal:** Understand API integration, data pipeline, and deployment

1. **Backend Setup** → [`docs/05_Production_and_Deployment/03_Setup_and_Configuration/01_BACKEND_SETUP.md`](./05_Production_and_Deployment/03_Setup_and_Configuration/01_BACKEND_SETUP.md)
2. **API Configuration** → [`docs/05_Production_and_Deployment/03_Setup_and_Configuration/03_API_SETUP.md`](./05_Production_and_Deployment/03_Setup_and_Configuration/03_API_SETUP.md)
3. **Data Sources** → [`docs/architecture/01_data_sources_and_ingestion.md`](./architecture/01_data_sources_and_ingestion.md)
4. **Creative Signals** → [`docs/architecture/02_creative_signals_pipeline.md`](./architecture/02_creative_signals_pipeline.md)
5. **Firebase Setup** → [`docs/05_Production_and_Deployment/03_Setup_and_Configuration/04_FIREBASE_SETUP_GUIDE.md`](./05_Production_and_Deployment/03_Setup_and_Configuration/04_FIREBASE_SETUP_GUIDE.md)

**Key Files:**
- `api/dev-server.ts` - Local development API server
- `services/leadManager.ts` - Lead orchestration
- `services/ingestion/*` - City permit connectors
- `services/geminiService.ts` - AI analysis

---

### 🚀 **DevOps (30 min)**
**Goal:** Deploy and monitor the application

1. **Production Deployment** → [`docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md`](./deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)
2. **Backend Setup** → [`docs/05_Production_and_Deployment/03_Setup_and_Configuration/01_BACKEND_SETUP.md`](./05_Production_and_Deployment/03_Setup_and_Configuration/01_BACKEND_SETUP.md)
3. **Production Checklist** → [`docs/testing/PRODUCTION_READINESS_CHECKLIST.md`](./testing/PRODUCTION_READINESS_CHECKLIST.md)

**Key Files:**
- `vercel.json` - Vercel deployment config
- `.env.local` - Environment variables template
- `package.json` - Build scripts

---

### 👥 **Sales/Managers (20 min)**
**Goal:** Understand features, value proposition, and status

1. **Business Case** → [`docs/01_Getting_Started/02_BUSINESS_CASE.md`](./01_Getting_Started/02_BUSINESS_CASE.md)
2. **Sales Guide** → [`docs/01_Getting_Started/03_SALES_REP_GUIDE.md`](./01_Getting_Started/03_SALES_REP_GUIDE.md)
3. **Project Status** → [`docs/02_Architecture_and_Overview/02_PROJECT_COMPLETION.md`](./02_Architecture_and_Overview/02_PROJECT_COMPLETION.md)
4. **Brand/Pitch** → [`docs/Brand_Pitch_Deck.md`](./Brand_Pitch_Deck.md)

---

## 🎯 Core Features

### Data Ingestion
- **5 City Connectors**: Dallas, Fort Worth, Arlington, Plano, Irving
- **Real-time permit data** from government APIs
- **Creative signals**: TABC licenses, utility connections, zoning cases
- **Deduplication** and normalization

### AI/ML Features
- **Gemini AI analysis** of permit descriptions
- **Commercial trigger detection** (tenant improvements, certificates of occupancy)
- **Lead scoring** (0-100) based on project viability
- **Predictive insights** for lead quality

### Lead Management
- **Lead claiming** with status tracking
- **Appointment setting** with calendar integration
- **Alert preferences** for specific cities/project types
- **Firebase integration** for user data and lead persistence

### UI/UX
- **Interactive map** with permit clustering
- **Dashboard views**: List, Map, Analytics
- **Real-time filters** by city, status, score
- **Export to CSV** for CRM integration

---

## 🔧 Development

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Environment Variables
See [`.env.local`](./.env.local) for required variables:
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_DALLAS_API_KEY_*` - Dallas Open Data API credentials
- `VITE_DEV_MODE` - Enable development mode bypasses

---

## 📚 Full Documentation

Complete documentation available in [`docs/`](./docs/):
- **Architecture**: System design, data pipeline, AI features
- **Features**: AI implementation, creative signals, scoring
- **Testing**: Test reports, coverage, production readiness
- **Deployment**: Production guides, operations, monitoring
- **Implementation**: Completed tasks, connector status

See [`docs/README.md`](./docs/README.md) for full documentation index.

---

## 🆘 Troubleshooting

### Common Issues

**API calls failing (500 errors)**
```bash
# Make sure backend server is running
npm run dev:api
# Should show: "API Development Server" on port 3001
```

**Authentication failing**
```bash
# Development mode bypass is enabled by default
# Login with: dev@test.com (any password)
# Or check VITE_DEV_MODE=true in .env.local
```

**Styling/colors not loading**
```bash
# Restart dev server to reload environment
# Check that Tailwind CSS is building correctly
npm run dev
```

**No permit data**
```bash
# External APIs may be down - mock data will load automatically
# Check browser console for specific API errors
```

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Documentation**: See `docs/` folder
- **AI Agent Setup**: See [`docs/01_Getting_Started/04_AI_AGENT_IMPLEMENTATION.md`](./01_Getting_Started/04_AI_AGENT_IMPLEMENTATION.md)

---

**Status:** ✅ Production Ready | **Version:** 1.0.0 | **Last Updated:** December 11, 2025
