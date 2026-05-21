# GDL parity gaps for the subnautica2 port

This branch is a partial port. The legacy hand-written extension on
`main` does several things GDL cannot express today. Each item below
must land in GDL before this port replaces the legacy extension.

## Installer features

1. **`losesTo` / mutually-exclusive installer dispatch.** The legacy
   `pak`, `pakAlt`, and `contentFolder` installers each declare they
   "lose to" logicmods/ue4ss — i.e., if the archive matches a
   higher-priority installer, they refuse to match. GDL has priority
   ordering (lowest wins) but no exclusion predicate. The port omits
   `pakAlt` and `contentFolder` because of this.

2. **Marker-find-then-walk-up routing.** The legacy UE4SS installer
   finds the shallowest `.lua`/`enabled.txt` marker in the archive,
   takes its parent directory, then walks up one level if the parent
   is named `Scripts/`. GDL's `take: parent` is depth-based and does
   not "look back" from a marker. The port uses `anchor: "**/Scripts/"`
   + `take: parent` which works for the common case (single mod with
   a `Scripts/` subdir) but fails when the archive structure is
   irregular.

3. **UE4SS injector installer.** Requires finding one of three marker
   DLLs, taking the directory containing it, and routing to a
   Win64/WinGDK arch-aware destination. None of those pieces are
   expressible today. Omitted.

4. **`root` installer.** "Take everything as-is from the archive
   root" — expressible if we accept `losesTo` is missing (it would
   match anything). Omitted.

## Lifecycle hooks

5. **Setup hook (`prepareForModding`).** Legacy extension ensures
   the three mod folders exist on disk the first time the game is
   managed. GDL's hook catalog only declares `detectGameVersion`. No
   way to declare a setup hook today.

6. **did-deploy hook.** Legacy extension regenerates UE4SS
   `mods.txt` after every deployment so UE4SS can find the installed
   mods. No GDL hook covers this.

## Discovery

7. **Custom `queryPath` logic.** Legacy extension calls
   `util.GameStoreHelper.findByAppId([STEAMAPP_ID, EPIC_CATALOG_ITEM_ID])`
   — passing both IDs in a single call. GDL's runtime iterates stores
   and calls `findByAppId(appId, storeId)` once per store. The
   semantics are similar but not identical (legacy uses Vortex's
   array-form fallback).

8. **Xbox / WinGDK arch handling.** Legacy `ue4ssInjectorPath`
   chooses `Binaries/Win64/` vs `Binaries/WinGDK/` based on
   `discovery.store === 'xbox'`. GDL's `!storeBranch` could express
   this for the modType destination, but only for the destination —
   not for the installer's arch-specific marker recognition.
   The port skips Xbox entirely.

## Mod types

9. **Per-game-instance `getPath` evaluation.** Legacy `registerModType`
   passes a function that reads current discovery state every time.
   GDL evaluates context bindings once at registration (frozen
   `resolvedCtx`). For mod paths that depend on state that can
   change after first-discovery (rare but possible), GDL needs a
   re-evaluation seam.

## What the port DOES cover

- Game registration with Steam + Epic discovery.
- Three primary mod types (pak, logic-mod, ue4ss-lua) with
  static destination paths.
- Three primary installers (pak, logic-mod, ue4ss-lua) using
  GDL's existing `!hasFile`/`!any` predicates and `anchor`/`take`/
  `placeAt` routing.
- The nexus block (modId, fileGroupId, displayName).
- Inline test cases for the three primary installers.

This is roughly 50-60% of the legacy extension's functional surface.
