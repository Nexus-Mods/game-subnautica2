import { fs } from 'vortex-api';
import {
  ARCH_WIN64,
  ARCH_WINGDK,
  INSTALL_DIR,
  LOGIC_MODS_RELPATH,
  PAK_MODS_RELPATH,
} from './constants';
import { joinRel } from './util/paths';

export interface IDiscovery {
  path: string;
  store?: string;
}

export interface IResolvedModPaths {
  pak: string;
  logicMods: string;
  ue4ss: string;
}

export function resolveArchDir(isXbox: boolean): string {
  return isXbox ? ARCH_WINGDK : ARCH_WIN64;
}

export function ue4ssInjectorPath(isXbox: boolean): string {
  return `${INSTALL_DIR}/Binaries/${resolveArchDir(isXbox)}`;
}

// UE4SS 3.x lays out the runtime tree as `Binaries/<arch>/ue4ss/...`, with the
// injector DLLs one level up at `Binaries/<arch>/`. Anything addressed inside
// the ue4ss runtime (settings.ini, Mods/, logs) should hang off this root.
export function ue4ssRootPath(isXbox: boolean): string {
  return `${ue4ssInjectorPath(isXbox)}/ue4ss`;
}

export function ue4ssModsPath(isXbox: boolean): string {
  return `${ue4ssRootPath(isXbox)}/Mods`;
}

export function resolveGamePath(gamePath: string, rel: string, isXbox: boolean): string {
  const prefix = `${INSTALL_DIR}/`;
  const tail = isXbox && rel.startsWith(prefix) ? rel.slice(prefix.length) : rel;
  const joined = joinRel(tail);
  if (joined === '') return gamePath;
  const sep = gamePath.endsWith('/') || gamePath.endsWith('\\') ? '' : '/';
  return `${gamePath}${sep}${joined}`;
}

export function resolveModPaths(discovery: IDiscovery): IResolvedModPaths {
  const isXbox = discovery.store === 'xbox';
  return {
    pak: resolveGamePath(discovery.path, PAK_MODS_RELPATH, isXbox),
    logicMods: resolveGamePath(discovery.path, LOGIC_MODS_RELPATH, isXbox),
    ue4ss: resolveGamePath(discovery.path, ue4ssModsPath(isXbox), isXbox),
  };
}

export async function prepareForModding(discovery: IDiscovery): Promise<void> {
  if (!discovery?.path) {
    throw new Error('Subnautica 2: discovery.path is missing — cannot prepare mod folders.');
  }
  const paths = resolveModPaths(discovery);
  await Promise.all([
    fs.ensureDirWritableAsync(paths.pak),
    fs.ensureDirWritableAsync(paths.logicMods),
    fs.ensureDirWritableAsync(paths.ue4ss),
  ]);
}
