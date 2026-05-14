import Bluebird from 'bluebird';
import { log, types, util } from 'vortex-api';
import {
  GAME_ID,
  EXEC,
  STEAMAPP_ID,
  EPIC_CATALOG_ITEM_ID,
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

function findGame(): Bluebird<string> {
  const ids = [STEAMAPP_ID, EPIC_CATALOG_ITEM_ID];
  return util.GameStoreHelper.findByAppId(ids)
    .then((entry: { gamePath: string }) => entry.gamePath);
}

const TOOLBAR_ACTIONS: readonly { priority: number; title: string; run: (api: types.IExtensionApi) => void }[] = [
  { priority: 200, title: 'Open UE4SS Settings INI', run: (api) => openInjectorFile(api, UE4SS_SETTINGS_FILE) },
  { priority: 201, title: 'Open UE4SS mods.txt', run: openModsFile },
  { priority: 202, title: 'Open Nexus Page', run: () => openNexusPage() },
];

function init(context: types.IExtensionContext): boolean {
  context.registerGame({
    id: GAME_ID,
    name: 'Subnautica 2',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => PAK_MODS_RELPATH,
    logo: 'gameart.webp',
    executable: () => EXEC,
    requiredFiles: [EXEC],
    setup: (discovery) => Bluebird.resolve(prepareForModding(discovery as unknown as IDiscovery)),
    environment: { SteamAPPId: STEAMAPP_ID, EpicAPPId: EPIC_CATALOG_ITEM_ID },
    details: {
      steamAppId: Number(STEAMAPP_ID),
      epicAppId: EPIC_CATALOG_ITEM_ID,
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

  context.once(() => {
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
