/**
 * Minimal vortex-api mock for Jest. Only the surface our unit tests need.
 * Real types come from node_modules/vortex-api at compile time; this file
 * provides runtime stand-ins so `import { ... } from 'vortex-api'` resolves
 * without pulling in Vortex's electron/react runtime.
 */

export const log = jest.fn();

export const fs = {
  ensureDirWritableAsync: jest.fn((_p: string) => Promise.resolve()),
  ensureDirAsync: jest.fn((_p: string) => Promise.resolve()),
  statAsync: jest.fn((_p: string) => Promise.resolve({ isDirectory: () => true })),
  readdirAsync: jest.fn((_p: string) => Promise.resolve([] as string[])),
};

export const util = {
  GameStoreHelper: {
    findByAppId: jest.fn(),
  },
  getSafe: <T>(obj: unknown, path: readonly (string | number)[], fallback: T): T => {
    let cur: unknown = obj;
    for (const seg of path) {
      if (cur && typeof cur === 'object' && seg in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[seg as string];
      } else {
        return fallback;
      }
    }
    return cur as T;
  },
};

export const selectors = {
  activeGameId: jest.fn(),
  discoveryByGame: jest.fn(),
};

export const actions = {};

export const types = {};
