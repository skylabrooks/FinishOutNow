
import { Permit } from '../../types';

// Note: Arlington building permits API not publicly accessible
// Using Planning & Zoning Cases as early commercial activity signal
// Estimated valuations based on case type (actual permits would come later)
const ESTIMATED_VALUATIONS: Record<string, number> = {
  'Site Plan': 250000,
  'SUP': 150000,  // Special Use Permit
  'PD': 200000,   // Planned Development
  'Zoning Change': 100000,
  'Default': 75000
};

// Use API proxy endpoint (resolves CORS issues)
const PROXY_ENDPOINT = '/api/permits-arlington';

interface ArlingtonProxyResponse {
  success: boolean;
  data?: any[];
  error?: string;
  cached?: boolean;
  note?: string;
}

export const fetchArlingtonPermits = async (): Promise<Permit[]> => {
  try {
    console.log('[Arlington] Fetching via backend proxy...');
    
    const response = await fetch(`${PROXY_ENDPOINT}?limit=20`).catch(() => null);

    if (response?.ok) {
      const proxyData: ArlingtonProxyResponse = await response.json();
      
      if (proxyData.success && proxyData.data && proxyData.data.length > 0) {
        console.log(`[Arlington] Fetched ${proxyData.data.length} zoning cases via proxy`);
        
        if (proxyData.note) {
          console.log(`[Arlington] Note: ${proxyData.note}`);
        }
        
        return proxyData.data
          .map((feature: any) => {
            const attrs = feature.attributes || feature;
            
            // Estimate valuation based on case type
            const caseType = attrs.CaseType || 'Default';
            const estimatedValue = ESTIMATED_VALUATIONS[caseType] || ESTIMATED_VALUATIONS['Default'];
            
            // Parse date
            let appliedDate = new Date().toISOString().split('T')[0];
            if (attrs.DateFiled) {
              try {
                appliedDate = new Date(attrs.DateFiled).toISOString().split('T')[0];
              } catch (e) {
                // Use current date if parsing fails
              }
            }
            
            return {
              id: `ARL-${attrs.CaseNumber || attrs.OBJECTID || Math.random()}`,
              permitNumber: attrs.CaseNumber || 'N/A',
              permitType: 'Zoning Case', // Early stage commercial signal
              address: `${attrs.Address || 'Address Not Listed'}, ARLINGTON, TX`,
              city: 'Arlington' as const,
              appliedDate,
              description: attrs.CaseDescription || attrs.CaseType || 'Commercial zoning case',
              applicant: attrs.Applicant || 'Unknown',
              valuation: estimatedValue,
              status: (attrs.Status === 'Issued' ? 'Issued' : 'Under Review'),
              dataSource: 'Arlington Planning & Zoning (Live)'
            } as Permit;
          })
          .filter(p => {
            // Filter for commercial-relevant cases
            const desc = (p.description || '').toLowerCase();
            const commercialKeywords = ['commercial', 'retail', 'office', 'restaurant', 'tenant', 'site plan', 'mixed'];
            return commercialKeywords.some(kw => desc.includes(kw));
          });
      }
    }

    // Fallback to mock data if proxy unavailable
    console.log('[Arlington] Proxy unavailable or returned no data, using mock fallback');
    return [
      {
        id: 'ARL-2025-001',
        permitNumber: 'BP-24-00192',
        permitType: 'Commercial Remodel',
        address: '101 W ABRAM ST, ARLINGTON, TX',
        city: 'Arlington',
        appliedDate: new Date().toISOString().split('T')[0],
        description: 'Interior remodel for retail space. Demising wall demo and new electrical service.',
        applicant: 'Texas General Contractors',
        valuation: 150000,
        status: 'Under Review',
        dataSource: 'Arlington Permits (Mock)'
      }
    ];

  } catch (error) {
    console.warn('Failed to fetch Arlington permits:', error);
    return [];
  }
};