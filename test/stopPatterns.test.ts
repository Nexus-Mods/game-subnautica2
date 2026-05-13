import {
  dirToWordExp,
  extToWordExp,
  getLogicModsPatterns,
  getPakPatterns,
  getUE4SSPatterns,
  matchesAnyPattern,
  testStopPatterns,
} from '../src/stopPatterns';
import type { IInstruction } from '../src/installers/types';

describe('dirToWordExp', () => {
  test('matches the directory segment case-insensitively', () => {
    const re = new RegExp(dirToWordExp('logicmods'), 'i');
    expect(re.test('mod/LogicMods/x.pak')).toBe(true);
    expect(re.test('LogicMods/x.pak')).toBe(true);
    expect(re.test('mod/logicmods')).toBe(true);
  });

  test('does not match a partial substring of a directory name', () => {
    const re = new RegExp(dirToWordExp('logicmods'), 'i');
    expect(re.test('mod/LogicModsExtra/x.pak')).toBe(false);
    expect(re.test('LogicModsOverride/x.pak')).toBe(false);
  });
});

describe('extToWordExp', () => {
  test('matches the extension at end of path', () => {
    const re = new RegExp(extToWordExp('.pak'), 'i');
    expect(re.test('mod_P.pak')).toBe(true);
    expect(re.test('a/b/mod_P.pak')).toBe(true);
  });

  test('rejects extensions not at the end', () => {
    const re = new RegExp(extToWordExp('.pak'), 'i');
    expect(re.test('mod_P.pak.bak')).toBe(false);
  });

  test('strips a leading dot from the ext argument', () => {
    expect(extToWordExp('pak')).toBe(extToWordExp('.pak'));
  });
});

describe('pattern getters', () => {
  test('getPakPatterns covers .pak, .ucas, .utoc', () => {
    expect(getPakPatterns()).toHaveLength(3);
  });

  test('getLogicModsPatterns contains a logicmods directory matcher', () => {
    expect(getLogicModsPatterns()).toEqual([dirToWordExp('logicmods')]);
  });

  test('getUE4SSPatterns matches both lua scripts and enabled.txt', () => {
    expect(matchesAnyPattern(['MyMod/script.lua'], getUE4SSPatterns())).toBe(true);
    expect(matchesAnyPattern(['MyMod/enabled.txt'], getUE4SSPatterns())).toBe(true);
    expect(matchesAnyPattern(['mods/MyMod/Scripts/main.lua'], getUE4SSPatterns())).toBe(true);
  });
});

describe('matchesAnyPattern', () => {
  test('returns true on the first matching file', () => {
    expect(matchesAnyPattern(['readme.txt', 'x.pak'], getPakPatterns())).toBe(true);
  });

  test('returns false when no file matches any pattern', () => {
    expect(matchesAnyPattern(['readme.txt', 'image.png'], getPakPatterns())).toBe(false);
  });

  test('normalizes backslashes before matching', () => {
    expect(matchesAnyPattern(['mod\\LogicMods\\x.pak'], getLogicModsPatterns())).toBe(true);
  });
});

describe('testStopPatterns', () => {
  test('checks copy-instruction destinations against the patterns', () => {
    const instructions: IInstruction[] = [
      { type: 'copy', source: 'a', destination: 'a/b/x.pak' },
    ];
    expect(testStopPatterns(instructions, getPakPatterns())).toBe(true);
  });

  test('ignores non-copy instructions', () => {
    const instructions: IInstruction[] = [
      { type: 'setmodtype', value: 'subnautica2-pak' },
    ];
    expect(testStopPatterns(instructions, getPakPatterns())).toBe(false);
  });
});
