import { beforeEach, vi, type Mock } from 'vitest';
import { fs, selectors, types, util } from 'vortex-api';
import {
  isThisGameActive,
  openInjectorFile,
  openModsFile,
  openNexusPage,
  regenerateModsFile,
} from '../src/util/ue4ssState';

const mockedDiscovery = selectors.discoveryByGame as unknown as Mock;
const mockedActive = selectors.activeGameId as unknown as Mock;
const mockedStat = fs.statAsync as unknown as Mock;
const mockedReaddir = fs.readdirAsync as unknown as Mock;
const mockedWrite = fs.writeFileAsync as unknown as Mock;
const mockedOpn = util.opn as unknown as Mock;

interface FakeApi {
  getState: () => unknown;
  sendNotification: Mock;
}

function makeApi(): FakeApi {
  return {
    getState: () => ({}),
    sendNotification: vi.fn(),
  };
}

function asExtensionApi(api: FakeApi): types.IExtensionApi {
  return api as unknown as types.IExtensionApi;
}

beforeEach(() => {
  mockedDiscovery.mockReset();
  mockedActive.mockReset();
  mockedStat.mockReset();
  mockedReaddir.mockReset();
  mockedWrite.mockReset();
  mockedOpn.mockReset();
});

describe('isThisGameActive', () => {
  test('true when activeGameId is subnautica2', () => {
    mockedActive.mockReturnValue('subnautica2');
    expect(isThisGameActive(asExtensionApi(makeApi()))).toBe(true);
  });

  test('false when activeGameId is some other game', () => {
    mockedActive.mockReturnValue('skyrim');
    expect(isThisGameActive(asExtensionApi(makeApi()))).toBe(false);
  });

  test('false when no game is active', () => {
    mockedActive.mockReturnValue(undefined);
    expect(isThisGameActive(asExtensionApi(makeApi()))).toBe(false);
  });
});

describe('openInjectorFile / openModsFile / openNexusPage', () => {
  test('openInjectorFile opens the absolute path of a file in Binaries/<arch>', () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    openInjectorFile(asExtensionApi(makeApi()), 'UE4SS-settings.ini');
    expect(mockedOpn).toHaveBeenCalledWith(
      '/games/Subnautica2/Subnautica2/Binaries/Win64/UE4SS-settings.ini',
    );
  });

  test('openInjectorFile is a no-op when the game is not discovered', () => {
    mockedDiscovery.mockReturnValue(undefined);
    openInjectorFile(asExtensionApi(makeApi()), 'UE4SS-settings.ini');
    expect(mockedOpn).not.toHaveBeenCalled();
  });

  test('openModsFile opens mods.txt under ue4ss/Mods (Xbox arch)', () => {
    mockedDiscovery.mockReturnValue({ path: '/xbox/Subnautica2', store: 'xbox' });
    openModsFile(asExtensionApi(makeApi()));
    expect(mockedOpn).toHaveBeenCalledWith(
      '/xbox/Subnautica2/Binaries/WinGDK/ue4ss/Mods/mods.txt',
    );
  });

  test('openNexusPage navigates to the Subnautica 2 Nexus page', () => {
    openNexusPage();
    expect(mockedOpn).toHaveBeenCalledWith('https://www.nexusmods.com/subnautica2');
  });
});

describe('regenerateModsFile', () => {
  test('writes mods.txt listing each deployed Lua mod folder as enabled', async () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    mockedReaddir.mockResolvedValueOnce(['ModA', 'ModB', 'mods.txt']);
    mockedStat.mockImplementation(((p: string) =>
      Promise.resolve({ isDirectory: () => !p.endsWith('.txt') })) as never);
    await regenerateModsFile(asExtensionApi(makeApi()));
    expect(mockedWrite).toHaveBeenCalledTimes(1);
    const call = mockedWrite.mock.calls[0] as [string, string];
    expect(call[0]).toBe('/games/Subnautica2/Subnautica2/Binaries/Win64/ue4ss/Mods/mods.txt');
    expect(call[1]).toBe('ModA : 1\nModB : 1\n');
  });

  test('writes an empty mods.txt when no mod folders exist', async () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    mockedReaddir.mockResolvedValueOnce([]);
    await regenerateModsFile(asExtensionApi(makeApi()));
    expect(mockedWrite).toHaveBeenCalledTimes(1);
    const call = mockedWrite.mock.calls[0] as [string, string];
    expect(call[1]).toBe('');
  });

  test('skips file entries (non-directories)', async () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    mockedReaddir.mockResolvedValueOnce(['RealMod', 'stray.lua']);
    mockedStat.mockImplementation(((p: string) =>
      Promise.resolve({ isDirectory: () => p.endsWith('RealMod') })) as never);
    await regenerateModsFile(asExtensionApi(makeApi()));
    const call = mockedWrite.mock.calls[0] as [string, string];
    expect(call[1]).toBe('RealMod : 1\n');
  });

  test('is a no-op when the game is not discovered', async () => {
    mockedDiscovery.mockReturnValue(undefined);
    await regenerateModsFile(asExtensionApi(makeApi()));
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  test('writes mods.txt at the Xbox WinGDK location', async () => {
    mockedDiscovery.mockReturnValue({ path: '/xbox/Subnautica2', store: 'xbox' });
    mockedReaddir.mockResolvedValueOnce(['BPModLoaderMod']);
    mockedStat.mockResolvedValue({ isDirectory: () => true } as never);
    await regenerateModsFile(asExtensionApi(makeApi()));
    const call = mockedWrite.mock.calls[0] as [string, string];
    expect(call[0]).toBe('/xbox/Subnautica2/Binaries/WinGDK/ue4ss/Mods/mods.txt');
  });
});
