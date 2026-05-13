import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import {
  GAME_ID,
  INSTALL_DIR,
  LOGIC_MODS_RELPATH,
  MOD_TYPE_CONTENT_FOLDER,
  MOD_TYPE_LOGICMODS,
  MOD_TYPE_PAK_ALT,
  MOD_TYPE_ROOT,
  MOD_TYPE_UE4SS,
  MOD_TYPE_UE4SS_INJECTOR,
} from './constants';
import { resolveGamePath, ue4ssInjectorPath, ue4ssModsPath } from './game';
import type { IInstruction } from './installers/types';

const isThisGame = (gameId: string): boolean => gameId === GAME_ID;

interface GameWithDiscovery {
  discovery?: { path?: string; store?: string };
}

type RelPath = string | ((isXbox: boolean) => string);

function modPathFor(game: unknown, relPath: RelPath): string {
  const disc = (game as GameWithDiscovery).discovery;
  const isXbox = disc?.store === 'xbox';
  const rel = typeof relPath === 'function' ? relPath(isXbox) : relPath;
  return resolveGamePath(disc?.path ?? '', rel, isXbox);
}

export function isTypeMatch(typeId: string, instructions: readonly IInstruction[]): boolean {
  return instructions.some((i) => i.type === 'setmodtype' && i.value === typeId);
}

function testFor(typeId: string) {
  return ((instructions: readonly IInstruction[]) =>
    Bluebird.resolve(isTypeMatch(typeId, instructions))) as never;
}

export function registerModTypes(context: types.IExtensionContext): void {
  context.registerModType(
    MOD_TYPE_UE4SS_INJECTOR,
    15,
    isThisGame,
    (game) => modPathFor(game, ue4ssInjectorPath),
    testFor(MOD_TYPE_UE4SS_INJECTOR),
    { name: 'UE4SS Injector', mergeMods: true },
  );

  context.registerModType(
    MOD_TYPE_LOGICMODS,
    20,
    isThisGame,
    (game) => modPathFor(game, LOGIC_MODS_RELPATH),
    testFor(MOD_TYPE_LOGICMODS),
    { name: 'LogicMods (Blueprint paks)', mergeMods: true },
  );

  context.registerModType(
    MOD_TYPE_UE4SS,
    22,
    isThisGame,
    (game) => modPathFor(game, ue4ssModsPath),
    testFor(MOD_TYPE_UE4SS),
    { name: 'UE4SS (Lua scripts)', mergeMods: true },
  );

  context.registerModType(
    MOD_TYPE_ROOT,
    23,
    isThisGame,
    (game) => modPathFor(game, ''),
    testFor(MOD_TYPE_ROOT),
    { name: 'Root (game folder layout)', mergeMods: true },
  );

  context.registerModType(
    MOD_TYPE_CONTENT_FOLDER,
    25,
    isThisGame,
    (game) => modPathFor(game, INSTALL_DIR),
    testFor(MOD_TYPE_CONTENT_FOLDER),
    { name: 'Content folder', mergeMods: true },
  );

  context.registerModType(
    MOD_TYPE_PAK_ALT,
    27,
    isThisGame,
    (game) => modPathFor(game, `${INSTALL_DIR}/Content/Paks`),
    testFor(MOD_TYPE_PAK_ALT),
    { name: 'Paks (no ~mods)', mergeMods: true },
  );
}
