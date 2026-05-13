import { GAME_ID, MOD_TYPE_PAK } from '../constants';
import { findPaksWithSiblings, containsLogicMods, containsUE4SSScripts } from '../util/archive';
import { basename } from '../util/paths';
import type { IInstallResult, IInstruction, ISupportedResult } from './types';

export function pakInstallerTest(
  files: readonly string[],
  gameId: string,
): Promise<ISupportedResult> {
  if (gameId !== GAME_ID) return Promise.resolve({ supported: false, requiredFiles: [] });
  if (containsLogicMods(files)) return Promise.resolve({ supported: false, requiredFiles: [] });
  if (containsUE4SSScripts(files)) return Promise.resolve({ supported: false, requiredFiles: [] });
  const groups = findPaksWithSiblings(files);
  return Promise.resolve({ supported: groups.length > 0, requiredFiles: [] });
}

export function pakInstall(files: readonly string[]): Promise<IInstallResult> {
  const groups = findPaksWithSiblings(files);
  const copies: IInstruction[] = groups.flatMap((g) =>
    [g.pak, ...g.siblings].map((source) => ({
      type: 'copy' as const,
      source,
      destination: basename(source),
    })),
  );
  const instructions: IInstruction[] = [
    { type: 'setmodtype', value: MOD_TYPE_PAK },
    ...copies,
  ];
  return Promise.resolve({ instructions });
}
