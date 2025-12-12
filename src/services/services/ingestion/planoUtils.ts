// Utility functions for Plano ingestion connector
export function logDiscoveryResults(discoveryResults: Array<{endpoint: string; success: boolean; errorType?: string}>) {
  if (discoveryResults.length === 0) return;
  // Use structured logging or a logger if available
  // For now, just output to console
  console.log('\n📊 Plano API Discovery Results:');
  console.log('═'.repeat(60));
  discoveryResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const error = result.errorType ? ` (${result.errorType})` : '';
    console.log(`${status} ${result.endpoint}${error}`);
  });
  console.log('═'.repeat(60) + '\n');
}
