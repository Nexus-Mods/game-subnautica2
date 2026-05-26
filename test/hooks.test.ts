import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fs, selectors } from 'vortex-api';
import { listModDirs, regenerateModsTxt } from '../src/hooks';

const mockActiveGameId = vi.mocked(selectors.activeGameId);
const mockDiscoveryByGame = vi.mocked(selectors.discoveryByGame);
const mockReaddirAsync = vi.mocked(fs.readdirAsync);
const mockStatAsync = vi.mocked(fs.statAsync);
const mockWriteFileAsync = vi.mocked(fs.writeFileAsync);

const fakeApi = (activeId: string, gamePath?: string, store?: string) => ({
  getState: () => ({}),
  __setup__() {
    (mockActiveGameId as unknown as ReturnType<typeof vi.fn>).mockReturnValue(activeId);
    (mockDiscoveryByGame as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      gamePath ? { path: gamePath, store } : undefined,
    );
  },
});

describe('listModDirs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists only directories, skipping mods.txt and mods.json', async () => {
    mockReaddirAsync.mockResolvedValue(['ModA', 'ModB', 'mods.txt', 'mods.json', 'readme.txt'] as never);
    mockStatAsync.mockImplementation((p: string) => {
      const name = p.split('/').pop();
      return Promise.resolve({ isDirectory: () => name !== 'readme.txt' }) as never;
    });
    const dirs = await listModDirs('/fake/Mods');
    expect(dirs).toEqual(['ModA', 'ModB']);
  });

  it('returns empty array when directory does not exist', async () => {
    mockReaddirAsync.mockRejectedValue(new Error('ENOENT') as never);
    const dirs = await listModDirs('/fake/missing');
    expect(dirs).toEqual([]);
  });
});

describe('regenerateModsTxt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes mods.txt with enabled entries for Steam', async () => {
    const api = fakeApi('subnautica2', '/games/SN2', 'steam');
    api.__setup__();
    mockReaddirAsync.mockResolvedValue(['ModA', 'ModB'] as never);
    mockStatAsync.mockResolvedValue({ isDirectory: () => true } as never);

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).toHaveBeenCalledWith(
      '/games/SN2/Subnautica2/Binaries/Win64/ue4ss/Mods/mods.txt',
      'ModA : 1\nModB : 1\n',
    );
  });

  it('uses WinGDK path for Xbox', async () => {
    const api = fakeApi('subnautica2', '/games/SN2', 'xbox');
    api.__setup__();
    mockReaddirAsync.mockResolvedValue(['ModA'] as never);
    mockStatAsync.mockResolvedValue({ isDirectory: () => true } as never);

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).toHaveBeenCalledWith(
      '/games/SN2/Binaries/WinGDK/ue4ss/Mods/mods.txt',
      'ModA : 1\n',
    );
  });

  it('no-ops when a different game is active', async () => {
    const api = fakeApi('othergame', '/games/SN2', 'steam');
    api.__setup__();

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).not.toHaveBeenCalled();
  });

  it('no-ops when discovery has no path', async () => {
    const api = fakeApi('subnautica2', undefined);
    api.__setup__();

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).not.toHaveBeenCalled();
  });

  it('writes empty file when no mod directories exist', async () => {
    const api = fakeApi('subnautica2', '/games/SN2', 'steam');
    api.__setup__();
    mockReaddirAsync.mockResolvedValue([] as never);

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).toHaveBeenCalledWith(
      '/games/SN2/Subnautica2/Binaries/Win64/ue4ss/Mods/mods.txt',
      '',
    );
  });
});
