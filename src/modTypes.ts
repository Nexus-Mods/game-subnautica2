import Bluebird from 'bluebird';
import { selectors, types } from 'vortex-api';
import { GAME_ID } from './constants';
import { resolveGamePath } from './game';
import type { IInstruction } from './installers';
import { MOD_SPECS } from './installers';

const isThisGame = (gameId: string): boolean => gameId === GAME_ID;

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
      (game) => {
        const state = (context.api as unknown as { store?: { getState?: () => unknown } }).store?.getState?.();
        const discovery = state
          ? (selectors.discoveryByGame as unknown as
              (s: unknown, g: string) => { path?: string; store?: string } | undefined
            )(state, game.id)
          : undefined;
        if (!discovery?.path) return '';
        const isXbox = discovery.store === 'xbox';
        const rel = typeof mt.destPath === 'function' ? mt.destPath(isXbox) : mt.destPath;
        return resolveGamePath(discovery.path, rel, isXbox);
      },
      ((instructions: readonly IInstruction[]) =>
        Bluebird.resolve(isTypeMatch(spec.id, instructions))) as never,
      { name: mt.name, mergeMods: true },
    );
  }
}
