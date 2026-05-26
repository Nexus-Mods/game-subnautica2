# Subnautica 2 — Vortex Game Extension

Vortex 2.0+ game extension for **Subnautica 2** (Unknown Worlds, UE5), built
with [GDL](https://github.com/Nexus-Mods/game-description-language).

Supports:

- **Pak mods** → `<game>/Subnautica2/Content/Paks/~mods/`
- **LogicMods** (Blueprint paks) → `<game>/Subnautica2/Content/Paks/LogicMods/`
- **UE4SS Lua scripts** → `<game>/Subnautica2/Binaries/Win64/ue4ss/Mods/`
- **IO Store mods** (`.utoc` + `.ucas`) → `<game>/Subnautica2/Content/Paks/~mods/`
- **Root mods** (full game-relative paths)
- **Content/Config folder** mods

Auto-discovers Subnautica 2 on **Steam** (app `1962700`), **Epic Games Store**
(catalog item `22bfc34d90b64054809542014fc9eb32`), and **Xbox / Game Pass**.
Xbox installs use a flat path layout (no nested `Subnautica2/` directory) and
the `WinGDK` architecture.

## Install (end users)

Open Vortex's Extensions tab, find **Subnautica 2 Support** in the list, click
Install. Or download the latest `subnautica2-vortex-vX.Y.Z.zip` from
[Releases](../../releases) / the [Nexus Mods page](https://www.nexusmods.com/subnautica2)
and drag it into Vortex's Extensions drop zone.

## Develop

Requires **Node 22+** and **pnpm 11+**.

```bash
git clone --recurse-submodules <repo-url>
cd game-subnautica2
pnpm install
cd gdl && pnpm install && pnpm run build && cd ..

pnpm run build     # game.yaml -> dist/index.js (via GDL)
pnpm test          # build + vitest (installer tests + hooks tests)
pnpm run package   # build + zip into out/
```

### Project structure

```
game.yaml              # Declarative game definition (installers, mod types, tests)
src/hooks.ts           # regenerateModsTxt lifecycle hook (only custom TS)
test/hooks.test.ts     # Hook unit tests
test/__mocks__/        # Vortex API mock for tests
gdl/                   # GDL toolchain (git submodule)
.gdl-out/              # Generated code (gitignored)
dist/                  # Webpack bundle (gitignored)
```

All installer routing, mod type registration, store discovery, toolbar actions,
and setup are declared in `game.yaml`. GDL compiles this into a Vortex extension
at build time. The only custom TypeScript is `src/hooks.ts`, which scans
deployed UE4SS mod directories and regenerates `mods.txt` after each deployment.

### Live testing in Vortex

1. `pnpm run build`
2. Copy `dist/index.js`, `dist/info.json`, and `gameart.webp` into
   `%APPDATA%\Vortex\plugins\game-subnautica2\`
3. Restart Vortex.

### Corpus testing

Test installer rules against real mod archives from NexusMods:

```bash
NEXUS_API_KEY=<key> pnpm run test:corpus -- --fetch   # download + test
pnpm run test:corpus                                    # re-run cached
```

### Release

Push a `v*` tag. CI builds, packages, creates a GitHub Release, and uploads to
Nexus Mods automatically.

```bash
# bump version in package.json, then:
git commit -am "Bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main vX.Y.Z
```

## License

GPL-3.0-or-later. See [LICENSE](./LICENSE).
