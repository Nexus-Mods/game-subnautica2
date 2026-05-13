import { fs, selectors, types, util } from 'vortex-api';
import {
  GAME_ID,
  NEXUS_ID,
  UE4SS_DWMAPI_FILE,
  UE4SS_RELEASES_URL,
  UE4SS_XINPUT_FILE,
} from '../constants';
import { resolveGamePath, ue4ssInjectorPath, ue4ssModsPath } from '../game';

interface VortexDiscovery {
  path?: string;
  store?: string;
}

const NOTIF_ID = 'subnautica2-ue4ss-missing';

type DiscoveryByGameFn = (state: unknown, gameId: string) => VortexDiscovery | undefined;
type ActiveGameIdFn = (state: unknown) => string | undefined;

function getDiscovery(api: types.IExtensionApi, gameId: string): VortexDiscovery | undefined {
  const lookup = selectors.discoveryByGame as unknown as DiscoveryByGameFn;
  return lookup(api.getState(), gameId);
}

function getActiveGameId(api: types.IExtensionApi): string | undefined {
  const lookup = selectors.activeGameId as unknown as ActiveGameIdFn;
  return lookup(api.getState());
}

function opn(url: string): void {
  void (util as unknown as { opn: (u: string) => Promise<void> }).opn(url);
}

export function ue4ssProxyAbsolutePath(discovery: VortexDiscovery): string | undefined {
  if (!discovery.path) return undefined;
  const isXbox = discovery.store === 'xbox';
  const proxy = isXbox ? UE4SS_XINPUT_FILE : UE4SS_DWMAPI_FILE;
  return resolveGamePath(discovery.path, `${ue4ssInjectorPath(isXbox)}/${proxy}`, isXbox);
}

export async function isUE4SSInstalled(
  api: types.IExtensionApi,
  gameId: string = GAME_ID,
): Promise<boolean> {
  const discovery = getDiscovery(api, gameId);
  if (!discovery) return false;
  const absolute = ue4ssProxyAbsolutePath(discovery);
  if (absolute === undefined) return false;
  try {
    await fs.statAsync(absolute);
    return true;
  } catch {
    return false;
  }
}

export async function notifyIfUE4SSMissing(
  api: types.IExtensionApi,
  gameId: string = GAME_ID,
): Promise<void> {
  if (await isUE4SSInstalled(api, gameId)) return;
  api.sendNotification?.({
    id: NOTIF_ID,
    type: 'warning',
    title: 'UE4SS not detected',
    message:
      'Install UE4SS to use Lua scripts or Blueprint mods for Subnautica 2. ' +
      'Drop the UE4SS archive into the Extensions drop zone and Vortex will route it for you.',
    actions: [
      {
        title: 'Get UE4SS',
        action: (): void => opn(UE4SS_RELEASES_URL),
      },
    ],
  });
}

export function isThisGameActive(api: types.IExtensionApi): boolean {
  return getActiveGameId(api) === GAME_ID;
}

function injectorFilePath(api: types.IExtensionApi, filename: string): string | undefined {
  const discovery = getDiscovery(api, GAME_ID);
  if (!discovery?.path) return undefined;
  const isXbox = discovery.store === 'xbox';
  return resolveGamePath(discovery.path, `${ue4ssInjectorPath(isXbox)}/${filename}`, isXbox);
}

function modsFilePath(api: types.IExtensionApi): string | undefined {
  const discovery = getDiscovery(api, GAME_ID);
  if (!discovery?.path) return undefined;
  const isXbox = discovery.store === 'xbox';
  return resolveGamePath(discovery.path, `${ue4ssModsPath(isXbox)}/mods.txt`, isXbox);
}

export function openInjectorFile(api: types.IExtensionApi, filename: string): void {
  const target = injectorFilePath(api, filename);
  if (target !== undefined) opn(target);
}

export function openModsFile(api: types.IExtensionApi): void {
  const target = modsFilePath(api);
  if (target !== undefined) opn(target);
}

export function openNexusPage(): void {
  opn(`https://www.nexusmods.com/${NEXUS_ID}`);
}
