import { fs, selectors, types, util } from 'vortex-api';
import {
  GAME_ID,
  UE4SS_DWMAPI_FILE,
  UE4SS_RELEASES_URL,
  UE4SS_XINPUT_FILE,
} from '../constants';
import { resolveGamePath, ue4ssInjectorPath } from '../game';

interface VortexDiscovery {
  path?: string;
  store?: string;
}

const NOTIF_ID = 'subnautica2-ue4ss-missing';

type DiscoveryByGameFn = (state: unknown, gameId: string) => VortexDiscovery | undefined;

function getDiscovery(api: types.IExtensionApi, gameId: string): VortexDiscovery | undefined {
  const lookup = selectors.discoveryByGame as unknown as DiscoveryByGameFn;
  return lookup(api.getState(), gameId);
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
        action: (): void => {
          void (util as unknown as { opn: (url: string) => Promise<void> }).opn(UE4SS_RELEASES_URL);
        },
      },
    ],
  });
}
