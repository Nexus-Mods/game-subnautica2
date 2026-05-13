import { rootInstall, rootInstallerTest } from '../src/installers';

const GAME_ID = 'subnautica2';
const SETMODTYPE_ROOT = { type: 'setmodtype', value: 'subnautica2-root' };

describe('rootInstallerTest', () => {
  test('accepts an archive with Subnautica2/ as top-level segment', async () => {
    const result = await rootInstallerTest(['Subnautica2/Content/Paks/mod.pak'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts an archive with Engine/ as top-level segment', async () => {
    const result = await rootInstallerTest(['Engine/Config/BaseEngine.ini'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts an archive with Binaries/ at top level', async () => {
    const result = await rootInstallerTest(['Binaries/Win64/UE4SS.dll'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects an archive whose layout does not include a recognized top-level segment', async () => {
    const result = await rootInstallerTest(['mod.pak', 'README.md'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects when gameId does not match', async () => {
    const result = await rootInstallerTest(['Subnautica2/Content/Paks/mod.pak'], 'someotherGame');
    expect(result.supported).toBe(false);
  });
});

describe('rootInstall', () => {
  test('emits setmodtype and copies every file with identity destinations', async () => {
    const result = await rootInstall([
      'Subnautica2/Content/Paks/mod.pak',
      'Subnautica2/Config/Custom.ini',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_ROOT,
      { type: 'copy', source: 'Subnautica2/Content/Paks/mod.pak', destination: 'Subnautica2/Content/Paks/mod.pak' },
      { type: 'copy', source: 'Subnautica2/Config/Custom.ini', destination: 'Subnautica2/Config/Custom.ini' },
    ]);
  });

  test('drops directory entries (trailing slash) before emitting copies', async () => {
    const result = await rootInstall(['Subnautica2/', 'Subnautica2/x.ini']);
    expect(result.instructions).toEqual([
      SETMODTYPE_ROOT,
      { type: 'copy', source: 'Subnautica2/x.ini', destination: 'Subnautica2/x.ini' },
    ]);
  });
});
