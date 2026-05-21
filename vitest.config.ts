import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.gdl-out/tests.gen.ts'],
    globals: false,
  },
});
