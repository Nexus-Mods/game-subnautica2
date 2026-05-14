import { dirname, stem } from './paths';
import { PAK_EXTENSIONS, getLogicModsPatterns, getUE4SSPatterns, matchesAnyPattern } from '../stopPatterns';

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
  files: string[];
}

export function findPakGroups(files: readonly string[]): PakGroup[] {
  const entries = filterFiles(files);
  const groups = new Map<string, string[]>();
  for (const f of entries) {
    if (!hasAnyExt(f, PAK_EXTENSIONS)) continue;
    const key = `${dirname(f)}\0${stem(f)}`;
    let list = groups.get(key);
    if (!list) {
      list = [];
      groups.set(key, list);
    }
    list.push(f);
  }
  return Array.from(groups.values()).map((g) => ({ files: g }));
}

export function containsLogicMods(files: readonly string[]): boolean {
  return matchesAnyPattern(filterFiles(files), getLogicModsPatterns());
}

export function containsUE4SSScripts(files: readonly string[]): boolean {
  return matchesAnyPattern(filterFiles(files), getUE4SSPatterns());
}
