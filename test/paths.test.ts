import { toPosix, splitSegments, hasSegment, joinRel, basename, dirname, stem, pathAfterSegment } from '../src/util/paths';

describe('toPosix', () => {
  test('converts backslashes to forward slashes', () => {
    expect(toPosix('Content\\Paks\\~mods\\foo.pak')).toBe('Content/Paks/~mods/foo.pak');
  });

  test('leaves posix-style paths unchanged', () => {
    expect(toPosix('Content/Paks/LogicMods/x.pak')).toBe('Content/Paks/LogicMods/x.pak');
  });

  test('handles mixed separators', () => {
    expect(toPosix('Content\\Paks/Mixed\\thing.txt')).toBe('Content/Paks/Mixed/thing.txt');
  });

  test('empty string stays empty', () => {
    expect(toPosix('')).toBe('');
  });
});

describe('splitSegments', () => {
  test('splits a posix path into segments', () => {
    expect(splitSegments('Content/Paks/~mods/foo.pak')).toEqual(['Content', 'Paks', '~mods', 'foo.pak']);
  });

  test('splits a windows path into segments', () => {
    expect(splitSegments('Content\\Paks\\LogicMods\\x.pak')).toEqual(['Content', 'Paks', 'LogicMods', 'x.pak']);
  });

  test('drops empty segments from leading/trailing or doubled separators', () => {
    expect(splitSegments('/Content//Paks/x.pak')).toEqual(['Content', 'Paks', 'x.pak']);
  });

  test('empty string returns empty array', () => {
    expect(splitSegments('')).toEqual([]);
  });
});

describe('hasSegment', () => {
  test('finds an exact segment match (case-insensitive)', () => {
    expect(hasSegment('Content/Paks/LogicMods/x.pak', 'logicmods')).toBe(true);
    expect(hasSegment('Content/Paks/LogicMods/x.pak', 'LogicMods')).toBe(true);
  });

  test('does not match partial substrings of segments', () => {
    expect(hasSegment('Content/Paks/LogicModsOverride/x.pak', 'logicmods')).toBe(false);
  });

  test('returns false when segment is absent', () => {
    expect(hasSegment('Content/Paks/~mods/x.pak', 'logicmods')).toBe(false);
  });

  test('handles windows paths', () => {
    expect(hasSegment('Content\\Paks\\LogicMods\\x.pak', 'logicmods')).toBe(true);
  });
});

describe('joinRel', () => {
  test('joins segments with forward slashes', () => {
    expect(joinRel('Subnautica2', 'Content', 'Paks', '~mods')).toBe('Subnautica2/Content/Paks/~mods');
  });

  test('skips empty segments', () => {
    expect(joinRel('Subnautica2', '', 'Content', '', 'Paks')).toBe('Subnautica2/Content/Paks');
  });

  test('trims accidental separators in inputs', () => {
    expect(joinRel('Subnautica2/', '/Content/', '/Paks/')).toBe('Subnautica2/Content/Paks');
  });

  test('zero arguments returns empty string', () => {
    expect(joinRel()).toBe('');
  });
});

describe('basename', () => {
  test('returns the last segment of a posix path', () => {
    expect(basename('a/b/c.pak')).toBe('c.pak');
  });

  test('returns the last segment of a windows path', () => {
    expect(basename('a\\b\\c.pak')).toBe('c.pak');
  });

  test('returns the whole string when no separator exists', () => {
    expect(basename('file.pak')).toBe('file.pak');
  });

  test('handles mixed separators', () => {
    expect(basename('a/b\\c.pak')).toBe('c.pak');
  });
});

describe('dirname', () => {
  test('returns everything before the last separator (posix)', () => {
    expect(dirname('a/b/c.pak')).toBe('a/b');
  });

  test('returns everything before the last separator (windows)', () => {
    expect(dirname('a\\b\\c.pak')).toBe('a\\b');
  });

  test('returns empty string when no separator exists', () => {
    expect(dirname('file.pak')).toBe('');
  });
});

describe('stem', () => {
  test('returns the filename without extension', () => {
    expect(stem('mod_P.pak')).toBe('mod_P');
  });

  test('strips only the last extension', () => {
    expect(stem('mod.backup.pak')).toBe('mod.backup');
  });

  test('returns the full name when no extension exists', () => {
    expect(stem('README')).toBe('README');
  });

  test('works on full paths (uses basename first)', () => {
    expect(stem('a/b/mod_P.pak')).toBe('mod_P');
  });
});

describe('pathAfterSegment', () => {
  test('returns the path tail after a matching segment (case-insensitive)', () => {
    expect(pathAfterSegment('mod/LogicMods/x.pak', 'logicmods')).toBe('x.pak');
  });

  test('returns nested path after segment', () => {
    expect(pathAfterSegment('root/Paks/sub/file.pak', 'paks')).toBe('sub/file.pak');
  });

  test('returns null when segment is not found', () => {
    expect(pathAfterSegment('a/b/c.pak', 'logicmods')).toBeNull();
  });

  test('returns empty string when segment is the last component', () => {
    expect(pathAfterSegment('a/b/LogicMods', 'logicmods')).toBe('');
  });

  test('handles windows paths', () => {
    expect(pathAfterSegment('mod\\LogicMods\\x.pak', 'logicmods')).toBe('x.pak');
  });
});
