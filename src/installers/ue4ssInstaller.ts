import { GAME_ID, MOD_TYPE_UE4SS } from '../constants';
import { filterFiles, containsUE4SSScripts, hasExt } from '../util/archive';
import { splitSegments } from '../util/paths';
import type { IInstallResult, IInstruction, ISupportedResult } from './types';

const UE4SS_FILE_EXTS = ['lua'];
const UE4SS_NAMED_FILES = ['enabled.txt'];

function isUE4SSFile(file: string): boolean {
  const segs = splitSegments(file);
  const tail = segs[segs.length - 1]?.toLowerCase() ?? '';
  if (UE4SS_NAMED_FILES.includes(tail)) return true;
  return UE4SS_FILE_EXTS.some((ext) => hasExt(file, ext));
}

function inferModFolder(file: string): { modFolder: string; relPath: string } {
  const segs = splitSegments(file);
  if (segs.length === 1) {
    const only = segs[0]!;
    const stem = only.replace(/\.[^.]+$/, '');
    return { modFolder: stem, relPath: only };
  }
  const modFolder = segs[0]!;
  const relPath = segs.slice(1).join('/');
  return { modFolder, relPath };
}

export function ue4ssInstallerTest(
  files: readonly string[],
  gameId: string,
): Promise<ISupportedResult> {
  if (gameId !== GAME_ID) return Promise.resolve({ supported: false, requiredFiles: [] });
  return Promise.resolve({ supported: containsUE4SSScripts(files), requiredFiles: [] });
}

export function ue4ssInstall(files: readonly string[]): Promise<IInstallResult> {
  const copies: IInstruction[] = filterFiles(files)
    .filter((f) => isUE4SSFile(f))
    .map((source) => {
      const { modFolder, relPath } = inferModFolder(source);
      return {
        type: 'copy' as const,
        source,
        destination: `${modFolder}/${relPath}`,
      };
    });
  const instructions: IInstruction[] = [
    { type: 'setmodtype', value: MOD_TYPE_UE4SS },
    ...copies,
  ];
  return Promise.resolve({ instructions });
}
