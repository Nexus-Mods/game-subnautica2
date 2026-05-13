import { pakInstallerTest, pakInstall } from '../src/installers';

const GAME_ID = 'subnautica2';
const SETMODTYPE_PAK = { type: 'setmodtype', value: 'subnautica2-pak' };

describe('pakInstallerTest', () => {
  test('accepts a single .pak file', async () => {
    const result = await pakInstallerTest(['mod_P.pak'], GAME_ID);
    expect(result.supported).toBe(true);
    expect(result.requiredFiles).toEqual([]);
  });

  test('accepts a pak + ucas + utoc trio (UE5 IO Store)', async () => {
    const result = await pakInstallerTest(['x_P.pak', 'x_P.ucas', 'x_P.utoc'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects an archive containing a LogicMods/ segment (logicMods installer wins)', async () => {
    const result = await pakInstallerTest(['LogicMods/y.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects an archive containing UE4SS Lua scripts (ue4ss installer wins)', async () => {
    const result = await pakInstallerTest(['mod/Scripts/main.lua'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects when game id does not match', async () => {
    const result = await pakInstallerTest(['mod_P.pak'], 'someotherGame');
    expect(result.supported).toBe(false);
  });

  test('rejects an archive with no pak files', async () => {
    const result = await pakInstallerTest(['readme.txt'], GAME_ID);
    expect(result.supported).toBe(false);
  });
});

describe('pakInstall', () => {
  test('emits setmodtype + flat destinations under the pak modType root', async () => {
    const result = await pakInstall(['mod_P.pak']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAK,
      { type: 'copy', source: 'mod_P.pak', destination: 'mod_P.pak' },
    ]);
  });

  test('routes pak + ucas + utoc as a group', async () => {
    const result = await pakInstall(['x_P.pak', 'x_P.ucas', 'x_P.utoc']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAK,
      { type: 'copy', source: 'x_P.pak', destination: 'x_P.pak' },
      { type: 'copy', source: 'x_P.ucas', destination: 'x_P.ucas' },
      { type: 'copy', source: 'x_P.utoc', destination: 'x_P.utoc' },
    ]);
  });

  test('flattens nested folder structures (drops upstream directories)', async () => {
    const result = await pakInstall(['SomeMod/files/x_P.pak']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAK,
      { type: 'copy', source: 'SomeMod/files/x_P.pak', destination: 'x_P.pak' },
    ]);
  });

  test('ignores non-pak files in the archive', async () => {
    const result = await pakInstall(['x_P.pak', 'README.md']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAK,
      { type: 'copy', source: 'x_P.pak', destination: 'x_P.pak' },
    ]);
  });
});
