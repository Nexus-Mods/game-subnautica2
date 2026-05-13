import { GAME_ID, MOD_TYPE_PAK_ALT } from '../constants';
import { containsLogicMods, containsUE4SSScripts, filterFiles, hasExt } from '../util/archive';
import { hasSegment, pathAfterSegment } from '../util/paths';
import { getPakPatterns, matchesAnyPattern } from '../stopPatterns';
import type { IInstallResult, IInstruction, ISupportedResult } from './types';

const PAK_EXTENSIONS = ['pak', 'ucas', 'utoc'];

function hasPaksDir(files: readonly string[]): boolean {
  return files.some((f) => hasSegment(f, 'paks'));
}

function hasModsDir(files: readonly string[]): boolean {
  return files.some((f) => hasSegment(f, '~mods'));
}

export function pakAltInstallerTest(
  files: readonly string[],
  gameId: string,
): Promise<ISupportedResult> {
  if (gameId !== GAME_ID) return Promise.resolve({ supported: false, requiredFiles: [] });
  if (containsLogicMods(files)) return Promise.resolve({ supported: false, requiredFiles: [] });
  if (containsUE4SSScripts(files)) return Promise.resolve({ supported: false, requiredFiles: [] });
  const entries = filterFiles(files);
  const matches =
    matchesAnyPattern(entries, getPakPatterns()) && hasPaksDir(entries) && !hasModsDir(entries);
  return Promise.resolve({ supported: matches, requiredFiles: [] });
}

export function pakAltInstall(files: readonly string[]): Promise<IInstallResult> {
  const copies: IInstruction[] = filterFiles(files)
    .filter((f) => PAK_EXTENSIONS.some((ext) => hasExt(f, ext)))
    .map((source): IInstruction | null => {
      const tail = pathAfterSegment(source, 'paks');
      if (tail === null) return null;
      return { type: 'copy', source, destination: tail };
    })
    .filter((i): i is IInstruction => i !== null);
  return Promise.resolve({
    instructions: [{ type: 'setmodtype', value: MOD_TYPE_PAK_ALT }, ...copies],
  });
}
