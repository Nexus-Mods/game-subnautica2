import { GAME_ID, MOD_TYPE_ROOT, PAK_TOP_LEVEL_DIRS } from '../constants';
import { filterFiles } from '../util/archive';
import { hasSegment } from '../util/paths';
import type { IInstallResult, IInstruction, ISupportedResult } from './types';

function hasAnyTopLevelDir(files: readonly string[]): boolean {
  return PAK_TOP_LEVEL_DIRS.some((dir) => files.some((f) => hasSegment(f, dir)));
}

export function rootInstallerTest(
  files: readonly string[],
  gameId: string,
): Promise<ISupportedResult> {
  if (gameId !== GAME_ID) return Promise.resolve({ supported: false, requiredFiles: [] });
  return Promise.resolve({
    supported: hasAnyTopLevelDir(filterFiles(files)),
    requiredFiles: [],
  });
}

export function rootInstall(files: readonly string[]): Promise<IInstallResult> {
  const copies: IInstruction[] = filterFiles(files).map((source) => ({
    type: 'copy' as const,
    source,
    destination: source,
  }));
  return Promise.resolve({
    instructions: [{ type: 'setmodtype', value: MOD_TYPE_ROOT }, ...copies],
  });
}
