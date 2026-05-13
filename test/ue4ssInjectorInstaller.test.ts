import { ue4ssInjectorTest, ue4ssInjectorInstall } from '../src/installers';

const GAME_ID = 'subnautica2';
const SETMODTYPE_INJECTOR = { type: 'setmodtype', value: 'subnautica2-ue4ss-injector' };

describe('ue4ssInjectorTest', () => {
  test('accepts an archive containing dwmapi.dll at the root', async () => {
    const result = await ue4ssInjectorTest(['dwmapi.dll', 'UE4SS.dll'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts an archive containing xinput1_4.dll (Xbox proxy)', async () => {
    const result = await ue4ssInjectorTest(['xinput1_4.dll', 'UE4SS.dll'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts an archive containing UE4SS-settings.ini', async () => {
    const result = await ue4ssInjectorTest(['ue4ss/UE4SS-settings.ini'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects an archive with no UE4SS injector markers', async () => {
    const result = await ue4ssInjectorTest(['mod_P.pak', 'Mods/MyMod/main.lua'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects when gameId does not match', async () => {
    const result = await ue4ssInjectorTest(['dwmapi.dll'], 'someotherGame');
    expect(result.supported).toBe(false);
  });
});

describe('ue4ssInjectorInstall', () => {
  test('routes a root-level dwmapi archive through with identity destinations', async () => {
    const result = await ue4ssInjectorInstall(['dwmapi.dll', 'UE4SS.dll', 'UE4SS-settings.ini']);
    expect(result.instructions).toEqual([
      SETMODTYPE_INJECTOR,
      { type: 'copy', source: 'dwmapi.dll', destination: 'dwmapi.dll' },
      { type: 'copy', source: 'UE4SS.dll', destination: 'UE4SS.dll' },
      { type: 'copy', source: 'UE4SS-settings.ini', destination: 'UE4SS-settings.ini' },
    ]);
  });

  test('strips a wrapper directory above the marker file', async () => {
    const result = await ue4ssInjectorInstall([
      'ue4ss/dwmapi.dll',
      'ue4ss/UE4SS.dll',
      'ue4ss/Mods/BPModLoaderMod/main.lua',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_INJECTOR,
      { type: 'copy', source: 'ue4ss/dwmapi.dll', destination: 'dwmapi.dll' },
      { type: 'copy', source: 'ue4ss/UE4SS.dll', destination: 'UE4SS.dll' },
      { type: 'copy', source: 'ue4ss/Mods/BPModLoaderMod/main.lua', destination: 'Mods/BPModLoaderMod/main.lua' },
    ]);
  });

  test('strips a deeply nested wrapper (Binaries/Win64/...)', async () => {
    const result = await ue4ssInjectorInstall([
      'Game/Binaries/Win64/dwmapi.dll',
      'Game/Binaries/Win64/UE4SS.dll',
      'Game/Binaries/Win64/Mods/CheatManagerEnabler/main.lua',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_INJECTOR,
      { type: 'copy', source: 'Game/Binaries/Win64/dwmapi.dll', destination: 'dwmapi.dll' },
      { type: 'copy', source: 'Game/Binaries/Win64/UE4SS.dll', destination: 'UE4SS.dll' },
      { type: 'copy', source: 'Game/Binaries/Win64/Mods/CheatManagerEnabler/main.lua', destination: 'Mods/CheatManagerEnabler/main.lua' },
    ]);
  });

  test('filters out files that are not under the marker directory', async () => {
    const result = await ue4ssInjectorInstall([
      'ue4ss/dwmapi.dll',
      'ue4ss/UE4SS.dll',
      'README.md',
      'LICENSE',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_INJECTOR,
      { type: 'copy', source: 'ue4ss/dwmapi.dll', destination: 'dwmapi.dll' },
      { type: 'copy', source: 'ue4ss/UE4SS.dll', destination: 'UE4SS.dll' },
    ]);
  });

  test('prefers the shallowest marker when multiple candidates exist', async () => {
    const result = await ue4ssInjectorInstall([
      'dwmapi.dll',
      'UE4SS.dll',
      'Mods/AnotherMod/UE4SS-settings.ini',
    ]);
    expect(result.instructions).toEqual([
      SETMODTYPE_INJECTOR,
      { type: 'copy', source: 'dwmapi.dll', destination: 'dwmapi.dll' },
      { type: 'copy', source: 'UE4SS.dll', destination: 'UE4SS.dll' },
      { type: 'copy', source: 'Mods/AnotherMod/UE4SS-settings.ini', destination: 'Mods/AnotherMod/UE4SS-settings.ini' },
    ]);
  });
});
