import { fs, selectors, types } from 'vortex-api';
import {
  GAME_ID,
  LOGIC_MODS_RELPATH,
  UE4SS_RELEASES_URL,
  UE4SS_SETTINGS_FILE,
} from './constants';
import { PAK_EXTENSIONS } from './stopPatterns';
import { ue4ssModsPath } from './game';
import {
  isThisGameActive,
  isUE4SSInstalled,
  isUE4SSSettingsPresent,
  listModDirs,
  modsTxtMatchesDeployedDirs,
  openInjectorFolder,
  openUrl,
  regenerateModsFile,
  ue4ssSettingsAbsolutePath,
} from './util/ue4ssState';

// Vortex types CheckFunction as `() => PromiseLike<ITestResult>`, but the
// runtime treats a falsy result as "no problem". The Check type captures that.
type CheckResult = types.ITestResult | undefined;
type Check = () => Promise<CheckResult>;

interface VortexDiscovery {
  path?: string;
  store?: string;
}

function getDiscovery(api: types.IExtensionApi): VortexDiscovery | undefined {
  return (
    selectors.discoveryByGame as unknown as (s: unknown, g: string) => VortexDiscovery | undefined
  )(api.getState(), GAME_ID);
}

function resolveAbsolute(
  api: types.IExtensionApi,
  rel: string | ((isXbox: boolean) => string),
): string | undefined {
  const d = getDiscovery(api);
  if (!d?.path) return undefined;
  const isXbox = d.store === 'xbox';
  const resolved = typeof rel === 'function' ? rel(isXbox) : rel;
  return `${d.path}/${resolved}`.replace(/\\/g, '/');
}

async function anyDeployedLogicMods(api: types.IExtensionApi): Promise<boolean> {
  const dir = resolveAbsolute(api, LOGIC_MODS_RELPATH);
  if (!dir) return false;
  try {
    const entries = await fs.readdirAsync(dir);
    const exts = PAK_EXTENSIONS.map((e) => `.${e}`);
    return entries.some((e) => exts.some((ext) => e.toLowerCase().endsWith(ext)));
  } catch {
    return false;
  }
}

async function anyDeployedLuaMods(api: types.IExtensionApi): Promise<boolean> {
  const dir = resolveAbsolute(api, ue4ssModsPath);
  if (!dir) return false;
  return (await listModDirs(dir)).length > 0;
}

function makeInjectorMissingCheck(api: types.IExtensionApi): Check {
  return async () => {
    if (!isThisGameActive(api)) return undefined;
    if (await isUE4SSInstalled(api)) return undefined;
    const needsUE4SS = (await anyDeployedLogicMods(api)) || (await anyDeployedLuaMods(api));
    if (!needsUE4SS) return undefined;
    return {
      description: {
        short: 'UE4SS is not installed',
        long:
          'You have Lua scripts or LogicMods deployed for Subnautica 2, but UE4SS itself is ' +
          'not installed in the game folder. Without it, those mods will not load. Install ' +
          'the UE4SS injector archive through Vortex to fix this.',
      },
      severity: 'warning',
      automaticFix: () => Promise.resolve(openUrl(UE4SS_RELEASES_URL)),
    };
  };
}

function makeSettingsMissingCheck(api: types.IExtensionApi): Check {
  const recheck = async (): Promise<void> => {
    void (await isUE4SSSettingsPresent(api));
  };
  return async () => {
    if (!isThisGameActive(api)) return undefined;
    if (!(await isUE4SSInstalled(api))) return undefined;
    if (await isUE4SSSettingsPresent(api)) return undefined;
    const settingsPath = ue4ssSettingsAbsolutePath(api);
    return {
      description: {
        short: `${UE4SS_SETTINGS_FILE} is missing`,
        long:
          `UE4SS is installed but \`${UE4SS_SETTINGS_FILE}\` is not present alongside the ` +
          'injector DLL. UE4SS will fall back to compiled-in defaults, which may not match ' +
          'your release. The fix opens the injector folder so you can drop the settings file in.',
        replace: { path: settingsPath ?? '' },
      },
      severity: 'warning',
      automaticFix: () => Promise.resolve(openInjectorFolder(api)),
      onRecheck: () => recheck(),
    };
  };
}

function makeModsTxtCheck(api: types.IExtensionApi): Check {
  const fix = async (): Promise<void> => {
    await regenerateModsFile(api);
  };
  return async () => {
    if (!isThisGameActive(api)) return undefined;
    if (!(await isUE4SSInstalled(api))) return undefined;
    if (await modsTxtMatchesDeployedDirs(api)) return undefined;
    return {
      description: {
        short: 'ue4ss/Mods/mods.txt is out of sync',
        long:
          'The list of Lua mods recorded in `ue4ss/Mods/mods.txt` does not match the mod ' +
          'folders deployed on disk. UE4SS only loads mods listed in this file, so some Lua ' +
          'mods will be silently skipped. The fix rewrites the file from the deployed folders.',
      },
      severity: 'error',
      automaticFix: () => fix(),
      onRecheck: () => fix(),
    };
  };
}

function adapt(check: Check): () => PromiseLike<types.ITestResult> {
  return async () => (await check()) as types.ITestResult;
}

export function registerHealthChecks(context: types.IExtensionContext): void {
  context.registerTest(
    'subnautica2-ue4ss-injector-missing',
    'did-deploy',
    adapt(makeInjectorMissingCheck(context.api)),
  );
  context.registerTest(
    'subnautica2-ue4ss-settings-missing',
    'did-deploy',
    adapt(makeSettingsMissingCheck(context.api)),
  );
  context.registerTest(
    'subnautica2-modstxt-out-of-sync',
    'did-deploy',
    adapt(makeModsTxtCheck(context.api)),
  );
}
