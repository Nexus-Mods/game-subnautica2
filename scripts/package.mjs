#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
if (!version) {
  console.error('package.json has no version');
  process.exit(1);
}

const outDir = join(root, 'out');
const stagingDir = join(outDir, 'stage');
const archiveName = `subnautica2-vortex-v${version}.zip`;
const archivePath = join(outDir, archiveName);

const required = [
  ['dist/index.js', 'index.js'],
  ['dist/info.json', 'info.json'],
  ['gameart.webp', 'gameart.webp'],
];

for (const [src] of required) {
  if (!existsSync(join(root, src))) {
    console.error(`Missing required file: ${src}. Run "pnpm run build" and "pnpm run gen-info" first.`);
    process.exit(1);
  }
}

rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(stagingDir, { recursive: true });
for (const [src, dst] of required) {
  copyFileSync(join(root, src), join(stagingDir, dst));
}

if (existsSync(archivePath)) rmSync(archivePath, { force: true });

try {
  execFileSync('zip', ['-r', archivePath, '.'], { cwd: stagingDir, stdio: 'inherit' });
} catch (err) {
  console.error('Failed to run zip. It ships by default on Linux/macOS; on Windows use Git Bash (which bundles it) or install Info-ZIP.');
  console.error(err.message);
  process.exit(1);
}

console.log(`\nPackaged: ${archivePath}`);
