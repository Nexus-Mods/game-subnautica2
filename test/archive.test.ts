import {
  filterFiles,
  hasExt,
  findPaksWithSiblings,
  containsLogicMods,
  containsUE4SSScripts,
} from '../src/util/archive';

describe('filterFiles', () => {
  test('drops directory entries (trailing slash, posix)', () => {
    expect(filterFiles(['a/', 'a/b.pak', 'a/c/'])).toEqual(['a/b.pak']);
  });

  test('drops directory entries (trailing backslash, windows)', () => {
    expect(filterFiles(['a\\', 'a\\b.pak'])).toEqual(['a\\b.pak']);
  });
});

describe('hasExt', () => {
  test('matches case-insensitively', () => {
    expect(hasExt('foo.PAK', 'pak')).toBe(true);
    expect(hasExt('foo.pak', 'PAK')).toBe(true);
  });

  test('returns false when ext does not match', () => {
    expect(hasExt('foo.utoc', 'pak')).toBe(false);
  });

  test('handles paths with directories', () => {
    expect(hasExt('a/b/c.pak', 'pak')).toBe(true);
  });

  test('a file without extension returns false', () => {
    expect(hasExt('README', 'pak')).toBe(false);
  });
});

describe('findPaksWithSiblings', () => {
  test('groups a pak with its .ucas and .utoc siblings (same base, same dir)', () => {
    const files = ['mod_P.pak', 'mod_P.ucas', 'mod_P.utoc'];
    expect(findPaksWithSiblings(files)).toEqual([
      { pak: 'mod_P.pak', siblings: ['mod_P.ucas', 'mod_P.utoc'] },
    ]);
  });

  test('returns a pak with empty siblings when no sibling files exist', () => {
    expect(findPaksWithSiblings(['solo_P.pak'])).toEqual([
      { pak: 'solo_P.pak', siblings: [] },
    ]);
  });

  test('handles multiple paks in different folders', () => {
    const files = [
      'a/x_P.pak', 'a/x_P.ucas', 'a/x_P.utoc',
      'b/y_P.pak',
    ];
    const result = findPaksWithSiblings(files);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ pak: 'a/x_P.pak', siblings: ['a/x_P.ucas', 'a/x_P.utoc'] });
    expect(result).toContainEqual({ pak: 'b/y_P.pak', siblings: [] });
  });

  test('does not group files with the same basename in different directories', () => {
    const files = ['a/mod.pak', 'b/mod.utoc'];
    const result = findPaksWithSiblings(files);
    expect(result).toEqual([{ pak: 'a/mod.pak', siblings: [] }]);
  });

  test('ignores non-pak files', () => {
    expect(findPaksWithSiblings(['readme.txt', 'image.png'])).toEqual([]);
  });

  test('handles windows-style separators', () => {
    const files = ['mods\\x_P.pak', 'mods\\x_P.utoc'];
    expect(findPaksWithSiblings(files)).toEqual([
      { pak: 'mods\\x_P.pak', siblings: ['mods\\x_P.utoc'] },
    ]);
  });
});

describe('containsLogicMods', () => {
  test('detects a LogicMods/ path segment (case-insensitive)', () => {
    expect(containsLogicMods(['mod/LogicMods/x.pak'])).toBe(true);
    expect(containsLogicMods(['mod/logicmods/x.pak'])).toBe(true);
  });

  test('returns false when no LogicMods segment is present', () => {
    expect(containsLogicMods(['mod/~mods/x.pak'])).toBe(false);
  });

  test('does not match partial substrings of folder names', () => {
    expect(containsLogicMods(['mod/LogicModsExtra/x.pak'])).toBe(false);
  });
});

describe('containsUE4SSScripts', () => {
  test('detects a top-level *.lua file', () => {
    expect(containsUE4SSScripts(['main.lua'])).toBe(true);
  });

  test('detects Scripts/main.lua nested anywhere', () => {
    expect(containsUE4SSScripts(['mods/MyMod/Scripts/main.lua'])).toBe(true);
  });

  test('detects an enabled.txt + lua pair', () => {
    expect(containsUE4SSScripts(['MyMod/enabled.txt', 'MyMod/main.lua'])).toBe(true);
  });

  test('returns false for a pure pak archive', () => {
    expect(containsUE4SSScripts(['mod_P.pak'])).toBe(false);
  });

  test('returns false for an empty archive', () => {
    expect(containsUE4SSScripts([])).toBe(false);
  });
});
