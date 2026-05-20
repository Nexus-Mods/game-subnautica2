import {
  GAME_ID,
  INSTALL_DIR,
  LOGIC_MODS_RELPATH,
  MOD_TYPE_CONTENT_FOLDER,
  MOD_TYPE_LOGICMODS,
  MOD_TYPE_PAK,
  MOD_TYPE_PAK_ALT,
  MOD_TYPE_ROOT,
  MOD_TYPE_UE4SS,
  MOD_TYPE_UE4SS_INJECTOR,
  PAK_MODS_RELPATH,
} from './constants';
import { ue4ssInjectorPath, ue4ssModsPath } from './game';
import {
  containsLogicMods,
  containsUE4SSScripts,
  filterFiles,
  findPakGroups,
  hasAnyExt,
  hasExt,
} from './util/archive';
import { basename, dirname, hasSegment, pathAfterSegment, splitSegments, toPosix } from './util/paths';
import {
  PAK_EXTENSIONS,
  UE4SS_INJECTOR_MARKERS,
  getPakPatterns,
  getUE4SSInjectorPatterns,
  matchesAnyPattern,
} from './stopPatterns';

export type IInstruction =
  | { type: 'copy'; source: string; destination: string }
  | { type: 'setmodtype'; value: string };

export interface ISupportedResult {
  supported: boolean;
  requiredFiles: string[];
}

export interface IInstallResult {
  instructions: IInstruction[];
}

export type Copy = { source: string; destination: string };
export type RelPath = string | ((isXbox: boolean) => string);
export type FilesPredicate = (files: readonly string[]) => boolean;

export interface ModType {
  name: string;
  destPath: RelPath;
}

export interface ModSpecDef {
  id: string;
  priority: number;
  modType?: ModType;
  losesTo?: readonly FilesPredicate[];
  accept: FilesPredicate;
  route: (files: readonly string[]) => readonly Copy[];
}

export interface ModSpec extends ModSpecDef {
  test: (files: readonly string[], gameId: string) => Promise<ISupportedResult>;
  install: (files: readonly string[]) => Promise<IInstallResult>;
}

const LOSES_TO_HIGHER_PRIORITY: readonly FilesPredicate[] = [containsLogicMods, containsUE4SSScripts];

const NOT_SUPPORTED: ISupportedResult = { supported: false, requiredFiles: [] };

function makeInstaller(def: ModSpecDef): ModSpec {
  return {
    ...def,
    test: (files, gameId) => {
      if (gameId !== GAME_ID) return Promise.resolve(NOT_SUPPORTED);
      if (def.losesTo?.some((fn) => fn(files))) return Promise.resolve(NOT_SUPPORTED);
      return Promise.resolve({ supported: def.accept(filterFiles(files)), requiredFiles: [] });
    },
    install: (files) => {
      const copies: IInstruction[] = def.route(filterFiles(files)).map((c) => ({
        type: 'copy',
        source: c.source,
        destination: c.destination,
      }));
      return Promise.resolve({
        instructions: [{ type: 'setmodtype', value: def.id }, ...copies],
      });
    },
  };
}

// --- UE4SS injector (priority 15, highest) ---

function isInjectorMarker(file: string): boolean {
  const name = basename(file).toLowerCase();
  return (UE4SS_INJECTOR_MARKERS as readonly string[]).includes(name);
}

// --- LogicMods (priority 20) ---

export const logicModsSpec = makeInstaller({
  id: MOD_TYPE_LOGICMODS,
  priority: 20,
  modType: { name: 'LogicMods (Blueprint paks)', destPath: LOGIC_MODS_RELPATH },
  accept: containsLogicMods,
  route: (files) =>
    files
      .filter((f) => hasAnyExt(f, PAK_EXTENSIONS))
      .map((source) => {
        const tail = pathAfterSegment(source, 'logicmods');
        return tail === null ? null : { source, destination: tail };
      })
      .filter((c): c is { source: string; destination: string } => c !== null),
});

// --- Pak (default, flat into ~mods) (priority 21) ---

export const pakSpec = makeInstaller({
  id: MOD_TYPE_PAK,
  priority: 21, // Intercepts early before contentFolderSpec (25) or pakAltSpec (27) can hijack deployment
  modType: { name: 'Paks (~mods)', destPath: PAK_MODS_RELPATH },
  losesTo: LOSES_TO_HIGHER_PRIORITY,
  accept: (files) => findPakGroups(files).length > 0,
  route: (files) =>
    findPakGroups(files).flatMap((g) =>
      g.files.map((source) => ({ source, destination: basename(source) })),
    ),
});

function findInjectorMarker(entries: readonly string[]): string | undefined {
  return entries.filter(isInjectorMarker).sort((a, b) => splitSegments(a).length - splitSegments(b).length)[0];
}

