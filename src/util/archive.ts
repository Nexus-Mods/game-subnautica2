import { dirname, stem } from './paths';
import { getLogicModsPatterns, getUE4SSPatterns, matchesAnyPattern } from '../stopPatterns';

export function filterFiles(entries: readonly string[]): string[] {
  return entries.filter((e) => !e.endsWith('/') && !e.endsWith('\\'));
}

export function hasExt(file: string, ext: string): boolean {
  const target = ext.toLowerCase().replace(/^\./, '');
  const idx = file.lastIndexOf('.');
  return idx >= 0 && file.slice(idx + 1).toLowerCase() === target;
}

export function hasAnyExt(file: string, exts: readonly string[]): boolean {
  return exts.some((ext) => hasExt(file, ext));
}

export interface PakGroup {
  pak: string;
  siblings: string[];
}

const PAK_SIBLING_EXTS = ['ucas', 'utoc'] as const;

export function findPaksWithSiblings(files: readonly string[]): PakGroup[] {
  const entries = filterFiles(files);
  return entries
    .filter((f) => hasExt(f, 'pak'))
    .map((pak) => {
      const pakDir = dirname(pak);
      const pakStem = stem(pak);
      const siblings = entries.filter(
        (f) =>
          f !== pak &&
          dirname(f) === pakDir &&
          stem(f) === pakStem &&
          hasAnyExt(f, PAK_SIBLING_EXTS),
      );
      return { pak, siblings };
    });
}

export function containsLogicMods(files: readonly string[]): boolean {
  return matchesAnyPattern(filterFiles(files), getLogicModsPatterns());
}

export function containsUE4SSScripts(files: readonly string[]): boolean {
  return matchesAnyPattern(filterFiles(files), getUE4SSPatterns());
}
