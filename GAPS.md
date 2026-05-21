# GDL parity gaps for the subnautica2 port

This branch is the GDL port of game-subnautica2. As of GDL `8e6bdb1` (Plan
11), every gap that the initial port (Plan 5) surfaced has been closed
upstream in GDL.

## Closed gaps (resolved in GDL)

1. **`losesTo` / mutually-exclusive installer dispatch** — Plan 7. Implemented
   as `unless: <predicate>`. The pak installer now declares it loses to
   LogicMods, UE4SS Scripts, and the UE4SS injector.

2. **Marker-find-then-walk-up routing** — Plan 9. Addressed by composition:
   the UE4SS lua installer now uses `anchor: "**/Scripts/*.lua"` +
   `take: parent.parent` to preserve the mod-name in the destination. A
   second `ue4ss-lua-enabled` installer covers the `enabled.txt`-only
   archive form.

3. **UE4SS injector installer pattern** — Plan 8. Three engine refinements
   (case-insensitive globs, shallowest-anchor selection, install-root
   scoping) enable expressing the injector in ~12 lines of YAML.

4. **`root` installer** — Plan 9. New `take: archive-root` strategy. The
   root installer uses `unless:` to defer to logic-mod / ue4ss-lua /
   ue4ss-injector.

5. **Setup hook (`prepareForModding`)** — Plan 10. Declarative
   `setup: { ensureDirs: [...] }`. Three mod roots ensured at first run.

6. **`did-deploy` event hook** — Plan 10. `events: { did-deploy: !hook ... }`
   wires `regenerateModsTxt`.

7. **Toolbar actions** — Plan 6. Three actions: open UE4SS settings INI,
   open mods.txt, open Nexus page.

8. **Multi-store-in-one-call `queryPath`** — Plan 9. The shim now passes all
   appIds to `findByAppId` in a single array call.

9. **Xbox / WinGDK arch handling beyond simple `!storeBranch`** — Plan 11.
   `scope.stores: [...]` is available on installers. Subnautica2's markers
   are the same across arches so this port doesn't use it, but the feature
   is available for future variants.

10. **Per-game-instance `getPath` re-evaluation** — Plan 11. The shim's
    `IModType.getPath` callback now re-interpolates with the current
    game's `gamePath` on each call.

## What this port covers

100% of the legacy hand-written extension's surface, except where intentionally
simplified (e.g., this port skips the `pakAlt` and `contentFolder` installers
because their use cases are subsumed by the broader `root` installer).
