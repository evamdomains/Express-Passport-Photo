import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
  resolve: {
    // Mirror tsconfig's "@/*" → "./src/*" so tests import the real production code.
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
