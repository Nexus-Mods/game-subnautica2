import { fs, selectors, types, util } from 'vortex-api';
import {
  GAME_ID,
  NEXUS_ID,
} from '../constants';
import { resolveGamePath, ue4ssInjectorPath, ue4ssModsPath } from '../game';

interface VortexDiscovery {
  path?: string;
  store?: string;
}

type RelPath = string | ((isXbox: boolean) => string);

function getDiscovery(api: types.IExtensionApi): VortexDiscovery | undefined {
  return (
    selectors.discoveryByGame as unknown as (s: unknown, g: string) => VortexDiscovery | undefined
  )(api.getState(), GAME_ID);
}

function getActiveGameId(api: types.IExtensionApi): string | undefined {
  return (selectors.activeGameId as unknown as (s: unknown) => string | undefined)(api.getState());
}

function opn(url: string): void {
  void (util as unknown as { opn: (u: string) => Promise<void> }).opn(url);
}

function gameAbsPath(api: types.IExtensionApi, rel: RelPath): string | undefined {
  const d = getDiscovery(api);
  if (!d?.path) return undefined;
  const isXbox = d.store === 'xbox';
  const resolved = typeof rel === 'function' ? rel(isXbox) : rel;
  return resolveGamePath(d.path, resolved, isXbox);
}

export function isThisGameActive(api: types.IExtensionApi): boolean {
  return getActiveGameId(api) === GAME_ID;
}

export function openInjectorFile(api: types.IExtensionApi, filename: string): void {
  const target = gameAbsPath(api, (isXbox) => `${ue4ssInjectorPath(isXbox)}/${filename}`);
  if (target !== undefined) opn(target);
}

export function openModsFile(api: types.IExtensionApi): void {
  const target = gameAbsPath(api, (isXbox) => `${ue4ssModsPath(isXbox)}/mods.txt`);
  if (target !== undefined) opn(target);
}

export function openNexusPage(): void {
  opn(`https://www.nexusmods.com/${NEXUS_ID}`);
}

export async function listModDirs(modsDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdirAsync(modsDir);
  } catch {
    return [];
  }
  const candidates = entries.filter((e) => e !== 'mods.txt' && e !== 'mods.json');
  const checked = await Promise.all(
    candidates.map(async (entry) => {
      try {
        const stat = (await fs.statAsync(`${modsDir}/${entry}`)) as { isDirectory: () => boolean };
        return stat.isDirectory() ? entry : null;
      } catch {
        return null;
      }
    }),
  );
  return checked.filter((e): e is string => e !== null);
}

export async function regenerateModsFile(api: types.IExtensionApi): Promise<void> {
  const modsDir = gameAbsPath(api, ue4ssModsPath);
  if (modsDir === undefined) return;
  const dirs = await listModDirs(modsDir);
  const content = dirs.map((d) => `${d} : 1`).join('\n') + (dirs.length > 0 ? '\n' : '');
  await fs.writeFileAsync(`${modsDir}/mods.txt`, content);
}
