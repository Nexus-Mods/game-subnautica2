import { dirname, stem } from './paths';
import { matchesAnyPattern, getLogicModsPatterns, getUE4SSPatterns } from '../stopPatterns';

export function filterFiles(entries: readonly string[]): string[] {
  return entries.filter((e) => !e.endsWith('/') && !e.endsWith('\\'));
}

export function hasExt(file: string, ext: string): boolean {
  const target = ext.toLowerCase().replace(/^\./, '');
  const idx = file.lastIndexOf('.');
  if (idx < 0) return false;
  return file.slice(idx + 1).toLowerCase() === target;
}

export interface PakGroup {
  pak: string;
  siblings: string[];
}

const PAK_SIBLING_EXTS = ['ucas', 'utoc'] as const;

export function findPaksWithSiblings(files: readonly string[]): PakGroup[] {
  const entries = filterFiles(files);
  const paks = entries.filter((f) => hasExt(f, 'pak'));
  return paks.map((pak) => {
    const pakDir = dirname(pak);
    const pakStem = stem(pak);
    const siblings = entries.filter((f) => {
      if (f === pak) return false;
      if (dirname(f) !== pakDir) return false;
      if (stem(f) !== pakStem) return false;
      return PAK_SIBLING_EXTS.some((ext) => hasExt(f, ext));
    });
    return { pak, siblings };
  });
}

export function containsLogicMods(files: readonly string[]): boolean {
  return matchesAnyPattern(filterFiles(files), getLogicModsPatterns());
}

export function containsUE4SSScripts(files: readonly string[]): boolean {
  return matchesAnyPattern(filterFiles(files), getUE4SSPatterns());
}