export const ue4ssInjectorSpec = makeInstaller({
  id: MOD_TYPE_UE4SS_INJECTOR,
  priority: 15,
  modType: { name: 'UE4SS Injector', destPath: ue4ssInjectorPath },
  accept: (files) => matchesAnyPattern(files, getUE4SSInjectorPatterns()),
  route: (files) => {
    const marker = findInjectorMarker(files);
    if (marker === undefined) return [];
    const prefix = toPosix(dirname(marker));
    const underPrefix = (f: string): boolean => prefix === '' || toPosix(f).startsWith(`${prefix}/`);
    return files.filter(underPrefix).map((source) => {
      const norm = toPosix(source);
      return { source, destination: prefix === '' ? norm : norm.slice(prefix.length + 1) };
    });
  },
});

// --- UE4SS Lua scripts (priority 22) ---

const STRAY_METADATA_NAMES: readonly string[] = ['thumbs.db', '.ds_store', 'desktop.ini'];

function isStrayMetadata(file: string): boolean {
  return STRAY_METADATA_NAMES.includes(basename(file).toLowerCase());
}

export const ue4ssSpec = makeInstaller({
  id: MOD_TYPE_UE4SS,
  priority: 22,
  modType: { name: 'UE4SS (Lua scripts)', destPath: ue4ssModsPath },
  accept: containsUE4SSScripts,
  route: (files) => {
    const marker = files
      .map(toPosix)
      .filter((f) => hasExt(f, 'lua') || basename(f).toLowerCase() === 'enabled.txt')
      .sort((a, b) => splitSegments(a).length - splitSegments(b).length)[0];

    if (marker === undefined) return [];

    const parentSegments = splitSegments(dirname(marker));
    const rootPath = parentSegments[parentSegments.length - 1]?.toLowerCase() === 'scripts'
      ? parentSegments.slice(0, -1).join('/')
      : parentSegments.join('/');

    // Account for flat archive layouts cleanly
    const s = rootPath === '' ? '' : dirname(rootPath);

    // Removed substring bounding restriction so sibling folders (.png assets) migrate together
    return files
      .filter((f) => !isStrayMetadata(f))
      .map((source) => {
        const posix = toPosix(source);
        return {
          source,
          destination: s === '' ? posix : posix.slice(s.length + 1),
        };
      });
  },
});

// --- Root (priority 23) ---

const ROOT_TOP_LEVEL_DIRS = [INSTALL_DIR, 'Engine', 'Binaries'];

export const rootSpec = makeInstaller({
  id: MOD_TYPE_ROOT,
  priority: 23,
  modType: { name: 'Root (game folder)', destPath: '' },
  accept: (files) => ROOT_TOP_LEVEL_DIRS.some((dir) => files.some((f) => hasSegment(f, dir))),
  route: (files) => files.map((source) => ({ source, destination: source })),
});

// --- Content folder (priority 25) ---

const CONTENT_TOP_LEVEL_DIRS = ['Content', 'Config'].map((d) => d.toLowerCase());

export const contentFolderSpec = makeInstaller({
  id: MOD_TYPE_CONTENT_FOLDER,
  priority: 25,
  modType: { name: 'Content folder', destPath: INSTALL_DIR },
  losesTo: LOSES_TO_HIGHER_PRIORITY,
  accept: (files) =>
    files.some((f) => {
      const head = splitSegments(f)[0]?.toLowerCase();
      return head !== undefined && CONTENT_TOP_LEVEL_DIRS.includes(head);
    }),
  route: (files) => files.map((source) => ({ source, destination: source })),
});

// --- Pak (alt layout, Paks/ folder without ~mods) (priority 27) ---

export const pakAltSpec = makeInstaller({
  id: MOD_TYPE_PAK_ALT,
  priority: 27,
  modType: { name: 'Paks (no ~mods)', destPath: `${INSTALL_DIR}/Content/Paks` },
  losesTo: LOSES_TO_HIGHER_PRIORITY,
  accept: (files) =>
    matchesAnyPattern(files, getPakPatterns()) &&
    files.some((f) => hasSegment(f, 'paks')) &&
    !files.some((f) => hasSegment(f, '~mods')),
  route: (files) =>
    files
      .filter((f) => hasAnyExt(f, PAK_EXTENSIONS))
      .map((source) => {
        const tail = pathAfterSegment(source, 'paks');
        return tail === null ? null : { source, destination: tail };
      })
      .filter((c): c is { source: string; destination: string } => c !== null),
});

// Ordered by installer priority — Vortex evaluates lowest first.
export const MOD_SPECS: readonly ModSpec[] = [
  ue4ssInjectorSpec,
  logicModsSpec,
  pakSpec,
  ue4ssSpec,
  rootSpec,
  contentFolderSpec,
  pakAltSpec,
];

// Per-installer test/install re-exports for test files.
export const { test: ue4ssInjectorTest, install: ue4ssInjectorInstall } = ue4ssInjectorSpec;
export const { test: logicModsTest, install: logicModsInstall } = logicModsSpec;
export const { test: ue4ssTest, install: ue4ssInstall } = ue4ssSpec;
export const { test: rootTest, install: rootInstall } = rootSpec;
export const { test: contentFolderTest, install: contentFolderInstall } = contentFolderSpec;
export const { test: pakAltTest, install: pakAltInstall } = pakAltSpec;
export const { test: pakTest, install: pakInstall } = pakSpec;