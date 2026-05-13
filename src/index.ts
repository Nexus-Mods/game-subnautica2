import Bluebird from 'bluebird';
import { log, types } from 'vortex-api';
import {
  GAME_ID,
  EXEC,
  STEAMAPP_ID,
  EPIC_CATALOG_ITEM_ID,
  EPIC_INSTALL_DIR,
  XBOX_PRODUCT_ID,
  XBOX_PFN,
  NEXUS_ID,
  PAK_MODS_RELPATH,
  INSTALL_DIR,
  UE4SS_SETTINGS_FILE,
  IGNORE_CONFLICTS,
  IGNORE_DEPLOY,
} from './constants';
import { prepareForModding, IDiscovery } from './game';
import { registerModTypes } from './modTypes';
import {
  isThisGameActive,
  openInjectorFile,
  openModsFile,
  openNexusPage,
  regenerateModsFile,
} from './util/ue4ssState';
import { MOD_SPECS } from './installers';
import { registerHealthChecks } from './healthChecks';

const queryArgs = {
  steam: [{ id: STEAMAPP_ID, prefer: 0 }],
  epic: [{ id: EPIC_CATALOG_ITEM_ID }],
  xbox: [{ id: XBOX_PRODUCT_ID }],
};

const TOOLBAR_ACTIONS: readonly { priority: number; title: string; run: (api: types.IExtensionApi) => void }[] = [
  { priority: 200, title: 'Open UE4SS Settings INI', run: (api) => openInjectorFile(api, UE4SS_SETTINGS_FILE) },
  { priority: 201, title: 'Open UE4SS mods.txt', run: openModsFile },
  { priority: 202, title: 'Open Nexus Page', run: () => openNexusPage() },
];

function warnIfConstantsUnresolved(): void {
  const missing: string[] = [];
  if (EPIC_INSTALL_DIR === null) missing.push('EPIC_INSTALL_DIR');
  if (XBOX_PFN === null) missing.push('XBOX_PFN');
  if (missing.length === 0) return;
  log(
    'warn',
    `Subnautica 2: unresolved post-launch constants — ${missing.join(', ')}. ` +
      'Update src/constants.ts after verifying values on an actual install.',
  );
}

function init(context: types.IExtensionContext): boolean {
  context.registerGame({
    id: GAME_ID,
    name: 'Subnautica 2',
    mergeMods: true,
    queryArgs,
    queryModPath: () => PAK_MODS_RELPATH,
    logo: 'gameart.webp',
    executable: () => EXEC,
    requiredFiles: [EXEC],
    setup: (discovery) => Bluebird.resolve(prepareForModding(discovery as unknown as IDiscovery)),
    environment: { SteamAPPId: STEAMAPP_ID, EpicAPPId: EPIC_CATALOG_ITEM_ID },
    details: {
      steamAppId: Number(STEAMAPP_ID),
      epicAppId: EPIC_CATALOG_ITEM_ID,
      xboxAppId: XBOX_PRODUCT_ID,
      nexusPageId: NEXUS_ID,
      supportsSymlinks: true,
      gameProjectFolder: INSTALL_DIR,
      ignoreConflicts: IGNORE_CONFLICTS,
      ignoreDeploy: IGNORE_DEPLOY,
    },
  });

  registerModTypes(context);

  for (const action of TOOLBAR_ACTIONS) {
    context.registerAction(
      'mod-icons',
      action.priority,
      'open-ext',
      {},
      action.title,
      () => action.run(context.api),
      () => isThisGameActive(context.api),
    );
  }

  for (const spec of MOD_SPECS) {
    context.registerInstaller(spec.id, spec.priority, spec.test as never, spec.install as never);
  }

  registerHealthChecks(context);

  context.once(() => {
    warnIfConstantsUnresolved();

    context.api.onAsync('did-deploy', async () => {
      if (!isThisGameActive(context.api)) return;
      try {
        await regenerateModsFile(context.api);
      } catch (err) {
        log('warn', 'Subnautica 2: failed to regenerate ue4ss/Mods/mods.txt', err as Error);
      }
    });
  });

  return true;
}

export default init;
