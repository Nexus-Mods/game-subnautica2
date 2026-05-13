# Subnautica 2 — Vortex Game Extension

TypeScript Vortex 2.0+ game extension for **Subnautica 2** (Unknown Worlds, UE5).
Supports the three Subnautica 2 mod paths:

- **Pak mods** → `<game>/Subnautica2/Content/Paks/~mods/` (load-order aware)
- **LogicMods** (Blueprint paks) → `<game>/Subnautica2/Content/Paks/LogicMods/`
- **UE4SS** Lua scripts → `<game>/Subnautica2/Binaries/Win64/ue4ss/Mods/`

Auto-discovers Subnautica 2 on **Steam** (app `1962700`), **Epic Games Store**
(catalog item `22bfc34d90b64054809542014fc9eb32`), and **Xbox / Game Pass**
(product `9PJPCB188SVG`). Xbox installs use a flat path layout (no nested
`Subnautica2/` directory).

## Install (end users)

Easiest: open Vortex's Extensions tab, find **Subnautica 2 Support** in the
list, click Install. Vortex pulls the latest release from the Nexus Mods page.

Manual: download the latest `subnautica2-vortex-vX.Y.Z.zip` from
[Releases](../../releases) or from the [Nexus Mods
page](https://www.nexusmods.com/subnautica2), drag the archive into the
**Extensions** drop zone in Vortex (Settings → Extensions), and restart.

## Develop

Requires **Node 20+** and **pnpm 11+**.

```bash
pnpm install
pnpm test          # 78 unit tests across 7 suites
pnpm run typecheck
pnpm run lint
pnpm run build     # produces dist/index.js
pnpm run gen-info  # produces dist/info.json from package.json
```

### Live testing in Vortex

1. `pnpm run build && pnpm run gen-info`
2. Copy `dist/index.js`, `dist/info.json`, and `gameart.webp` into:
   - Windows: `%APPDATA%\Vortex\plugins\game-subnautica2\`
3. Restart Vortex.

### Release

The `release` job in `.github/workflows/ci.yml` runs on every `v*` tag. It
builds, packages `out/subnautica2-vortex-vX.Y.Z.zip`, attaches it to a GitHub
Release, **and** uploads the same artifact to the Nexus Mods page via the
official `Nexus-Mods/upload-action`.

#### One-time setup

Before the first tagged release will succeed:

1. Create the Subnautica 2 mod page at
   <https://www.nexusmods.com/subnautica2/mods>. The first submission needs
   moderator approval, which can take a few days.
2. On the new mod page's **Files** tab, click **Manage files** → **Add file**
   to create an initial file entry. Note the numeric `file_group_id` from the
   file entry's edit URL.
3. Generate a Personal API Key at
   <https://www.nexusmods.com/users/myaccount?tab=api+access> (not an OAuth
   client).
4. In the GitHub repo, under **Settings → Secrets and variables → Actions**:
   - Add a **Secret** `NEXUSMODS_API_KEY` set to the key from step 3.
   - Add a **Variable** `NEXUSMODS_FILE_GROUP_ID` set to the ID from step 2.

#### Per-release flow

1. Bump `version` in `package.json` to `X.Y.Z`.
2. Commit, tag, push:

   ```bash
   git commit -am "Bump version to X.Y.Z"
   git tag vX.Y.Z
   git push origin main vX.Y.Z
   ```

3. The `release` job verifies the tag matches `package.json`, packages the
   `.zip`, creates a GitHub Release, and uploads the same `.zip` to the
   `NEXUSMODS_FILE_GROUP_ID` group on Nexus.

#### Local packaging

```bash
pnpm run package   # writes out/subnautica2-vortex-v$VERSION.zip
```

Requires `zip` on PATH (preinstalled on Linux/macOS; on Windows use Git Bash
or install Info-ZIP).

## Architecture

| File | Purpose |
| --- | --- |
| `src/index.ts` | Vortex `init(context)` entrypoint. Calls `registerGame`, mod types, installers. |
| `src/constants.ts` | All game/store IDs and mod-path constants. **Update here when post-launch values are confirmed.** |
| `src/game.ts` | `resolveModPaths(discovery)` (pure) and `prepareForModding(discovery)` (creates dirs). Xbox branch flattens INSTALL_DIR. |
| `src/modTypes.ts` | `registerModType` for LogicMods and UE4SS. |
| `src/installers/pakInstaller.ts` | Routes `.pak` / `.ucas` / `.utoc` archives to `~mods/`. |
| `src/installers/logicModsInstaller.ts` | Routes archives containing a `LogicMods/` segment. |
| `src/installers/ue4ssInstaller.ts` | Routes Lua-based UE4SS mods. |
| `src/util/paths.ts` | Pure path helpers (`toPosix`, `splitSegments`, `hasSegment`, `joinRel`). |
| `src/util/archive.ts` | Pure file-list inspection (`findPaksWithSiblings`, `containsLogicMods`, `containsUE4SSScripts`). |
| `test/` | Jest unit tests for every pure module. |
| `test/__mocks__/vortex-api.ts` | Stub used by Jest in place of the real `vortex-api` (which is electron-bound). |

## Known TODOs (post-launch, 2026-05-14)

The game launches in Early Access the day after this extension was written.
A few constants in `src/constants.ts` are educated guesses that need
verification against an actual install. Each is a one-line PR:

1. **`EXEC`** — currently `'Subnautica2.exe'`. Could be
   `Subnautica2-Win64-Shipping.exe` under `Binaries/Win64/`. Verify by listing
   the Steam install dir.
2. **`EPIC_INSTALL_DIR`** — null sentinel. Verify Epic uses the same
   `Subnautica2` folder name as Steam (most UE5 titles do).
3. **`XBOX_PFN`** — null sentinel. Query
   [rg-adguard.net](https://store.rg-adguard.net) with the Microsoft Store
   URL once available.
4. **LogicMods path** — currently `Content/Paks/LogicMods/`. One community
   source suggests `Binaries/Win64/Mods/LogicMods/` instead. Drop a known
   LogicMod into each and see which the game loads.
5. **IO Store (`.ucas`/`.utoc`)** — verify whether mods need sibling files
   alongside `.pak`. The pak installer already groups them.
6. **Pak signature enforcement** — try loading an unsigned pak; if it fails,
   add a sig-bypass option.

## License

GPL-3.0-or-later. See [LICENSE](./LICENSE).
