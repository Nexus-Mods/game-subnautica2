import { ue4ssInstallerTest, ue4ssInstall } from '../src/installers/ue4ssInstaller';

const GAME_ID = 'subnautica2';
const SETMODTYPE_UE4SS = { type: 'setmodtype', value: 'subnautica2-ue4ss' };

describe('ue4ssInstallerTest', () => {
  test('accepts an archive with Scripts/main.lua', async () => {
    const result = await ue4ssInstallerTest(['MyMod/Scripts/main.lua'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts an archive with enabled.txt + lua file', async () => {
    const result = await ue4ssInstallerTest(['MyMod/enabled.txt', 'MyMod/script.lua'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects a pure pak archive', async () => {
    const result = await ue4ssInstallerTest(['mod_P.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects when game id does not match', async () => {
    const result = await ue4ssInstallerTest(['Scripts/main.lua'], 'someotherGame');
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

  test('routes a top-level lua under a default mod folder', async () => {
    const result = await ue4ssInstall(['script.lua']);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'script.lua', destination: 'script/script.lua' },
    ]);
  });

  test('ignores irrelevant files in the archive', async () => {
    const result = await ue4ssInstall(['MyMod/Scripts/main.lua', 'desktop.ini']);
    expect(result.instructions).toEqual([
      SETMODTYPE_UE4SS,
      { type: 'copy', source: 'MyMod/Scripts/main.lua', destination: 'MyMod/Scripts/main.lua' },
    ]);
  });
});
