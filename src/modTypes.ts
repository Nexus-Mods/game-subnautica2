import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import {
  GAME_ID,
  MOD_TYPE_LOGICMODS,
  MOD_TYPE_UE4SS,
  LOGIC_MODS_RELPATH,
  UE4SS_MODS_RELPATH,
} from './constants';
import { resolveGamePath } from './game';
import type { IInstruction } from './installers/types';

const isThisGame = (gameId: string): boolean => gameId === GAME_ID;

interface GameWithDiscovery {
  discovery?: { path?: string; store?: string };
}

function modPathFor(game: unknown, rel: string): string {
  const disc = (game as GameWithDiscovery).discovery;
  return resolveGamePath(disc?.path ?? '', rel, disc?.store === 'xbox');
}

export function isTypeMatch(typeId: string, instructions: readonly IInstruction[]): boolean {
  return instructions.some((i) => i.type === 'setmodtype' && i.value === typeId);
}

export function registerModTypes(context: types.IExtensionContext): void {
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
    (game) => modPathFor(game, UE4SS_MODS_RELPATH),
    ((instructions: readonly IInstruction[]) =>
      Bluebird.resolve(isTypeMatch(MOD_TYPE_UE4SS, instructions))) as never,
    { name: 'UE4SS (Lua scripts)', mergeMods: true },
  );
}
