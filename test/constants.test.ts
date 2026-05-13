import * as c from '../src/constants';

describe('constants', () => {
  test('GAME_ID matches Nexus slug "subnautica2"', () => {
    expect(c.GAME_ID).toBe('subnautica2');
  });

  test('STEAMAPP_ID is the verified Steam app ID "1962700"', () => {
    expect(c.STEAMAPP_ID).toBe('1962700');
  });

  test('EPIC_CATALOG_ITEM_ID is the 32-char hex catalog item ID', () => {
    expect(c.EPIC_CATALOG_ITEM_ID).toBe('22bfc34d90b64054809542014fc9eb32');
    expect(c.EPIC_CATALOG_ITEM_ID).toMatch(/^[0-9a-f]{32}$/);
  });

  test('XBOX_PRODUCT_ID is the Microsoft Store product ID "9PJPCB188SVG"', () => {
    expect(c.XBOX_PRODUCT_ID).toBe('9PJPCB188SVG');
    expect(c.XBOX_PRODUCT_ID).toMatch(/^9[A-Z0-9]{11}$/);
  });

  test('INSTALL_DIR is the on-disk folder name "Subnautica2"', () => {
    expect(c.INSTALL_DIR).toBe('Subnautica2');
  });

  test('EXEC is the executable filename ending in .exe', () => {
    expect(c.EXEC).toMatch(/\.exe$/i);
    expect(c.EXEC).not.toContain('/');
    expect(c.EXEC).not.toContain('\\');
  });

  test('mod paths are relative (no leading slash, no drive letter)', () => {
    for (const p of [c.PAK_MODS_RELPATH, c.LOGIC_MODS_RELPATH, c.UE4SS_MODS_RELPATH]) {
      expect(p.startsWith('/')).toBe(false);
      expect(p.startsWith('\\')).toBe(false);
      expect(p).not.toMatch(/^[A-Za-z]:/);
    }
  });

  test('PAK_MODS_RELPATH routes to Content/Paks/~mods under INSTALL_DIR', () => {
    expect(c.PAK_MODS_RELPATH).toBe('Subnautica2/Content/Paks/~mods');
  });

  test('LOGIC_MODS_RELPATH routes to Content/Paks/LogicMods under INSTALL_DIR', () => {
    expect(c.LOGIC_MODS_RELPATH).toBe('Subnautica2/Content/Paks/LogicMods');
  });

  test('UE4SS_MODS_RELPATH routes to Binaries/Win64/ue4ss/Mods under INSTALL_DIR', () => {
    expect(c.UE4SS_MODS_RELPATH).toBe('Subnautica2/Binaries/Win64/ue4ss/Mods');
  });

  test('IDs contain no whitespace', () => {
    for (const v of [c.GAME_ID, c.STEAMAPP_ID, c.EPIC_CATALOG_ITEM_ID, c.XBOX_PRODUCT_ID, c.INSTALL_DIR, c.EXEC]) {
      expect(v).not.toMatch(/\s/);
    }
  });

  test('IGNORE_CONFLICTS suppresses UE4SS marker files from cross-mod conflict reports', () => {
    expect(c.IGNORE_CONFLICTS).toContain('enabled.txt');
    expect(c.IGNORE_CONFLICTS).toContain('mods.txt');
    expect(c.IGNORE_CONFLICTS).toContain('UE4SS-settings.ini');
  });

  test('IGNORE_DEPLOY skips mods.txt since Vortex regenerates it on deploy', () => {
    expect(c.IGNORE_DEPLOY).toContain('mods.txt');
  });
});
