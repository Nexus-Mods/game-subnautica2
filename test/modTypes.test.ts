import { isTypeMatch } from '../src/modTypes';
import { MOD_TYPE_LOGICMODS, MOD_TYPE_UE4SS, MOD_TYPE_UE4SS_INJECTOR } from '../src/constants';
import type { IInstruction } from '../src/installers/types';

describe('isTypeMatch', () => {
  test('returns true when a setmodtype instruction has the queried type', () => {
    const instructions: IInstruction[] = [
      { type: 'setmodtype', value: MOD_TYPE_LOGICMODS },
      { type: 'copy', source: 'LogicMods/x.pak', destination: 'x.pak' },
    ];
    expect(isTypeMatch(MOD_TYPE_LOGICMODS, instructions)).toBe(true);
  });

  test('returns false when the setmodtype instruction names another type', () => {
    const instructions: IInstruction[] = [
      { type: 'setmodtype', value: MOD_TYPE_UE4SS },
    ];
    expect(isTypeMatch(MOD_TYPE_LOGICMODS, instructions)).toBe(false);
  });

  test('returns false when no setmodtype instruction is present', () => {
    const instructions: IInstruction[] = [
      { type: 'copy', source: 'a', destination: 'a' },
    ];
    expect(isTypeMatch(MOD_TYPE_LOGICMODS, instructions)).toBe(false);
  });

  test('matches the UE4SS injector setmodtype', () => {
    const instructions: IInstruction[] = [
      { type: 'setmodtype', value: MOD_TYPE_UE4SS_INJECTOR },
      { type: 'copy', source: 'dwmapi.dll', destination: 'dwmapi.dll' },
    ];
    expect(isTypeMatch(MOD_TYPE_UE4SS_INJECTOR, instructions)).toBe(true);
  });
});
