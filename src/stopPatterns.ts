export const PAK_EXTENSIONS = ['pak', 'ucas', 'utoc'] as const;

export const UE4SS_INJECTOR_MARKERS = ['dwmapi.dll', 'xinput1_4.dll', 'ue4ss-settings.ini'] as const;

export function dirToWordExp(seg: string): string {
  return `(^|/)${seg}(/|$)`;
}

export function extToWordExp(ext: string): string {
  return `[^/]*\\.${ext.replace(/^\./, '')}$`;
}

export function getPakPatterns(): string[] {
  return PAK_EXTENSIONS.map(extToWordExp);
}

export function getLogicModsPatterns(): string[] {
  return [dirToWordExp('logicmods')];
}

export function getUE4SSPatterns(): string[] {
  return [dirToWordExp('scripts'), extToWordExp('.lua'), 'enabled\\.txt$'];
}

export function getUE4SSInjectorPatterns(): string[] {
  return UE4SS_INJECTOR_MARKERS.map((m) => `(^|/)${m.replace(/\./g, '\\.')}$`);
}

export function matchesAnyPattern(files: readonly string[], patterns: readonly string[]): boolean {
  const regexes = patterns.map((p) => new RegExp(p, 'i'));
  return files.some((f) => {
    const normal = f.replace(/\\/g, '/');
    return regexes.some((re) => re.test(normal));
  });
}
