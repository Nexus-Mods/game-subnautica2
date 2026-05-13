/* eslint-env node */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/test/**/*.test.ts'],
  moduleNameMapper: {
    '^vortex-api$': '<rootDir>/test/__mocks__/vortex-api.ts',
  },
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts'],
};
