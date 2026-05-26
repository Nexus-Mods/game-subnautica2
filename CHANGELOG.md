# Changelog

## 1.1.0 — 2026-05-26

### Breaking

- **Rewritten with GDL** — The entire extension is now declared in `game.yaml` using [Game Description Language](https://github.com/Nexus-Mods/game-description-language). All hand-coded TypeScript installer/routing logic has been replaced by declarative YAML rules. The only remaining custom code is `src/hooks.ts` for `regenerateModsTxt`.

### New

- **Bare Lua mod support** — Added `ue4ss-lua-bare` installer for UE4SS mods that place `.lua` files directly in the mod folder without a `Scripts/` subdirectory (e.g., FishSizeRandomizer).
- **IO Store only installer** — Dedicated `pak-iostore` installer for mods with `.utoc` + `.ucas` files but no `.pak`.
- **Corpus testing** — Installer rules are validated against real mod archives from NexusMods (17/17 validators pass, 21/24 archives matched).
- **Inline test cases** — 24 test cases defined in `game.yaml` covering all installer routing scenarios.

### Improvements

- Reduced codebase from ~1,900 lines of TypeScript to ~500 lines of YAML + 63 lines of hooks.
- Build pipeline simplified: `gdl build` replaces custom webpack config.
- CI workflow updated for GDL-based build.

## 1.0.2 — 2026-05-18

### Bug Fixes

- **UE4SS Lua installer drops asset files** — Lua installer was filtering to `.lua` and `enabled.txt` only, silently dropping asset files (PNGs, JSON, etc.) shipped alongside scripts. Now copies everything under the mod root verbatim. (Nexus bug 1081118)
- **Deep game-relative paths not collapsed** — Archives rooted at the full game-relative path (`Subnautica2/Binaries/Win64/ue4ss/Mods/<mod>/`) were not handled correctly. The find-mod-root routing now collapses them properly. (Nexus bug 1080510)
- **UE4SS Settings INI path incorrect** — Toolbar action built the path as `Binaries/<arch>/UE4SS-settings.ini`, but UE4SS 3.x places the file at `Binaries/<arch>/ue4ss/UE4SS-settings.ini`. (Nexus bug 1080506)
- **Pak and root mod types not registered** — `registerModTypes` skipped specs without a `modType` field, leaving `subnautica2-pak` and `subnautica2-root` unregistered. Installed mods would not deploy until the user manually cycled the mod type. (Nexus bug 1080505)
- **Nexus Mods upload** — Corrected CI secret name and set file group ID for automated uploads.

### Improvements

- Hoisted `Binaries/<arch>/ue4ss` into a shared `ue4ssRootPath()` helper.
- OS-generated metadata (`Thumbs.db`, `.DS_Store`, `desktop.ini`) is now filtered when routing UE4SS Lua mods.
- Cleaned up dead constants, deduplicated types, and normalized exports.
- Added path utility tests and structural invariant test ensuring every `MOD_SPEC` has a `modType`.
