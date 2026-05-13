import { logicModsInstallerTest, logicModsInstall } from '../src/installers';

const GAME_ID = 'subnautica2';
const SETMODTYPE_LOGICMODS = { type: 'setmodtype', value: 'subnautica2-logicmods' };

describe('logicModsInstallerTest', () => {
  test('accepts an archive with a LogicMods/ segment', async () => {
    const result = await logicModsInstallerTest(['LogicMods/x.pak'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts a nested LogicMods/ path (case-insensitive)', async () => {
    const result = await logicModsInstallerTest(['mod/logicmods/x.pak'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects an archive without a LogicMods segment', async () => {
    const result = await logicModsInstallerTest(['~mods/x.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects when game id does not match', async () => {
    const result = await logicModsInstallerTest(['LogicMods/x.pak'], 'someotherGame');
    expect(result.supported).toBe(false);
  });
});

describe('logicModsInstall', () => {
  test('emits setmodtype + paks routed under the LogicMods modType root', async () => {
    const result = await logicModsInstall(['LogicMods/x.pak']);
    expect(result.instructions).toEqual([
      SETMODTYPE_LOGICMODS,
      { type: 'copy', source: 'LogicMods/x.pak', destination: 'x.pak' },
    ]);
  });

  test('preserves the directory structure beneath the LogicMods segment', async () => {
    const result = await logicModsInstall(['mod/LogicMods/sub/x.pak']);
    expect(result.instructions).toEqual([
      SETMODTYPE_LOGICMODS,
      { type: 'copy', source: 'mod/LogicMods/sub/x.pak', destination: 'sub/x.pak' },
    ]);
  });

  test('only emits instructions for pak/ucas/utoc files within LogicMods', async () => {
    const result = await logicModsInstall([
      'LogicMods/x.pak',
      'LogicMods/x.ucas',
      'LogicMods/README.txt',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_LOGICMODS,
      { type: 'copy', source: 'LogicMods/x.pak', destination: 'x.pak' },
      { type: 'copy', source: 'LogicMods/x.ucas', destination: 'x.ucas' },
    ]);
  });
});
