import {
  GAME_ID,
  MOD_TYPE_UE4SS_INJECTOR,
  UE4SS_DWMAPI_FILE,
  UE4SS_SETTINGS_FILE,
  UE4SS_XINPUT_FILE,
} from '../constants';
import { filterFiles } from '../util/archive';
import { basename, dirname, splitSegments } from '../util/paths';
import { getUE4SSInjectorPatterns, matchesAnyPattern } from '../stopPatterns';
import type { IInstallResult, IInstruction, ISupportedResult } from './types';

const MARKER_FILES = [
  UE4SS_DWMAPI_FILE.toLowerCase(),
  UE4SS_XINPUT_FILE.toLowerCase(),
  UE4SS_SETTINGS_FILE.toLowerCase(),
];

function findMarker(entries: readonly string[]): string | undefined {
  const matches = entries.filter((f) => MARKER_FILES.includes(basename(f).toLowerCase()));
  if (matches.length === 0) return undefined;
  return [...matches].sort((a, b) => splitSegments(a).length - splitSegments(b).length)[0];
}

function startsWithDir(file: string, prefix: string): boolean {
  if (prefix === '') return true;
  return file.startsWith(prefix + '/') || file.startsWith(prefix + '\\');
}

function stripDirPrefix(file: string, prefix: string): string {
  if (prefix === '') return file;
  return file.slice(prefix.length + 1);
}

export function ue4ssInjectorTest(
  files: readonly string[],
  gameId: string,
): Promise<ISupportedResult> {
  if (gameId !== GAME_ID) return Promise.resolve({ supported: false, requiredFiles: [] });
  return Promise.resolve({
    supported: matchesAnyPattern(files, getUE4SSInjectorPatterns()),
    requiredFiles: [],
  });
}

export function ue4ssInjectorInstall(files: readonly string[]): Promise<IInstallResult> {
  const entries = filterFiles(files);
  const marker = findMarker(entries);
  if (marker === undefined) {
    return Promise.resolve({
      instructions: [{ type: 'setmodtype', value: MOD_TYPE_UE4SS_INJECTOR }],
    });
  }
  const stripPrefix = dirname(marker).replace(/\\/g, '/');
  const copies: IInstruction[] = entries
    .filter((f) => startsWithDir(f.replace(/\\/g, '/'), stripPrefix))
    .map((source) => ({
      type: 'copy' as const,
      source,
      destination: stripDirPrefix(source.replace(/\\/g, '/'), stripPrefix),
    }));
  return Promise.resolve({
    instructions: [{ type: 'setmodtype', value: MOD_TYPE_UE4SS_INJECTOR }, ...copies],
  });
}
