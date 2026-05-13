import Bluebird from 'bluebird';
import { log, types } from 'vortex-api';
import {
  GAME_ID,
  EXEC,
  STEAMAPP_ID,
  EPIC_CATALOG_ITEM_ID,
  XBOX_PRODUCT_ID,
  NEXUS_ID,
  PAK_MODS_RELPATH,
  INSTALL_DIR,
  MOD_TYPE_PAK,
  MOD_TYPE_LOGICMODS,
  MOD_TYPE_UE4SS,
  MOD_TYPE_UE4SS_INJECTOR,
  IGNORE_CONFLICTS,
  IGNORE_DEPLOY,
  checkConstantsResolved,
} from './constants';
import { prepareForModding, IDiscovery } from './game';
import { registerModTypes } from './modTypes';
import { notifyIfUE4SSMissing } from './util/ue4ssState';
import { pakInstallerTest, pakInstall } from './installers/pakInstaller';
import { logicModsInstallerTest, logicModsInstall } from './installers/logicModsInstaller';
import { ue4ssInstallerTest, ue4ssInstall } from './installers/ue4ssInstaller';
import { ue4ssInjectorTest, ue4ssInjectorInstall } from './installers/ue4ssInjectorInstaller';

const queryArgs = {
  steam: [{ id: STEAMAPP_ID, prefer: 0 }],
  epic: [{ id: EPIC_CATALOG_ITEM_ID }],
  xbox: [{ id: XBOX_PRODUCT_ID }],
};

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

  context.registerInstaller(MOD_TYPE_UE4SS_INJECTOR, 15, ue4ssInjectorTest as never, ue4ssInjectorInstall as never);
  context.registerInstaller(MOD_TYPE_LOGICMODS, 20, logicModsInstallerTest as never, logicModsInstall as never);
  context.registerInstaller(MOD_TYPE_UE4SS, 22, ue4ssInstallerTest as never, ue4ssInstall as never);
  context.registerInstaller(MOD_TYPE_PAK, 25, pakInstallerTest as never, pakInstall as never);

  context.once(() => {
    const check = checkConstantsResolved();
    if (!check.resolved) {
      log(
        'warn',
        `Subnautica 2: unresolved post-launch constants — ${check.missing.join(', ')}. ` +
          'Update src/constants.ts after verifying values on an actual install.',
      );
    }

    context.api.events.on('gamemode-activated', (gameId: string) => {
      if (gameId !== GAME_ID) return;
      void notifyIfUE4SSMissing(context.api);
    });
  });

  return true;
}

export default init;
