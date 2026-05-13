import { beforeEach, vi, type Mock } from 'vitest';
import { fs, selectors, types, util } from 'vortex-api';
import {
  isUE4SSInstalled,
  notifyIfUE4SSMissing,
  ue4ssProxyAbsolutePath,
} from '../src/util/ue4ssState';

const mockedDiscovery = selectors.discoveryByGame as unknown as Mock;
const mockedStat = fs.statAsync as unknown as Mock;
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
  mockedStat.mockReset();
  mockedOpn.mockReset();
});

describe('ue4ssProxyAbsolutePath', () => {
  test('Steam discovery resolves to <gamePath>/Subnautica2/Binaries/Win64/dwmapi.dll', () => {
    expect(ue4ssProxyAbsolutePath({ path: '/games/Subnautica2', store: 'steam' })).toBe(
      '/games/Subnautica2/Subnautica2/Binaries/Win64/dwmapi.dll',
    );
  });

  test('Xbox discovery uses flat layout + xinput1_4.dll proxy', () => {
    expect(ue4ssProxyAbsolutePath({ path: '/xbox/Subnautica2', store: 'xbox' })).toBe(
      '/xbox/Subnautica2/Binaries/WinGDK/xinput1_4.dll',
    );
  });

  test('returns undefined when discovery has no path', () => {
    expect(ue4ssProxyAbsolutePath({ store: 'steam' })).toBeUndefined();
  });
});

describe('isUE4SSInstalled', () => {
  test('returns true when statAsync resolves for the proxy DLL', async () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    mockedStat.mockResolvedValueOnce({ isDirectory: () => false });
    expect(await isUE4SSInstalled(asExtensionApi(makeApi()))).toBe(true);
  });

  test('returns false when statAsync rejects (file missing)', async () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    mockedStat.mockRejectedValueOnce(new Error('ENOENT'));
    expect(await isUE4SSInstalled(asExtensionApi(makeApi()))).toBe(false);
  });

  test('returns false when the game is not discovered', async () => {
    mockedDiscovery.mockReturnValue(undefined);
    expect(await isUE4SSInstalled(asExtensionApi(makeApi()))).toBe(false);
  });
});

describe('notifyIfUE4SSMissing', () => {
  test('does not notify when UE4SS is installed', async () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    mockedStat.mockResolvedValueOnce({ isDirectory: () => false });
    const api = makeApi();
    await notifyIfUE4SSMissing(asExtensionApi(api));
    expect(api.sendNotification).not.toHaveBeenCalled();
  });

  test('sends a warning notification with a Get UE4SS action when missing', async () => {
    mockedDiscovery.mockReturnValue({ path: '/games/Subnautica2', store: 'steam' });
    mockedStat.mockRejectedValueOnce(new Error('ENOENT'));
    const api = makeApi();
    await notifyIfUE4SSMissing(asExtensionApi(api));
    expect(api.sendNotification).toHaveBeenCalledTimes(1);
    const notif = api.sendNotification.mock.calls[0]![0] as {
      type: string;
      title: string;
      actions: { title: string; action: () => void }[];
    };
    expect(notif.type).toBe('warning');
    expect(notif.title).toMatch(/UE4SS/);
    expect(notif.actions).toHaveLength(1);
    expect(notif.actions[0]!.title).toBe('Get UE4SS');
    notif.actions[0]!.action();
    expect(mockedOpn).toHaveBeenCalledWith('https://github.com/UE4SS-RE/RE-UE4SS/releases');
  });
});
