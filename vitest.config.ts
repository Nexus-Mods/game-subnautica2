import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      'vortex-api': path.resolve(__dirname, 'test/__mocks__/vortex-api.ts'),
    },
  },
});
