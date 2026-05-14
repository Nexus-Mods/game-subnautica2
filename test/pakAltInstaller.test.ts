import { pakAltInstall, pakAltTest } from '../src/installers';

const GAME_ID = 'subnautica2';
const SETMODTYPE_PAKALT = { type: 'setmodtype', value: 'subnautica2-pakalt' };

describe('pakAltTest', () => {
  test('accepts an archive that ships paks under a Paks/ segment without ~mods or LogicMods', async () => {
    const result = await pakAltTest(['Paks/mod.pak'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects an archive that uses the ~mods folder (pak installer handles that)', async () => {
    const result = await pakAltTest(['Paks/~mods/mod.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects an archive that uses the LogicMods folder', async () => {
    const result = await pakAltTest(['Paks/LogicMods/x.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects an archive that contains UE4SS Lua scripts', async () => {
    const result = await pakAltTest(['Paks/mod.pak', 'Scripts/main.lua'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects an archive that has paks but no Paks/ segment (pak installer handles that)', async () => {
    const result = await pakAltTest(['mod.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects when gameId does not match', async () => {
    const result = await pakAltTest(['Paks/mod.pak'], 'someotherGame');
    expect(result.supported).toBe(false);
  });
});

describe('pakAltInstall', () => {
  test('routes paks under the Paks/ segment to the modType root', async () => {
    const result = await pakAltInstall(['Paks/mod.pak']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAKALT,
      { type: 'copy', source: 'Paks/mod.pak', destination: 'mod.pak' },
    ]);
  });

  test('preserves the directory structure beneath Paks/', async () => {
    const result = await pakAltInstall(['mod/Paks/sub/mod_P.pak']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAKALT,
      { type: 'copy', source: 'mod/Paks/sub/mod_P.pak', destination: 'sub/mod_P.pak' },
    ]);
  });

  test('emits .ucas/.utoc IO-store siblings alongside the .pak', async () => {
    const result = await pakAltInstall(['Paks/mod.pak', 'Paks/mod.ucas', 'Paks/mod.utoc']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAKALT,
      { type: 'copy', source: 'Paks/mod.pak', destination: 'mod.pak' },
      { type: 'copy', source: 'Paks/mod.ucas', destination: 'mod.ucas' },
      { type: 'copy', source: 'Paks/mod.utoc', destination: 'mod.utoc' },
    ]);
  });

  test('ignores non-pak files in the Paks/ tree', async () => {
    const result = await pakAltInstall(['Paks/mod.pak', 'Paks/README.txt']);
    expect(result.instructions).toEqual([
      SETMODTYPE_PAKALT,
      { type: 'copy', source: 'Paks/mod.pak', destination: 'mod.pak' },
    ]);
  });
});
