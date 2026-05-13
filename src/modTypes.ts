import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import {
  GAME_ID,
  LOGIC_MODS_RELPATH,
  MOD_TYPE_LOGICMODS,
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

export function registerModTypes(context: types.IExtensionContext): void {
  context.registerModType(
    MOD_TYPE_UE4SS_INJECTOR,
    15,
    isThisGame,
    (game) => modPathFor(game, ue4ssInjectorPath),
    ((instructions: readonly IInstruction[]) =>
      Bluebird.resolve(isTypeMatch(MOD_TYPE_UE4SS_INJECTOR, instructions))) as never,
    { name: 'UE4SS Injector', mergeMods: true },
  );

  context.registerModType(
    MOD_TYPE_LOGICMODS,
    20,
    isThisGame,
    (game) => modPathFor(game, LOGIC_MODS_RELPATH),
    ((instructions: readonly IInstruction[]) =>
      Bluebird.resolve(isTypeMatch(MOD_TYPE_LOGICMODS, instructions))) as never,
    { name: 'LogicMods (Blueprint paks)', mergeMods: true },
  );

  context.registerModType(
    MOD_TYPE_UE4SS,
    22,
    isThisGame,
    (game) => modPathFor(game, ue4ssModsPath),
    ((instructions: readonly IInstruction[]) =>
      Bluebird.resolve(isTypeMatch(MOD_TYPE_UE4SS, instructions))) as never,
    { name: 'UE4SS (Lua scripts)', mergeMods: true },
  );
}
