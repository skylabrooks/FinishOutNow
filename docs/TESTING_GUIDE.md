# 🧪 FinishOutNow - End-to-End Testing Guide

## Overview

Comprehensive testing suite for the FinishOutNow Commercial Lead Intelligence Dashboard. Tests cover API endpoints, data pipeline, AI analysis, Firebase integration, and complete user workflows.

---

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# API endpoint tests
npm run test:api

# Integration tests (pipeline + AI)
npm run test:integration

# End-to-end workflow tests
npm run test:e2e

# With UI (interactive test viewer)
npm run test:ui

# With coverage report
npm run test:coverage
```

---

## 📁 Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── api/
│   └── endpoints.test.ts       # API proxy endpoint tests
├── integration/
│   ├── pipeline.test.ts        # Data pipeline tests
│   └── ai-analysis.test.ts     # AI analysis tests
├── e2e/
│   └── workflows.test.ts       # Complete user workflows
└── unit/
    ├── ingestion.test.ts       # City connector tests
    └── firebase.test.ts        # Firebase integration tests
```

---

## 🎯 Test Coverage

### API Endpoints (`tests/api/`)
- ✅ Dallas API proxy functionality
- ✅ Fort Worth API proxy functionality
- ✅ Health check endpoint
- ✅ Caching behavior (5-min TTL)
- ✅ Error handling (CORS, timeouts, invalid requests)
- ✅ Response schema validation
- ✅ HTTP method restrictions

### Data Pipeline (`tests/integration/pipeline.test.ts`)
- ✅ Lead aggregation from all sources
- ✅ Deduplication by permit ID
- ✅ City name normalization
- ✅ Permit type normalization
- ✅ Date normalization (YYYY-MM-DD)
- ✅ Geocoding with localStorage cache
- ✅ Entity enrichment (TX Comptroller)
- ✅ Concurrent request handling
- ✅ Performance benchmarks

### AI Analysis (`tests/integration/ai-analysis.test.ts`)
- ✅ Commercial trigger detection
- ✅ Confidence scoring (0-100)
- ✅ Category classification (Security/Signage/IT)
- ✅ Trade opportunity identification
- ✅ Sales pitch generation
- ✅ Custom pitch with company profile
- ✅ Schema validation (snake_case → camelCase)
- ✅ Error handling and fallbacks
- ✅ Empty/invalid input handling

### User Workflows (`tests/e2e/workflows.test.ts`)
- ✅ Full lead discovery (fetch → normalize → dedupe)
- ✅ Lead enrichment with AI analysis
- ✅ Geocoding and caching
- ✅ Filtering by city
- ✅ Sorting by valuation/confidence
- ✅ CSV export data preparation
- ✅ Email (mailto:) generation
- ✅ Calendar (.ics) export
- ✅ Company profile persistence
- ✅ Pipeline value calculation

### City Connectors (`tests/unit/ingestion.test.ts`)
- ✅ Dallas connector
- ✅ Fort Worth connector
- ✅ Arlington connector
- ✅ Plano connector
- ✅ Irving connector
- ✅ Data quality validation
- ✅ Unique ID enforcement

### Firebase Integration (`tests/unit/firebase.test.ts`)
- ✅ Lead claiming workflow
- ✅ Claim status checking
- ✅ User claims retrieval
- ✅ Local caching of claims
- ✅ Claim expiration (30-day)
- ✅ Visibility control (hide sensitive data until claimed)

---

## 🔧 Configuration

### Test Environment
Tests run in `happy-dom` environment (lightweight DOM for React testing).

**Environment Variables (Auto-Mocked):**
- `API_KEY` - Gemini API key (mocked in tests)
- `VITE_GEMINI_API_KEY` - Vite-exposed API key (mocked)

### Timeouts
- Default test timeout: **30 seconds**
- Hook timeout: **30 seconds**

Adjust in `vitest.config.ts` if needed.

---

