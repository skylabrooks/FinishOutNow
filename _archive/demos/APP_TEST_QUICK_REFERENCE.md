# App.tsx Testing Quick Reference

## Test File Location
`tests/unit/App.test.tsx`

## Test Statistics
- ✅ **17 tests passing**
- **0 tests failing**
- Execution time: ~483ms

## Running Tests

### Run the App.tsx tests only
```bash
npm test -- tests/unit/App.test.tsx --run
```

### Run in watch mode (for development)
```bash
npm test -- tests/unit/App.test.tsx
```

### Run with UI viewer
```bash
npm test:ui
```

### Run all tests
```bash
npm test
```

### Run with coverage report
```bash
npm test:coverage
```

## Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| Rendering | 4 | ✅ All Pass |
| View Modes | 2 | ✅ All Pass |
| Modals | 2 | ✅ All Pass |
| CSV Export | 2 | ✅ All Pass |
| Error Handling | 1 | ✅ Pass |
| Feature Flags | 1 | ✅ Pass |
| Keyboard Navigation | 2 | ✅ All Pass |
| Data Flow | 2 | ✅ All Pass |
| Cleanup | 1 | ✅ Pass |

## Key Test Coverage

### Verified Features
- ✅ Component rendering and layout
- ✅ Navigation controls (sidebar, navbar, toolbar)
- ✅ View mode switching (list, map, analytics)
- ✅ Modal management (settings, claim, diagnostics, acquired leads)
- ✅ CSV export functionality
- ✅ Feature flag handling
- ✅ Keyboard shortcuts (Escape key)
- ✅ Data flow through component hierarchy
- ✅ Error handling and graceful degradation
- ✅ Proper cleanup on unmount

## Test Architecture

### Mocked Dependencies
All external dependencies are properly mocked:
- `AuthContext` - User authentication
- `usePermitManagement` - Permit data and operations
- `useFilters` - Permit filtering and sorting
- `usePlanFeatures` - Feature flag system
- `useCompanyProfile` - Company profile data
- All child components (Dashboard, AppNavbar, etc.)

### Testing Approach
- Uses React Testing Library for component testing
- Tests component behavior, not implementation
- Focuses on user interactions and UI state
- Verifies component composition and data flow

## Recent Changes

### Test Setup Enhancement
Updated `tests/setup.ts` to properly mock:
- `window.addEventListener`
- `window.removeEventListener`
- `window.dispatchEvent`

This allows keyboard event testing in the Node.js test environment.

### Test File Creation
Created `tests/unit/App.test.tsx` with comprehensive test suite covering:
- Component rendering
- User interactions
- State management
- Error handling
- Feature gating

## Next Steps

1. **Monitor test execution** - Run tests regularly during development
2. **Update tests** - When adding new features to App.tsx
3. **Maintain coverage** - Keep test coverage above 80%
4. **CI/CD integration** - Add tests to deployment pipeline

## Troubleshooting

### Port Already in Use Error
If you see `listen EADDRINUSE: address already in use :::3001`:
```bash
# Kill process using port 3001
lsof -i :3001
kill -9 <PID>

# Or run tests again (should be temporary)
npm test -- tests/unit/App.test.tsx --run
```

### Tests Not Found Error
Ensure the test file exists:
```bash
ls tests/unit/App.test.tsx
```

### Module Not Found Errors
Clear node_modules and reinstall:
```bash
rm -r node_modules package-lock.json
npm install
```

## Related Documentation
- See `TEST_RESULTS_APP.md` for detailed test results
- See `App.tsx` for the refactored component code
- See `.github/copilot-instructions.md` for project context
