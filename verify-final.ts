#!/usr/bin/env node
/**
 * Final verification: Test complete permit workflow
 * This mimics exactly what the browser does when it loads the app
 */

async function verifyPermitWorkflow() {
  console.log('🚀 FINAL VERIFICATION: Complete Permit Workflow\n');
  
  const PROXY = 'http://localhost:3001';
  
  try {
    // Step 1: Fetch Dallas permits
    console.log('Step 1: Fetch Dallas permits from proxy');
    const dalRes = await fetch(`${PROXY}/api/permits-dallas?limit=20`);
    if (!dalRes.ok) throw new Error(`Dallas fetch failed: ${dalRes.status}`);
    const dalData = await dalRes.json();
    if (!dalData.success) throw new Error(`Dallas API failed: ${dalData.error}`);
    
    const dalPermits = dalData.data.map((r: any) => ({
      applicant: (r.contractor || r.applicant_name || '').trim() || 'Unknown Applicant',
      address: (r.street_address || r.address || '').trim() || 'Address Not Listed',
      city: 'Dallas'
    }));
    console.log(`  ✅ Retrieved ${dalPermits.length} Dallas permits`);
    
    // Step 2: Fetch Fort Worth permits
    console.log('\nStep 2: Fetch Fort Worth permits from proxy');
    const fwRes = await fetch(`${PROXY}/api/permits-fortworth?limit=50`);
    if (!fwRes.ok) throw new Error(`Fort Worth fetch failed: ${fwRes.status}`);
    const fwData = await fwRes.json();
    if (!fwData.success) throw new Error(`Fort Worth API failed: ${fwData.error}`);
    
    const fwPermits = fwData.data.map((r: any) => {
      const attrs = r.attributes || {};
      const addr = [attrs.Addr_No, attrs.Direction, attrs.Street_Name, attrs.Street_Suffix]
        .filter((x: any) => x)
        .join(' ')
        .trim() || 'Address Not Listed';
      return {
        applicant: (attrs.Owner_Full_Name || '').trim() || 'Unknown',
        address: addr,
        city: 'Fort Worth'
      };
    });
    console.log(`  ✅ Retrieved ${fwPermits.length} Fort Worth permits`);
    
    // Step 3: Apply quality filtering (same logic as leadManager)
    console.log('\nStep 3: Apply quality filtering');
    const allPermits = [...dalPermits, ...fwPermits];
    
    const isHighQuality = (p: any) => {
      if (!p.applicant || p.applicant === 'Unknown' || p.applicant === 'Unknown Applicant' || 
          p.applicant.trim().length < 3) {
        return false;
      }
      if (!p.address || p.address === 'ADDRESS NOT LISTED' || p.address === 'Address Not Listed' ||
          p.address.trim().length < 3) {
        return false;
      }
      return true;
    };
    
    const highQuality = allPermits.filter(isHighQuality);
    const lowQuality = allPermits.filter(p => !isHighQuality(p));
    
    console.log(`  Total permits: ${allPermits.length}`);
    console.log(`  ✅ High-quality: ${highQuality.length}`);
    console.log(`  ⚠️  Low-quality (filtered): ${lowQuality.length}`);
    
    // Step 4: Show samples
    console.log('\nStep 4: Sample high-quality permits');
    highQuality.slice(0, 3).forEach((p, i) => {
      console.log(`  [${i+1}] ${p.city}: ${p.applicant.substring(0, 35)} @ ${p.address.substring(0, 35)}`);
    });
    
    // Step 5: Summary
    console.log('\n📊 SUMMARY');
    console.log(`┌─────────────────────────────────────┐`);
    console.log(`│ ✅ Phase 2: Permit Sourcing WORKS!  │`);
    console.log(`├─────────────────────────────────────┤`);
    console.log(`│ Total permits fetched: ${allPermits.length.toString().padEnd(20)} │`);
    console.log(`│ High-quality leads: ${highQuality.length.toString().padEnd(23)} │`);
    console.log(`│ Pass rate: ${((highQuality.length/allPermits.length)*100).toFixed(0)}%${' '.repeat(27)} │`);
    console.log(`└─────────────────────────────────────┘`);
    
    console.log('\n✨ Ready for UI display!\n');
    
  } catch (error) {
    console.error('❌ FAILED:', error);
    process.exit(1);
  }
}

verifyPermitWorkflow();