## 📊 Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
```

### Coverage Output
- **Text** - Terminal summary
- **HTML** - `coverage/index.html` (open in browser)
- **JSON** - `coverage/coverage-final.json`

### Coverage Targets
| Area | Target | Current |
|------|--------|---------|
| Services | 80%+ | TBD |
| Components | 70%+ | TBD |
| API Routes | 90%+ | TBD |

---

## 🛠️ Writing New Tests

### Example: Unit Test
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../services/myService';

describe('My Service', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe('expected');
  });
});
```

### Example: Integration Test
```typescript
import { describe, it, expect } from 'vitest';
import { leadManager } from '../../services/leadManager';

describe('Integration - Lead Manager', () => {
  it('should fetch and enrich leads', async () => {
    const leads = await leadManager.fetchAllLeads();
    expect(leads.length).toBeGreaterThan(0);
  }, 30000);
});
```

### Example: API Test
```typescript
import { describe, it, expect } from 'vitest';

describe('API - Dallas Endpoint', () => {
  it('should return permits', async () => {
    const response = await fetch('http://localhost:3001/api/permits-dallas');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  }, 15000);
});
```

---

## 🐛 Debugging Tests

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Single Test File
```bash
npm test tests/api/endpoints.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- -t "Dallas"
```

### Verbose Output
```bash
npm test -- --reporter=verbose
```

### UI Mode (Interactive)
```bash
npm run test:ui
```
Opens browser with interactive test viewer at `http://localhost:51204`.

---

## 🔍 Common Issues & Solutions

### Issue: Tests Timeout
**Solution:** Increase timeout in test file:
```typescript
it('should complete', async () => {
  // ...
}, 60000); // 60 second timeout
```

### Issue: API Server Not Running
**Solution:** Start API server before running API tests:
```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run test:api
```

### Issue: Mock Data Not Working
**Solution:** Clear mocks in `beforeEach`:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
```

### Issue: localStorage Not Available
**Solution:** Already handled in `tests/setup.ts`. Check import:
```typescript
import '@testing-library/jest-dom';
```

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests pass: `npm test`
- [ ] Coverage meets targets: `npm run test:coverage`
- [ ] API tests pass with live endpoints
- [ ] Integration tests complete successfully
- [ ] E2E workflows execute without errors
- [ ] No console errors or warnings
- [ ] Performance benchmarks acceptable

---

## 🎯 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Vercel Integration
Add to `vercel.json`:
```json
{
  "buildCommand": "npm run build && npm test",
  "ignoreCommand": "npm test"
}
```

---

## 📚 Additional Resources

- **Vitest Docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/
- **MSW (API Mocking):** https://mswjs.io/
- **Happy DOM:** https://github.com/capricorn86/happy-dom

---

## 🤝 Contributing Tests

### Guidelines
1. **One assertion per test** (when possible)
2. **Descriptive test names** (`should fetch Dallas permits`, not `test1`)
3. **Use `beforeEach`** to reset state
4. **Mock external APIs** to avoid rate limits
5. **Test edge cases** (empty data, errors, timeouts)
6. **Add timeouts** for async tests

### Test Naming Convention
```
describe('Component/Service - Feature', () => {
  it('should do expected behavior', () => {
    // test code
  });
});
```

---

## 📝 Test Maintenance

### Regular Tasks
- [ ] Update tests when adding new features
- [ ] Remove tests for deprecated functionality
- [ ] Keep mocks synchronized with real APIs
- [ ] Review coverage reports monthly
- [ ] Update test timeouts as needed
- [ ] Refactor duplicate test code

---

## 📞 Support

**Issues with tests?**
1. Check test output for error messages
2. Run `npm run test:ui` for interactive debugging
3. Review `tests/setup.ts` for global configuration
4. Check `vitest.config.ts` for test settings

**Questions?**
- Check existing tests for examples
- Review Vitest documentation
- Open an issue in the repository

---

**Last Updated:** December 7, 2025  
**Test Suite Version:** 1.0  
**Total Tests:** 100+ across all suites
