export const GAME_ID = 'subnautica2';
export const NEXUS_ID = 'subnautica2';

export const STEAMAPP_ID = '1962700';
export const STEAM_INSTALL_DIR = 'Subnautica2';

export const EPIC_CATALOG_ITEM_ID = '22bfc34d90b64054809542014fc9eb32';
export const EPIC_NAMESPACE = '4e06466623c6447bbcb4b8e9f0b1c14e';
export const EPIC_OFFER_ID = 'f62779dfd38343d58f59ec60540f6260';
export const EPIC_URL_SLUG = 'subnautica-2-d27f94';
export const EPIC_INSTALL_DIR: string | null = null;

export const XBOX_PRODUCT_ID = '9PJPCB188SVG';
export const XBOX_PFN: string | null = null;

export const INSTALL_DIR = 'Subnautica2';
export const EXEC = 'Subnautica2.exe';

export const ARCH_WIN64 = 'Win64';
export const ARCH_WINGDK = 'WinGDK';

export const PAK_MODS_RELPATH = `${INSTALL_DIR}/Content/Paks/~mods`;
export const LOGIC_MODS_RELPATH = `${INSTALL_DIR}/Content/Paks/LogicMods`;
export const UE4SS_MODS_RELPATH = `${INSTALL_DIR}/Binaries/${ARCH_WIN64}/ue4ss/Mods`;

export const MOD_TYPE_PAK = 'subnautica2-pak';
export const MOD_TYPE_LOGICMODS = 'subnautica2-logicmods';
export const MOD_TYPE_UE4SS = 'subnautica2-ue4ss';
export const MOD_TYPE_UE4SS_INJECTOR = 'subnautica2-ue4ss-injector';
export const MOD_TYPE_ROOT = 'subnautica2-root';
export const MOD_TYPE_CONTENT_FOLDER = 'subnautica2-contentfolder';
export const MOD_TYPE_PAK_ALT = 'subnautica2-pakalt';

export const PAK_TOP_LEVEL_DIRS = [INSTALL_DIR, 'Engine', 'Binaries'];
export const CONTENT_TOP_LEVEL_DIRS = ['Content', 'Config'];

export const UE4SS_DWMAPI_FILE = 'dwmapi.dll';
export const UE4SS_XINPUT_FILE = 'xinput1_4.dll';
export const UE4SS_SETTINGS_FILE = 'UE4SS-settings.ini';

export const UE4SS_RELEASES_URL = 'https://github.com/UE4SS-RE/RE-UE4SS/releases';

export const IGNORE_CONFLICTS = ['enabled.txt', 'mods.txt', 'UE4SS-settings.ini'];
export const IGNORE_DEPLOY = ['mods.txt'];

export interface ResolvedConstantsCheck {
  resolved: boolean;
  missing: string[];
}

export function checkConstantsResolved(): ResolvedConstantsCheck {
  const missing: string[] = [];
  if (EPIC_INSTALL_DIR === null) missing.push('EPIC_INSTALL_DIR');
  if (XBOX_PFN === null) missing.push('XBOX_PFN');
  return { resolved: missing.length === 0, missing };
}
