export function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

export function splitSegments(p: string): string[] {
  return toPosix(p).split('/').filter((s) => s.length > 0);
}

export function hasSegment(p: string, segment: string): boolean {
  const target = segment.toLowerCase();
  return splitSegments(p).some((s) => s.toLowerCase() === target);
}

export function joinRel(...parts: string[]): string {
  const segments: string[] = [];
  for (const part of parts) {
    for (const s of splitSegments(part)) segments.push(s);
  }
  return segments.join('/');
}

export function basename(p: string): string {
  const idxF = p.lastIndexOf('/');
  const idxB = p.lastIndexOf('\\');
  const idx = Math.max(idxF, idxB);
  return idx < 0 ? p : p.slice(idx + 1);
}

export function dirname(p: string): string {
  const idxF = p.lastIndexOf('/');
  const idxB = p.lastIndexOf('\\');
  const idx = Math.max(idxF, idxB);
  return idx < 0 ? '' : p.slice(0, idx);
}

export function stem(p: string): string {
  const name = basename(p);
  const dotIdx = name.lastIndexOf('.');
  return dotIdx < 0 ? name : name.slice(0, dotIdx);
}

export function pathAfterSegment(p: string, segment: string): string | null {
  const target = segment.toLowerCase();
  const segs = splitSegments(p);
  const idx = segs.findIndex((s) => s.toLowerCase() === target);
  if (idx < 0) return null;
  return segs.slice(idx + 1).join('/');
}
