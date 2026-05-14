import { contentFolderInstall, contentFolderTest } from '../src/installers';

const GAME_ID = 'subnautica2';
const SETMODTYPE_CONTENT = { type: 'setmodtype', value: 'subnautica2-contentfolder' };

describe('contentFolderTest', () => {
  test('accepts an archive whose first segment is Content/', async () => {
    const result = await contentFolderTest(['Content/Configurations/Foo.ini'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('accepts an archive whose first segment is Config/', async () => {
    const result = await contentFolderTest(['Config/CustomEngine.ini'], GAME_ID);
    expect(result.supported).toBe(true);
  });

  test('rejects an archive whose first segment is not Content or Config', async () => {
    const result = await contentFolderTest(['mod.pak'], GAME_ID);
    expect(result.supported).toBe(false);
  });

  test('rejects an archive that also contains a LogicMods/ segment', async () => {
    const result = await contentFolderTest(
      ['Content/Foo.uasset', 'LogicMods/x.pak'],
      GAME_ID,
    );
    expect(result.supported).toBe(false);
  });

  test('rejects when gameId does not match', async () => {
    const result = await contentFolderTest(['Content/Foo.ini'], 'someotherGame');
    expect(result.supported).toBe(false);
  });
});

describe('contentFolderInstall', () => {
  test('emits setmodtype and copies the archive contents through unchanged', async () => {
    const result = await contentFolderInstall(['Content/Configurations/Foo.ini', 'Config/X.ini']);
    expect(result.instructions).toEqual([
      SETMODTYPE_CONTENT,
      { type: 'copy', source: 'Content/Configurations/Foo.ini', destination: 'Content/Configurations/Foo.ini' },
      { type: 'copy', source: 'Config/X.ini', destination: 'Config/X.ini' },
    ]);
  });
});
