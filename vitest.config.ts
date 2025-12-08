import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['services/**/*.ts', 'components/**/*.tsx', 'api/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.config.ts', '**/mockData.ts', 'tests/**']
    },
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@services': path.resolve(__dirname, './services'),
      '@components': path.resolve(__dirname, './components'),
      '@api': path.resolve(__dirname, './api')
    }
  }
});
