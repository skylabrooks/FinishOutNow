
import handler from '../permits-dallas';


// Mocks for dependencies and environment
const mockFetch = jest.fn();
const originalFetch = global.fetch;
const originalEnv = process.env;
const DALLAS_API_ENDPOINT = 'https://www.dallasopendata.com/resource/e7gq-4sah.json';

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

function createMockReq({
  method = 'GET',
  query = {},
} = {}) {
  return {
    method,
    query,
  };
}

// Helper to clear cache (since it's module-scoped)
function clearCache() {
  const cacheModule = require('./permits-dallas');
  if (cacheModule.cache && cacheModule.cache.clear) {
    cacheModule.cache.clear();
  }
}

describe('handler() handler method', () => {
  beforeAll(() => {
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearCache();
    process.env = { ...originalEnv }; // Reset env
  });

  // --- Happy Path Tests ---

  it('should return 405 for non-GET requests', async () => {
    // Test: Ensures handler rejects non-GET methods with 405
    const req = createMockReq({ method: 'POST' });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed'
    });
  });

  it('should fetch permits from Dallas API and return them (no cache, no auth)', async () => {
    // Test: Ensures handler fetches data from Dallas API and returns it correctly
    const permits = [
      {
        permit_type: 'Commercial',
        permit_no: '123',
        address: '123 Main St',
        issue_date: '2024-01-01',
        valuation: '5000',
        applicant_name: 'John Doe',
        work_description: 'Remodel',
        status: 'Issued'
      }
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue(permits)
    });

    const req = createMockReq({ query: { limit: '10', offset: '5' } });
    const res = createMockRes();

    await handler(req, res);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(DALLAS_API_ENDPOINT),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Accept': 'application/json',
          'User-Agent': 'FinishOutNow-Backend/1.0'
        }),
        timeout: 10000
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: permits,
        cached: false,
        timestamp: expect.any(Number)
      })
    );
  });

  it('should use cache if valid and return cached data', async () => {
    // Test: Ensures handler returns cached data if available and valid
    const cacheModule = require("../permits-dallas");
    const cacheKey = cacheModule.getCacheKey({ limit: '20', offset: '0' });
    const cachedPermits = [
      {
        permit_type: 'Commercial',
        permit_no: '456',
        address: '456 Elm St',
        issue_date: '2024-02-01',
        valuation: '8000',
        applicant_name: 'Jane Smith',
        work_description: 'New Build',
        status: 'Issued'
      }
    ];
    cacheModule.cache.set(cacheKey, {
      data: cachedPermits,
      timestamp: Date.now()
    });

    const req = createMockReq({ query: { limit: '20', offset: '0' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: cachedPermits,
        cached: true,
        timestamp: expect.any(Number)
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should add Authorization header if both API key ID and secret are present', async () => {
    // Test: Ensures handler sets Authorization header when both API key ID and secret are present
    process.env.VITE_DALLAS_API_KEY_ID = 'testid';
    process.env.VITE_DALLAS_API_KEY_SECRET = 'testsecret';

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue([])
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    const expectedAuth = 'Basic ' + Buffer.from('testid:testsecret').toString('base64');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expectedAuth
        })
      })
    );
  });

  it('should add X-App-Token header if only API key ID is present', async () => {
    // Test: Ensures handler sets X-App-Token header when only API key ID is present
    process.env.VITE_DALLAS_API_KEY_ID = 'onlyid';
    delete process.env.VITE_DALLAS_API_KEY_SECRET;

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue([])
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-App-Token': 'onlyid'
        })
      })
    );
  });

  it('should use default limit and offset if not provided', async () => {
    // Test: Ensures handler uses default values for limit and offset when not specified
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue([])
    });

    const req = createMockReq({ query: {} });
    const res = createMockRes();

    await handler(req, res);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('$limit=20');
    expect(calledUrl).toContain('$offset=0');
  });

  // --- Edge Case Tests ---

  it('should return 502 if Dallas API returns non-OK response', async () => {
    // Test: Ensures handler returns 502 if Dallas API responds with error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn()
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Dallas API Error: Internal Server Error (500)'),
        timestamp: expect.any(Number)
      })
    );
  });

  it('should return 502 if fetch throws an error', async () => {
    // Test: Ensures handler returns 502 if fetch throws (network error, timeout, etc.)
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Network failure',
        timestamp: expect.any(Number)
      })
    );
  });

  it('should not use cache if cache is expired', async () => {
    // Test: Ensures handler ignores expired cache and fetches new data
    const cacheModule = require("../permits-dallas");
    const cacheKey = cacheModule.getCacheKey({ limit: '20', offset: '0' });
    const expiredTimestamp = Date.now() - (5 * 60 * 1000 + 1000); // Expired by 1s
    cacheModule.cache.set(cacheKey, {
      data: [{ permit_type: 'Commercial', permit_no: '999', address: '', issue_date: '', valuation: '', applicant_name: '', work_description: '', status: '' }],
      timestamp: expiredTimestamp
    });

    const newPermits = [
      {
        permit_type: 'Commercial',
        permit_no: '1000',
        address: '789 Oak St',
        issue_date: '2024-03-01',
        valuation: '12000',
        applicant_name: 'Sam Lee',
        work_description: 'Expansion',
        status: 'Issued'
      }
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue(newPermits)
    });

    const req = createMockReq({ query: { limit: '20', offset: '0' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: newPermits,
        cached: false,
        timestamp: expect.any(Number)
      })
    );
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should handle empty data array from Dallas API', async () => {
    // Test: Ensures handler correctly returns empty data array
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue([])
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [],
        cached: false,
        timestamp: expect.any(Number)
      })
    );
  });

  it('should handle query parameters as numbers', async () => {
    // Test: Ensures handler works when query params are numbers (not strings)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue([])
    });

    const req = createMockReq({ query: { limit: 5, offset: 2 } });
    const res = createMockRes();

    await handler(req, res);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('$limit=5');
    expect(calledUrl).toContain('$offset=2');
  });

  it('should handle large limit and offset values', async () => {
    // Test: Ensures handler works with large limit/offset values
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue([])
    });

    const req = createMockReq({ query: { limit: '1000', offset: '5000' } });
    const res = createMockRes();

    await handler(req, res);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('$limit=1000');
    expect(calledUrl).toContain('$offset=5000');
  });
});