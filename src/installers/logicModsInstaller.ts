import { GAME_ID, MOD_TYPE_LOGICMODS } from '../constants';
import { filterFiles, containsLogicMods, hasExt } from '../util/archive';
import { pathAfterSegment } from '../util/paths';
import type { IInstallResult, IInstruction, ISupportedResult } from './types';

const PAK_EXTENSIONS = ['pak', 'ucas', 'utoc'];

export function logicModsInstallerTest(
  files: readonly string[],
  gameId: string,
): Promise<ISupportedResult> {
  if (gameId !== GAME_ID) return Promise.resolve({ supported: false, requiredFiles: [] });
  return Promise.resolve({ supported: containsLogicMods(files), requiredFiles: [] });
}

export function logicModsInstall(files: readonly string[]): Promise<IInstallResult> {
  const copies: IInstruction[] = filterFiles(files)
    .filter((f) => PAK_EXTENSIONS.some((ext) => hasExt(f, ext)))
    .map((source): IInstruction | null => {
      const tail = pathAfterSegment(source, 'logicmods');
      if (tail === null) return null;
      return { type: 'copy', source, destination: tail };
    })
    .filter((i): i is IInstruction => i !== null);
  const instructions: IInstruction[] = [
    { type: 'setmodtype', value: MOD_TYPE_LOGICMODS },
    ...copies,
  ];
  return Promise.resolve({ instructions });
}
