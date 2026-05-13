import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { GAME_ID } from './constants';
import { resolveGamePath } from './game';
import type { IInstruction, RelPath } from './installers';
import { MOD_SPECS } from './installers';

const isThisGame = (gameId: string): boolean => gameId === GAME_ID;

interface GameWithDiscovery {
  discovery?: { path?: string; store?: string };
}

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
  for (const spec of MOD_SPECS) {
    const mt = spec.modType;
    if (!mt) continue;
    context.registerModType(
      spec.id,
      spec.priority,
      isThisGame,
      (game) => modPathFor(game, mt.destPath),
      ((instructions: readonly IInstruction[]) =>
        Bluebird.resolve(isTypeMatch(spec.id, instructions))) as never,
      { name: mt.name, mergeMods: true },
    );
  }
}
