import { ue4ssTest, ue4ssInstall } from '../src/installers';

const GAME_ID = 'subnautica2';
const SETMODTYPE_UE4SS = { type: 'setmodtype', value: 'subnautica2-ue4ss' };

describe('ue4ssTest', () => {
  test('accepts an archive with Scripts/main.lua', async () => {
    const result = await ue4ssTest(['MyMod/Scripts/main.lua'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts an archive with enabled.txt + lua file', async () => {
    const result = await ue4ssTest(['MyMod/enabled.txt', 'MyMod/script.lua'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects a pure pak archive', async () => {
    const result = await ue4ssTest(['mod_P.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects when game id does not match', async () => {
    const result = await ue4ssTest(['Scripts/main.lua'], 'someotherGame');
    expect(result.supported).toBe(false);
  });
});

describe('ue4ssInstall', () => {
  test('routes a Scripts/main.lua bundle relative to the UE4SS modType root', async () => {
    const result = await ue4ssInstall(['MyMod/Scripts/main.lua']);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'MyMod/Scripts/main.lua', destination: 'MyMod/Scripts/main.lua' },
    ]);
  });

  test('routes enabled.txt and lua files preserving the mod folder name', async () => {
    const result = await ue4ssInstall(['MyMod/enabled.txt', 'MyMod/main.lua']);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'MyMod/enabled.txt', destination: 'MyMod/enabled.txt' },
      { type: 'copy', source: 'MyMod/main.lua', destination: 'MyMod/main.lua' },
    ]);
  });

  test('installs all files under the mod root including non-Lua assets', async () => {
    // Real archive layout for the "Simple Minimap" mod (subnautica2/116).
    const result = await ue4ssInstall([
      'SubnauticaMapMod/enabled.txt',
      'SubnauticaMapMod/Scripts/main.lua',
      'SubnauticaMapMod/Scripts/config.lua',
      'SubnauticaMapMod/Assets/MapArrowRight.png',
      'SubnauticaMapMod/Assets/mapgenie_world_cropped.png',
      'SubnauticaMapMod/Assets/pixel.png',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'SubnauticaMapMod/enabled.txt', destination: 'SubnauticaMapMod/enabled.txt' },
      { type: 'copy', source: 'SubnauticaMapMod/Scripts/main.lua', destination: 'SubnauticaMapMod/Scripts/main.lua' },
      { type: 'copy', source: 'SubnauticaMapMod/Scripts/config.lua', destination: 'SubnauticaMapMod/Scripts/config.lua' },
      { type: 'copy', source: 'SubnauticaMapMod/Assets/MapArrowRight.png', destination: 'SubnauticaMapMod/Assets/MapArrowRight.png' },
      { type: 'copy', source: 'SubnauticaMapMod/Assets/mapgenie_world_cropped.png', destination: 'SubnauticaMapMod/Assets/mapgenie_world_cropped.png' },
      { type: 'copy', source: 'SubnauticaMapMod/Assets/pixel.png', destination: 'SubnauticaMapMod/Assets/pixel.png' },
    ]);
  });

  test('strips a wrapping directory above the mod root', async () => {
    const result = await ue4ssInstall(['WrapDir/MyMod/Scripts/main.lua', 'WrapDir/MyMod/Assets/icon.png']);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'WrapDir/MyMod/Scripts/main.lua', destination: 'MyMod/Scripts/main.lua' },
      { type: 'copy', source: 'WrapDir/MyMod/Assets/icon.png', destination: 'MyMod/Assets/icon.png' },
    ]);
  });

  test('strips a deep game-relative path baked into a Lua mod archive', async () => {
    // Real archive layout for "Mod Settings for Subnautica 2" (subnautica2/20):
    // ships its files at the full game-relative install path rather than just
    // the mod folder.
    const result = await ue4ssInstall([
      'Subnautica2/Binaries/Win64/ue4ss/Mods/SN2ModSettings/enabled.txt',
      'Subnautica2/Binaries/Win64/ue4ss/Mods/SN2ModSettings/Scripts/main.lua',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      {
        type: 'copy',
        source: 'Subnautica2/Binaries/Win64/ue4ss/Mods/SN2ModSettings/enabled.txt',
        destination: 'SN2ModSettings/enabled.txt',
      },
      {
        type: 'copy',
        source: 'Subnautica2/Binaries/Win64/ue4ss/Mods/SN2ModSettings/Scripts/main.lua',
        destination: 'SN2ModSettings/Scripts/main.lua',
      },
    ]);
  });

  test('drops files outside the mod root', async () => {
    const result = await ue4ssInstall(['MyMod/Scripts/main.lua', 'README.md', 'desktop.ini']);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'MyMod/Scripts/main.lua', destination: 'MyMod/Scripts/main.lua' },
    ]);
  });

  test('skips OS metadata files nested inside the mod root', async () => {
    const result = await ue4ssInstall([
      'MyMod/enabled.txt',
      'MyMod/Scripts/main.lua',
      'MyMod/Thumbs.db',
      'MyMod/Scripts/.DS_Store',
      'MyMod/Assets/desktop.ini',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'MyMod/enabled.txt', destination: 'MyMod/enabled.txt' },
      { type: 'copy', source: 'MyMod/Scripts/main.lua', destination: 'MyMod/Scripts/main.lua' },
    ]);
  });

  test('emits no copy instructions for a malformed loose-lua archive', async () => {
    // A bare `script.lua` at the archive root has no mod-root folder to copy
    // under, so the installer routes nothing rather than dropping the file at
    // the modType root (where UE4SS would not find it).
    const result = await ue4ssInstall(['script.lua']);
    expect(result.instructions).toEqual([SETMODTYPE_UE4SS]);
  });
});
