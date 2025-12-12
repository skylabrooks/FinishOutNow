<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FinishOutNow

Advanced lead intelligence platform for commercial construction contractors, powered by AI and predictive analytics.

**Status:** ✅ Production Ready | **Last Updated:** December 9, 2025

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.local.example` to `.env.local` (if exists)
   - Set `API_KEY` to your Gemini API key

3. **Run locally:**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

4. **(Optional) Install map dependencies:**
   ```bash
   npm install leaflet react-leaflet
   ```

---

## 📖 Documentation

**🚀 Quick Start:** [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) — All roles start here

**Full docs:** [`docs/README.md`](./docs/README.md)

**Quick navigation by role:**
- **Developers:** Setup → Architecture → Features → API docs
- **Managers:** Business case → Status → Test results
- **DevOps:** Setup → Deployment → Operations

---

## ✨ Key Features

### AI-Powered Intelligence
- **Predictive Alerts** — Real-time lead matching with user preferences
- **Geospatial Clustering** — DBSCAN hotspot detection & heatmaps
- **Contractor Benchmarking** — Performance tracking with fuzzy matching
- **Network Recommendations** — GC-subcontractor matching
- **Project Probability** — ML-based start date predictions

### Creative Signals
- Early occupancy indicators (utility hookups)
- Pre-permit zoning cases
- Licensing signals (health, food, liquor)
- Eviction & vacancy detection
- Economic incentives & development announcements

### Lead Quality
- Multi-source data ingestion (6+ connectors)
- Intelligent normalization & deduplication
- Geocoding & geospatial enrichment
- Quality scoring & filtering

---

## 📊 Project Status

| Component | Status | Tests |
|-----------|--------|-------|
| AI Features | ✅ Complete (17 features) | 113/113 passing |
| Creative Signals | ✅ Production Ready | All endpoints verified |
| Lead Scoring | ✅ Production Ready | Full coverage |
| Geospatial | ✅ Production Ready | DBSCAN tested |
| Contractor Profiles | ✅ Production Ready | Fuzzy matching verified |

---

## 🛠️ Development

### Common Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run preview
npm run preview

# Run tests
npm test

# Run diagnostics
npm run diagnostics
```

### Project Structure

```
├── components/        ← React UI components
├── services/         ← Business logic & AI services
│   ├── aiFeatures.ts        ← AI integration hub
│   ├── geminiService.ts     ← Gemini API integration
│   ├── leadManager.ts       ← Lead orchestration
│   ├── ingestion/           ← Data connectors
│   ├── geospatial/          ← Clustering, heatmaps
│   ├── contractors/         ← Benchmarking
│   ├── network/             ← GC-sub recommendations
│   └── ml/                  ← Probability predictions
├── hooks/            ← Custom React hooks
├── utils/            ← Utility functions
├── types.ts          ← TypeScript definitions
└── docs/             ← Documentation
```

---

## 🔗 Integration Points

- **Gemini AI** — Lead analysis & recommendations
- **Nominatim** — Geocoding (cached client-side)
- **TX Comptroller** — Entity enrichment
- **ArcGIS** — Zoning case data
- **TABC** — Liquor licensing
- **Firebase** — Backend services

---

## 📚 Additional Resources

- **Architecture:** See `docs/architecture/`
- **Features:** See `docs/features/`
- **Implementation:** See `docs/implementation/`
- **Testing:** See `docs/testing/`
- **Deployment:** See `docs/deployment/`
- **Operations:** See `docs/operations/`

---

## 🎯 Next Steps

1. **Read:** `docs/README.md` (5 min overview)
2. **Setup:** Follow installation steps above
3. **Explore:** Check `docs/02_Architecture_and_Overview/`
4. **Code:** Review `services/` for feature details
5. **Test:** Run `npm test` for test suite

---

## 📞 Support

- Check `docs/` folder structure for guidance
- Review relevant README.md in each subfolder
- See `.github/copilot-instructions.md` for project conventions

---

**Production Ready** ✅ | **AI-Powered** 🤖 | **Open Source** 📖
