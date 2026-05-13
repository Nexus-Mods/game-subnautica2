import { vi } from 'vitest';

export const log = vi.fn();

export const fs = {
  ensureDirWritableAsync: vi.fn((_p: string) => Promise.resolve()),
  ensureDirAsync: vi.fn((_p: string) => Promise.resolve()),
  statAsync: vi.fn((_p: string) => Promise.resolve({ isDirectory: () => true })),
  readdirAsync: vi.fn((_p: string) => Promise.resolve([] as string[])),
  writeFileAsync: vi.fn((_p: string, _content: string) => Promise.resolve()),
};

export const util = {
  GameStoreHelper: {
    findByAppId: vi.fn(),
  },
  opn: vi.fn((_url: string) => Promise.resolve()),
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
  activeGameId: vi.fn<(state: unknown) => string | undefined>(),
  discoveryByGame: vi.fn<(state: unknown, gameId: string) => { path?: string; store?: string } | undefined>(),
};

export const actions = {};

export const types = {};
