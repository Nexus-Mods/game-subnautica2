import type { IInstruction } from './installers/types';

export const PAK_MOD_EXTENSIONS = ['.pak', '.ucas', '.utoc'] as const;
export const LUA_EXTENSIONS = ['.lua'] as const;

export function dirToWordExp(seg: string): string {
  return `(^|/)${seg}(/|$)`;
}

export function extToWordExp(ext: string): string {
  const e = ext.replace(/^\./, '');
  return `[^/]*\\.${e}$`;
}

export function getPakPatterns(): string[] {
  return PAK_MOD_EXTENSIONS.map(extToWordExp);
}

export function getLogicModsPatterns(): string[] {
  return [dirToWordExp('logicmods')];
}

export function getUE4SSPatterns(): string[] {
  return [dirToWordExp('scripts'), extToWordExp('.lua'), 'enabled\\.txt$'];
}

export function getUE4SSInjectorPatterns(): string[] {
  return [
    '(^|/)dwmapi\\.dll$',
    '(^|/)xinput1_4\\.dll$',
    '(^|/)UE4SS-settings\\.ini$',
  ];
}

function compile(patterns: readonly string[]): RegExp[] {
  return patterns.map((p) => new RegExp(p, 'i'));
}

export function matchesAnyPattern(files: readonly string[], patterns: readonly string[]): boolean {
  const regexes = compile(patterns);
  return files.some((f) => {
    const normal = f.replace(/\\/g, '/');
    return regexes.some((re) => re.test(normal));
  });
}

export function testStopPatterns(
  instructions: readonly IInstruction[],
  patterns: readonly string[],
): boolean {
  const regexes = compile(patterns);
  for (const inst of instructions) {
    if (inst.type !== 'copy') continue;
    const normal = inst.destination.replace(/\\/g, '/');
    if (regexes.some((re) => re.test(normal))) return true;
  }
  return false;
}
