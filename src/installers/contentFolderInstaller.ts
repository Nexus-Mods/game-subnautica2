import { CONTENT_TOP_LEVEL_DIRS, GAME_ID, MOD_TYPE_CONTENT_FOLDER } from '../constants';
import { containsLogicMods, containsUE4SSScripts, filterFiles } from '../util/archive';
import { splitSegments } from '../util/paths';
import type { IInstallResult, IInstruction, ISupportedResult } from './types';

function firstSegment(file: string): string | undefined {
  return splitSegments(file)[0]?.toLowerCase();
}

function hasContentTopLevel(files: readonly string[]): boolean {
  const targets = CONTENT_TOP_LEVEL_DIRS.map((d) => d.toLowerCase());
  return files.some((f) => {
    const seg = firstSegment(f);
    return seg !== undefined && targets.includes(seg);
  });
}

export function contentFolderInstallerTest(
  files: readonly string[],
  gameId: string,
): Promise<ISupportedResult> {
  if (gameId !== GAME_ID) return Promise.resolve({ supported: false, requiredFiles: [] });
  if (containsLogicMods(files)) return Promise.resolve({ supported: false, requiredFiles: [] });
  if (containsUE4SSScripts(files)) return Promise.resolve({ supported: false, requiredFiles: [] });
  return Promise.resolve({
    supported: hasContentTopLevel(filterFiles(files)),
    requiredFiles: [],
  });
}

export function contentFolderInstall(files: readonly string[]): Promise<IInstallResult> {
  const copies: IInstruction[] = filterFiles(files).map((source) => ({
    type: 'copy' as const,
    source,
    destination: source,
  }));
  return Promise.resolve({
    instructions: [{ type: 'setmodtype', value: MOD_TYPE_CONTENT_FOLDER }, ...copies],
  });
}
