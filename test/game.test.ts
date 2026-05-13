import { vi } from 'vitest';
import { resolveModPaths, prepareForModding } from '../src/game';
import { fs } from 'vortex-api';

describe('resolveModPaths', () => {
  test('returns the three relative mod paths joined to the discovery path (steam)', () => {
    const paths = resolveModPaths({ path: '/games/Subnautica2', store: 'steam' });
    expect(paths.pak).toBe('/games/Subnautica2/Subnautica2/Content/Paks/~mods');
    expect(paths.logicMods).toBe('/games/Subnautica2/Subnautica2/Content/Paks/LogicMods');
    expect(paths.ue4ss).toBe('/games/Subnautica2/Subnautica2/Binaries/Win64/ue4ss/Mods');
  });

  test('handles Epic store discovery the same as steam (paths relative to install root)', () => {
    const paths = resolveModPaths({ path: '/epic/Subnautica2', store: 'epic' });
    expect(paths.pak.startsWith('/epic/Subnautica2/Subnautica2/')).toBe(true);
  });

  test('returns flat (non-INSTALL_DIR-nested) paths for Xbox discovery', () => {
    // Xbox UWP installs already place the game files at the discovery root,
    // so we don't repeat the INSTALL_DIR segment.
    const paths = resolveModPaths({ path: '/xbox/Subnautica2', store: 'xbox' });
    expect(paths.pak).toBe('/xbox/Subnautica2/Content/Paks/~mods');
    expect(paths.logicMods).toBe('/xbox/Subnautica2/Content/Paks/LogicMods');
    expect(paths.ue4ss).toBe('/xbox/Subnautica2/Binaries/Win64/ue4ss/Mods');
  });

  test('discovery without a store defaults to nested INSTALL_DIR layout', () => {
    const paths = resolveModPaths({ path: '/games/Subnautica2' });
    expect(paths.pak.endsWith('/Subnautica2/Subnautica2/Content/Paks/~mods')).toBe(true);
  });
});

describe('prepareForModding', () => {
  test('ensures each resolved mod dir is writable', async () => {
    const ensure = vi.mocked(fs.ensureDirWritableAsync);
    ensure.mockClear();
    const discovery = { path: '/games/Subnautica2', store: 'steam' as const };
    await prepareForModding(discovery);
    expect(ensure).toHaveBeenCalledTimes(3);
    const calledWith = ensure.mock.calls.map((c) => c[0]);
    expect(calledWith).toContain('/games/Subnautica2/Subnautica2/Content/Paks/~mods');
    expect(calledWith).toContain('/games/Subnautica2/Subnautica2/Content/Paks/LogicMods');
    expect(calledWith).toContain('/games/Subnautica2/Subnautica2/Binaries/Win64/ue4ss/Mods');
  });

  test('rejects when discovery.path is missing', async () => {
    await expect(prepareForModding({ path: undefined as unknown as string })).rejects.toThrow(/discovery/i);
  });
});
