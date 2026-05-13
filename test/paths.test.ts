import { toPosix, splitSegments, hasSegment, joinRel } from '../src/util/paths';

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
