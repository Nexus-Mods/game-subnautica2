import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      '.gdl-out/tests.gen.ts',
      'test/**/*.test.ts',
    ],
    alias: {
      'vortex-api': resolve(__dirname, 'test/__mocks__/vortex-api.ts'),
      '@gdl/runtime': resolve(__dirname, 'gdl/src/runtime/index.ts'),
    },
    restoreMocks: true,
  },
});
