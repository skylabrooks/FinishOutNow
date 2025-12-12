/**
 * Plano API Endpoint Discovery Script
 * Tests various potential endpoints to determine what's publicly accessible
 */

interface DiscoveryResult {
  endpoint: string;
  status: 'success' | 'auth_required' | 'not_found' | 'cors_error' | 'error';
  statusCode?: number;
  requiresAuth: boolean;
  sampleData?: any;
  errorMessage?: string;
  headers?: Record<string, string>;
}

const ENDPOINTS_TO_TEST = [
  // EnerGov Public API endpoints
  {
    url: 'https://aca.planogov.org/api/public/permits',
    type: 'EnerGov REST',
    description: 'Public permits endpoint'
  },
  {
    url: 'https://aca.planogov.org/EnerGovWebApi/api/permits',
    type: 'EnerGov REST',
    description: 'Alternative API path'
  },
  
  // ArcGIS Feature Service endpoints
  {
    url: 'https://gis.plano.gov/arcgis/rest/services',
    type: 'ESRI ArcGIS',
    description: 'Root services directory'
  },
  {
    url: 'https://gis.plano.gov/arcgis/rest/services/OpenData/BuildingPermits/FeatureServer/0/query?where=1=1&outFields=*&f=json&resultRecordCount=5',
    type: 'ESRI Feature Service',
    description: 'Building permits feature layer'
  },
  {
    url: 'https://services.arcgis.com/PlanoGIS/arcgis/rest/services/Permits/FeatureServer/0/query?where=1=1&outFields=*&f=json&resultRecordCount=5',
    type: 'ESRI Feature Service',
    description: 'Alternative ArcGIS Online hosted service'
  },
  
  // Open Data Portal attempts
  {
    url: 'https://data.planogov.org/resource/permits.json?$limit=5',
    type: 'Socrata',
    description: 'Socrata open data portal'
  },
  {
    url: 'https://plano.data.socrata.com/resource/permits.json?$limit=5',
    type: 'Socrata',
    description: 'Alternative Socrata subdomain'
  }
];

async function testEndpoint(endpoint: typeof ENDPOINTS_TO_TEST[0]): Promise<DiscoveryResult> {
  console.log(`\n🔍 Testing: ${endpoint.description}`);
  console.log(`   URL: ${endpoint.url}`);
  
  const result: DiscoveryResult = {
    endpoint: endpoint.url,
    status: 'error',
    requiresAuth: false
  };

  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinishOutNow/1.0 (Lead Retrieval System)'
      }
    });

    result.statusCode = response.status;
    
    // Capture relevant headers
    result.headers = {
      'content-type': response.headers.get('content-type') || 'unknown',
      'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining') || 'not present',
      'cache-control': response.headers.get('cache-control') || 'not present'
    };

    if (response.ok) {
      const data = await response.json();
      result.status = 'success';
      result.sampleData = data;
      console.log(`   ✅ SUCCESS - Status ${response.status}`);
      
      // Log structure
      if (Array.isArray(data)) {
        console.log(`   📊 Returned ${data.length} records`);
        if (data[0]) {
          console.log(`   🔑 Sample fields: ${Object.keys(data[0]).slice(0, 10).join(', ')}`);
        }
      } else if (data.features) {
        console.log(`   📊 Feature Service - ${data.features.length} features`);
        if (data.features[0]?.attributes) {
          console.log(`   🔑 Sample fields: ${Object.keys(data.features[0].attributes).slice(0, 10).join(', ')}`);
        }
      } else {
        console.log(`   📊 Response type: ${typeof data}`);
      }
      
    } else if (response.status === 401 || response.status === 403) {
      result.status = 'auth_required';
      result.requiresAuth = true;
      console.log(`   🔒 AUTH REQUIRED - Status ${response.status}`);
      
    } else if (response.status === 404) {
      result.status = 'not_found';
      console.log(`   ❌ NOT FOUND - Status 404`);
      
    } else {
      result.status = 'error';
      result.errorMessage = `HTTP ${response.status}`;
      console.log(`   ⚠️  ERROR - Status ${response.status}`);
    }

  } catch (error: any) {
    if (error.message?.includes('CORS') || error.message?.includes('fetch')) {
      result.status = 'cors_error';
      result.errorMessage = 'CORS restriction or network error';
      console.log(`   🚫 CORS/Network error: ${error.message}`);
    } else {
      result.status = 'error';
      result.errorMessage = error.message;
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  return result;
}

async function runDiscovery(): Promise<DiscoveryResult[]> {
  console.log('🚀 Starting Plano API Endpoint Discovery');
  console.log('=' .repeat(60));
  
  const results: DiscoveryResult[] = [];
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DISCOVERY SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'success');
  const authRequired = results.filter(r => r.status === 'auth_required');
  const notFound = results.filter(r => r.status === 'not_found');
  const corsErrors = results.filter(r => r.status === 'cors_error');
  
  console.log(`\n✅ Successful (Publicly Accessible): ${successful.length}`);
  successful.forEach(r => console.log(`   - ${r.endpoint}`));
  
  console.log(`\n🔒 Authentication Required: ${authRequired.length}`);
  authRequired.forEach(r => console.log(`   - ${r.endpoint}`));
  
  console.log(`\n❌ Not Found: ${notFound.length}`);
  notFound.forEach(r => console.log(`   - ${r.endpoint}`));
  
  console.log(`\n🚫 CORS/Network Errors: ${corsErrors.length}`);
  corsErrors.forEach(r => console.log(`   - ${r.endpoint}`));
  
  return results;
}

// Export for use in other modules
export { runDiscovery, testEndpoint, type DiscoveryResult };

// Run if executed directly
if (require.main === module) {
  runDiscovery()
    .then(results => {
      console.log('\n✅ Discovery complete. Results saved to plano_discovery_results.json');
      // You could save results to file here
    })
    .catch(error => {
      console.error('❌ Discovery failed:', error);
      process.exit(1);
    });
}
