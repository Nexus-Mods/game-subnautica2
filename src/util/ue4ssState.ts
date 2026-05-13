import { fs, selectors, types, util } from 'vortex-api';
import {
  GAME_ID,
  NEXUS_ID,
  UE4SS_DWMAPI_FILE,
  UE4SS_SETTINGS_FILE,
  UE4SS_XINPUT_FILE,
} from '../constants';
import { resolveGamePath, ue4ssInjectorPath, ue4ssModsPath } from '../game';

interface VortexDiscovery {
  path?: string;
  store?: string;
}

type RelPath = string | ((isXbox: boolean) => string);

function getDiscovery(api: types.IExtensionApi, gameId: string): VortexDiscovery | undefined {
  return (
    selectors.discoveryByGame as unknown as (s: unknown, g: string) => VortexDiscovery | undefined
  )(api.getState(), gameId);
}

function getActiveGameId(api: types.IExtensionApi): string | undefined {
  return (selectors.activeGameId as unknown as (s: unknown) => string | undefined)(api.getState());
}

function opn(url: string): void {
  void (util as unknown as { opn: (u: string) => Promise<void> }).opn(url);
}

function resolveFor(d: VortexDiscovery | undefined, rel: RelPath): string | undefined {
  if (!d?.path) return undefined;
  const isXbox = d.store === 'xbox';
  const resolved = typeof rel === 'function' ? rel(isXbox) : rel;
  return resolveGamePath(d.path, resolved, isXbox);
}

function gameAbsPath(api: types.IExtensionApi, rel: RelPath): string | undefined {
  return resolveFor(getDiscovery(api, GAME_ID), rel);
}

const proxyFile = (isXbox: boolean): string => (isXbox ? UE4SS_XINPUT_FILE : UE4SS_DWMAPI_FILE);

export function ue4ssProxyAbsolutePath(discovery: VortexDiscovery): string | undefined {
  return resolveFor(discovery, (isXbox) => `${ue4ssInjectorPath(isXbox)}/${proxyFile(isXbox)}`);
}

export function ue4ssSettingsAbsolutePath(api: types.IExtensionApi): string | undefined {
  return gameAbsPath(api, (isXbox) => `${ue4ssInjectorPath(isXbox)}/${UE4SS_SETTINGS_FILE}`);
}

export function ue4ssModsTxtAbsolutePath(api: types.IExtensionApi): string | undefined {
  return gameAbsPath(api, (isXbox) => `${ue4ssModsPath(isXbox)}/mods.txt`);
}

async function fileExists(absolute: string | undefined): Promise<boolean> {
  if (!absolute) return false;
  try {
    await fs.statAsync(absolute);
    return true;
  } catch {
    return false;
  }
}

export async function isUE4SSInstalled(
  api: types.IExtensionApi,
  gameId: string = GAME_ID,
): Promise<boolean> {
  const discovery = getDiscovery(api, gameId);
  return fileExists(discovery && ue4ssProxyAbsolutePath(discovery));
}

export function isThisGameActive(api: types.IExtensionApi): boolean {
  return getActiveGameId(api) === GAME_ID;
}

export function openInjectorFile(api: types.IExtensionApi, filename: string): void {
  const target = gameAbsPath(api, (isXbox) => `${ue4ssInjectorPath(isXbox)}/${filename}`);
  if (target !== undefined) opn(target);
}

export function openInjectorFolder(api: types.IExtensionApi): void {
  const target = gameAbsPath(api, ue4ssInjectorPath);
  if (target !== undefined) opn(target);
}

export function openModsFile(api: types.IExtensionApi): void {
  const target = gameAbsPath(api, (isXbox) => `${ue4ssModsPath(isXbox)}/mods.txt`);
  if (target !== undefined) opn(target);
}

export function openNexusPage(): void {
  opn(`https://www.nexusmods.com/${NEXUS_ID}`);
}

export function openUrl(url: string): void {
  opn(url);
}

export async function isUE4SSSettingsPresent(api: types.IExtensionApi): Promise<boolean> {
  return fileExists(ue4ssSettingsAbsolutePath(api));
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

function parseModsTxtNames(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith(';') && !line.startsWith('#'))
    .map((line) => line.split(':')[0]!.trim())
    .filter((name) => name.length > 0);
}

export async function modsTxtMatchesDeployedDirs(api: types.IExtensionApi): Promise<boolean> {
  const modsDir = gameAbsPath(api, ue4ssModsPath);
  const txtPath = ue4ssModsTxtAbsolutePath(api);
  if (modsDir === undefined || txtPath === undefined) return true;
  const dirs = await listModDirs(modsDir);
  let content: string;
  try {
    content = String(await fs.readFileAsync(txtPath, { encoding: 'utf8' } as never));
  } catch {
    return dirs.length === 0;
  }
  const listed = parseModsTxtNames(content);
  if (listed.length !== dirs.length) return false;
  const a = [...listed].sort();
  const b = [...dirs].sort();
  return a.every((name, i) => name === b[i]);
}

export async function regenerateModsFile(api: types.IExtensionApi): Promise<void> {
  const modsDir = gameAbsPath(api, ue4ssModsPath);
  if (modsDir === undefined) return;
  const dirs = await listModDirs(modsDir);
  const content = dirs.map((d) => `${d} : 1`).join('\n') + (dirs.length > 0 ? '\n' : '');
  await fs.writeFileAsync(`${modsDir}/mods.txt`, content);
}
