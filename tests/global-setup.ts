/**
 * Global setup for integration tests
 * Starts API server (port 3001) and Vite dev server (port 3000) before running tests
 */

import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let viteServer: ViteDevServer | undefined;
let apiServer: ChildProcess | undefined;

export async function setup() {
  console.log('🚀 Starting test servers...');
  
  try {
    // Start API server on port 3001 (handles /api/* routes)
    console.log('📡 Starting API server on port 3001...');
    
    // Set NODE_ENV=test to signal test mode to the application
    process.env.NODE_ENV = 'test';
    
    apiServer = spawn('npx', ['tsx', 'api/dev-server.ts'], {
      stdio: 'inherit', // Show API server output in console
      shell: true,
      env: { ...process.env, NODE_ENV: 'test' }
    });

    // Wait for API server to be ready
    console.log('⏳ Waiting 5 seconds for API server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Start Vite dev server on port 3000 (proxies to API server)
    console.log('🎨 Starting Vite dev server on port 3000...');
    viteServer = await createServer({
      server: {
        port: 3000,
        strictPort: true
      },
      logLevel: 'error',
      clearScreen: false
    });

    await viteServer.listen();
    
    console.log('✅ Vite dev server ready');
    console.log('✅ Full stack available: http://localhost:3000');
    console.log('   → API proxies: /api/permits-dallas, /api/permits-fortworth');
    
  } catch (error) {
    console.error('❌ Failed to start test servers:', error);
    throw error;
  }
}

export async function teardown() {
  console.log('🛑 Stopping test servers...');
  
  if (viteServer) {
    await viteServer.close();
    console.log('✅ Vite server stopped');
  }

  if (apiServer) {
    apiServer.kill('SIGTERM');
    console.log('✅ API server stopped');
  }
}
