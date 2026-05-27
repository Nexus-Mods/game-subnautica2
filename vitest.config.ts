import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      '.gdl-out/tests.gen.ts',
      'test/**/*.test.ts',
    ],
    alias: {
      'vortex-api': resolve(root, 'test/__mocks__/vortex-api.ts'),
      '@gdl/runtime': resolve(root, 'gdl/src/runtime/index.ts'),
    },
    restoreMocks: true,
  },
});
