# GDL Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hand-coded TypeScript installer/routing logic with a declarative GDL `game.yaml`, keeping only a thin `src/hooks.ts` for the `regenerateModsTxt` lifecycle hook.

**Architecture:** GDL compiles `game.yaml` into `.gdl-out/extension.ts` + `installers.gen.ts` + `tests.gen.ts`, then webpack bundles them into `dist/index.js`. The extension project becomes: `game.yaml` (declaration) + `src/hooks.ts` (lifecycle) + `test/hooks.test.ts` (hook tests). GDL's runtime handles game registration, store discovery, context resolution, mod-type registration, and installer routing.

**Tech Stack:** GDL (git submodule), TypeScript, vitest, webpack (via GDL bundler), picomatch (via GDL)

---

### Task 1: Add GDL submodule and build it

**Files:**
- Create: `gdl/` (git submodule)

- [ ] **Step 1: Add the submodule**

```bash
cd /c/oss/game-subnautica2
git submodule add https://github.com/Nexus-Mods/game-description-language gdl
```

- [ ] **Step 2: Install GDL dependencies and build**

```bash
cd /c/oss/game-subnautica2/gdl
pnpm install
pnpm run build
```

Expected: `gdl/dist/cli.js` exists after build.

- [ ] **Step 3: Verify GDL CLI works**

```bash
node gdl/dist/cli.js --help
```

Expected: shows `gdl` command usage.

- [ ] **Step 4: Commit submodule addition**

```bash
cd /c/oss/game-subnautica2
git add .gitmodules gdl
git commit -m "Add game-description-language as git submodule"
```

---

### Task 2: Extend GDL to support game.details

GDL's `registerGame` only passes `nexusPageId` to Vortex's `details` object. This extension needs `ignoreConflicts`, `ignoreDeploy`, `supportsSymlinks`, `steamAppId`, `epicAppId`, and `gameProjectFolder`. Add a generic `details:` mapping to the `game:` YAML block that gets merged into the Vortex game details.

**Files:**
- Modify: `gdl/src/parser/ast.ts`
- Modify: `gdl/src/parser/index.ts`
- Modify: `gdl/src/codegen/emit.ts`
- Modify: `gdl/src/runtime/vortex-shim.ts`

- [ ] **Step 1: Add `details` to GameNode AST**

In `gdl/src/parser/ast.ts`, add to the `GameNode` interface:

```typescript
export interface GameNode extends Node {
  kind: 'game';
  id: string;
  name: string;
  executable: string;
  requiredFiles: string[];
  logo?: string;
  contributedBy?: string;
  nexusDomain?: string;
  details?: Record<string, string | number | boolean | string[]>;  // <-- ADD
}
```

- [ ] **Step 2: Parse `details:` in the parser**

In `gdl/src/parser/index.ts`, after the existing game field parsing (around where `requiredFiles` is parsed), add parsing for the `details:` key. Find the section that builds the `game: GameNode` object and add:

```typescript
  // Parse game.details — arbitrary key-value pairs passed through to Vortex
  let details: Record<string, string | number | boolean | string[]> | undefined;
  const detailsYaml = gameNode.get('details', true);
  if (isMap(detailsYaml)) {
    details = {};
    for (const pair of detailsYaml.items) {
      if (!isPair(pair)) continue;
      const key = isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
      if (isSeq(pair.value)) {
        details[key] = pair.value.items.map(i => (isScalar(i) ? String(i.value) : String(i)));
      } else if (isScalar(pair.value)) {
        const v = pair.value.value;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          details[key] = v;
        }
      }
    }
  }
```

Then include it in the GameNode construction:

```typescript
  const game: GameNode = {
    // ... existing fields ...
    ...(details !== undefined && { details }),
    span: spanOf(file, source, gameSpanNode),
  };
```

- [ ] **Step 3: Add `details` to GameDecl in vortex-shim**

In `gdl/src/runtime/vortex-shim.ts`, add the field to `GameDecl`:

```typescript
export interface GameDecl {
  id: string;
  name: string;
  executable: string;
  requiredFiles: string[];
  logo?: string;
  contributedBy?: string;
  nexusDomain?: string;
  details?: Record<string, unknown>;  // <-- ADD
}
```

Then in the `registerGame` method, merge details into the game object. Find the line that builds `const game: IGame = {` and change the details construction from:

```typescript
...(decl.nexusDomain !== undefined && { details: { nexusPageId: decl.nexusDomain } }),
```

to:

```typescript
details: {
  ...(decl.nexusDomain !== undefined && { nexusPageId: decl.nexusDomain }),
  ...decl.details,
},
```

- [ ] **Step 4: Emit details in codegen**

In `gdl/src/codegen/emit.ts`, find the section in the `emit` function that builds the extension.ts string — specifically the `GameDecl` object literal. Add a details property after the nexusDomain line:

```typescript
      ${doc.game.nexusDomain ? `nexusDomain: ${sq(doc.game.nexusDomain)},` : ''}
      ${doc.game.details ? `details: ${JSON.stringify(doc.game.details)},` : ''}
```

- [ ] **Step 5: Rebuild GDL**

```bash
cd /c/oss/game-subnautica2/gdl
pnpm run build
```

Expected: build succeeds, `dist/` updated.

- [ ] **Step 6: Run GDL's own tests to verify no regressions**

```bash
cd /c/oss/game-subnautica2/gdl
pnpm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit GDL changes**

```bash
cd /c/oss/game-subnautica2/gdl
git add -A
git commit -m "feat: support game.details pass-through to Vortex"
cd /c/oss/game-subnautica2
git add gdl
git commit -m "Update GDL submodule: add game.details support"
```

---

### Task 3: Write game.yaml

The single source of truth for the extension. Replaces `src/constants.ts`, `src/game.ts`, `src/modTypes.ts`, `src/installers.ts`, `src/stopPatterns.ts`, `src/util/archive.ts`, `src/util/paths.ts`.

**Files:**
- Create: `game.yaml`

- [ ] **Step 1: Write the complete game.yaml**

```yaml
gdl: 1

game:
  id: subnautica2
  name: Subnautica 2
  executable: Subnautica2.exe
  requiredFiles: [Subnautica2.exe]
  logo: gameart.webp
  nexusDomain: subnautica2
  details:
    steamAppId: 1962700
    epicAppId: "22bfc34d90b64054809542014fc9eb32"
    supportsSymlinks: true
    gameProjectFolder: Subnautica2
    ignoreConflicts: [enabled.txt, mods.txt, UE4SS-settings.ini]
    ignoreDeploy: [mods.txt]

stores:
  steam: "1962700"
  epic: "22bfc34d90b64054809542014fc9eb32"

context:
  arch:
    storeBranch:
      xbox: WinGDK
      default: Win64

  gamePath:
    storeBranch:
      xbox: ${installPath}
      default: ${installPath}/Subnautica2

  pakModsPath: ${gamePath}/Content/Paks/~mods
  logicModsPath: ${gamePath}/Content/Paks/LogicMods
  paksPath: ${gamePath}/Content/Paks
  contentPath: ${gamePath}/Content

  ue4ssInjectorPath: ${gamePath}/Binaries/${arch}
  ue4ssRootPath: ${gamePath}/Binaries/${arch}/ue4ss
  ue4ssModsPath: ${gamePath}/Binaries/${arch}/ue4ss/Mods

modTypes:
  - { id: subnautica2-pak,            name: "Paks (~mods)",             path: "${pakModsPath}" }
  - { id: subnautica2-logicmods,      name: "LogicMods (Blueprint paks)", path: "${logicModsPath}" }
  - { id: subnautica2-ue4ss,          name: "UE4SS (Lua scripts)",      path: "${ue4ssModsPath}" }
  - { id: subnautica2-ue4ss-injector, name: "UE4SS Injector",           path: "${ue4ssInjectorPath}" }
  - { id: subnautica2-root,           name: "Root (game folder)",       path: "${installPath}" }
  - { id: subnautica2-contentfolder,  name: "Content folder",           path: "${gamePath}" }
  - { id: subnautica2-pakalt,         name: "Paks (no ~mods)",          path: "${paksPath}" }

installers:
  # --- Priority 15: UE4SS Injector (dwmapi.dll, xinput1_4.dll, UE4SS-settings.ini) ---
  - id: ue4ss-injector
    priority: 15
    when: { hasFile: "**/{dwmapi.dll,xinput1_4.dll,UE4SS-settings.ini}" }
    anchor: "**/{dwmapi.dll,xinput1_4.dll,UE4SS-settings.ini}"
    take: parent
    placeAt: "${ue4ssInjectorPath}"
    modType: subnautica2-ue4ss-injector

  # --- Priority 20: LogicMods (Blueprint paks under LogicMods/) ---
  # Directory anchor keeps "LogicMods/" in relative path, so placeAt is one level up (paksPath).
  - id: logicmods
    priority: 20
    when: { hasFile: "**/LogicMods/**" }
    anchor: "**/LogicMods/"
    take: self
    placeAt: "${paksPath}"
    modType: subnautica2-logicmods

  # --- Priority 22: UE4SS Lua (Scripts/*.lua present) ---
  # parent.parent goes up past Scripts/ to the mod-name folder.
  - id: ue4ss-lua
    priority: 22
    when: { hasFile: "**/Scripts/*.lua" }
    unless: { hasFile: "**/{dwmapi.dll,xinput1_4.dll,UE4SS-settings.ini}" }
    anchor: "**/Scripts/*.lua"
    take: parent.parent
    placeAt: "${ue4ssModsPath}"
    modType: subnautica2-ue4ss

  # --- Priority 23: UE4SS Lua (enabled.txt only, no Scripts/*.lua) ---
  - id: ue4ss-lua-enabled
    priority: 23
    when: { hasFile: "**/enabled.txt" }
    unless:
      any:
        - { hasFile: "**/Scripts/*.lua" }
        - { hasFile: "**/{dwmapi.dll,xinput1_4.dll,UE4SS-settings.ini}" }
    anchor: "**/enabled.txt"
    take: parent.parent
    placeAt: "${ue4ssModsPath}"
    modType: subnautica2-ue4ss

  # --- Priority 24: Root (Subnautica2/, Engine/, or Binaries/ segments) ---
  - id: root
    priority: 24
    when:
      any:
        - { hasFile: "**/Subnautica2/**" }
        - { hasFile: "**/Engine/**" }
        - { hasFile: "**/Binaries/**" }
    unless:
      any:
        - { hasFile: "**/LogicMods/**" }
        - { hasFile: "**/Scripts/*.lua" }
        - { hasFile: "**/enabled.txt" }
        - { hasFile: "**/{dwmapi.dll,xinput1_4.dll,UE4SS-settings.ini}" }
    anchor: "**/*"
    take: archive-root
    placeAt: "${installPath}"
    modType: subnautica2-root

  # --- Priority 25: Content folder (Content/ or Config/ at archive root) ---
  - id: content-folder
    priority: 25
    when:
      any:
        - { hasFile: "Content/**" }
        - { hasFile: "Config/**" }
    unless:
      any:
        - { hasFile: "**/LogicMods/**" }
        - { hasFile: "**/Scripts/*.lua" }
        - { hasFile: "**/enabled.txt" }
    anchor: "**/*"
    take: archive-root
    placeAt: "${gamePath}"
    modType: subnautica2-contentfolder

  # --- Priority 27: Pak alt (Paks/ folder without ~mods) ---
  # Directory anchor keeps "Paks/" in relative path, so placeAt is contentPath (one level up).
  - id: pak-alt
    priority: 27
    when:
      all:
        - { hasFile: "**/*.pak" }
        - { hasFile: "**/Paks/**" }
    unless:
      any:
        - { hasFile: "**/~mods/**" }
        - { hasFile: "**/LogicMods/**" }
        - { hasFile: "**/Scripts/*.lua" }
        - { hasFile: "**/enabled.txt" }
    anchor: "**/Paks/"
    take: self
    placeAt: "${contentPath}"
    modType: subnautica2-pakalt

  # --- Priority 29: IO Store only (utoc+ucas without pak) ---
  - id: pak-iostore
    priority: 29
    when: { hasFile: "**/*.utoc" }
    unless:
      any:
        - { hasFile: "**/*.pak" }
        - { hasFile: "**/LogicMods/**" }
        - { hasFile: "**/Scripts/*.lua" }
        - { hasFile: "**/enabled.txt" }
        - { hasFile: "**/Subnautica2/**" }
        - { hasFile: "**/Engine/**" }
        - { hasFile: "**/Binaries/**" }
        - { hasFile: "**/Paks/**" }
    anchor: "**/*.utoc"
    take: parent
    placeAt: "${pakModsPath}"
    modType: subnautica2-pak

  # --- Priority 30: Pak (default, flatten into ~mods) ---
  - id: pak
    priority: 30
    when: { hasFile: "**/*.pak" }
    unless:
      any:
        - { hasFile: "**/LogicMods/**" }
        - { hasFile: "**/Scripts/*.lua" }
        - { hasFile: "**/enabled.txt" }
        - { hasFile: "**/Subnautica2/**" }
        - { hasFile: "**/Engine/**" }
        - { hasFile: "**/Binaries/**" }
        - { hasFile: "**/Paks/**" }
    anchor: "**/*.pak"
    take: parent
    placeAt: "${pakModsPath}"
    modType: subnautica2-pak

setup:
  ensureDirs:
    - ${pakModsPath}
    - ${logicModsPath}
    - ${ue4ssModsPath}

events:
  did-deploy: { hook: regenerateModsTxt }

toolbarActions:
  - id: open-ue4ss-settings
    title: Open UE4SS Settings INI
    priority: 200
    target: { openFile: "${ue4ssRootPath}/UE4SS-settings.ini" }

  - id: open-mods-txt
    title: Open UE4SS mods.txt
    priority: 201
    target: { openFile: "${ue4ssModsPath}/mods.txt" }

  - id: open-nexus-page
    title: Open Nexus Page
    priority: 202
    target: { openUrl: "https://www.nexusmods.com/subnautica2" }

nexus:
  modId: 1091
  fileGroupId: 29849
  displayName: Subnautica 2 Support for Vortex

tests:
  corpus: nexus
  cases:
    # --- UE4SS Injector ---
    - name: "injector: dwmapi.dll at archive root"
      archive:
        - dwmapi.dll
        - UE4SS.dll
      expect:
        matched: ue4ss-injector
        modType: subnautica2-ue4ss-injector
        plan:
          - ${ue4ssInjectorPath}/dwmapi.dll
          - ${ue4ssInjectorPath}/UE4SS.dll

    - name: "injector: marker in subfolder strips wrapper"
      archive:
        - ue4ss/dwmapi.dll
        - ue4ss/UE4SS.dll
        - ue4ss/UE4SS-settings.ini
      expect:
        matched: ue4ss-injector
        modType: subnautica2-ue4ss-injector
        plan:
          - ${ue4ssInjectorPath}/dwmapi.dll
          - ${ue4ssInjectorPath}/UE4SS.dll
          - ${ue4ssInjectorPath}/UE4SS-settings.ini

    - name: "injector: case-insensitive marker"
      archive:
        - Pack/DWMAPI.DLL
      expect:
        matched: ue4ss-injector
        modType: subnautica2-ue4ss-injector

    - name: "injector: xinput1_4.dll (Xbox marker)"
      archive:
        - xinput1_4.dll
        - UE4SS.dll
      expect:
        matched: ue4ss-injector
        modType: subnautica2-ue4ss-injector

    # --- LogicMods ---
    - name: "logicmods: paks under LogicMods/ folder"
      archive:
        - Pack/LogicMods/BPFolder/X.pak
        - Pack/LogicMods/Y.pak
      expect:
        matched: logicmods
        modType: subnautica2-logicmods
        plan:
          - ${paksPath}/LogicMods/BPFolder/X.pak
          - ${paksPath}/LogicMods/Y.pak

    - name: "logicmods: case-insensitive"
      archive:
        - Outer/logicmods/Inner.pak
      expect:
        matched: logicmods
        modType: subnautica2-logicmods

    # --- UE4SS Lua (Scripts) ---
    - name: "ue4ss: lua mod with Scripts folder"
      archive:
        - MyMod/Scripts/main.lua
        - MyMod/Scripts/util.lua
      expect:
        matched: ue4ss-lua
        modType: subnautica2-ue4ss
        plan:
          - ${ue4ssModsPath}/MyMod/Scripts/main.lua
          - ${ue4ssModsPath}/MyMod/Scripts/util.lua

    - name: "ue4ss: wrapped mod strips outer directory"
      archive:
        - wrapper/MyMod/Scripts/main.lua
        - wrapper/MyMod/enabled.txt
      expect:
        matched: ue4ss-lua
        modType: subnautica2-ue4ss
        plan:
          - ${ue4ssModsPath}/MyMod/Scripts/main.lua
          - ${ue4ssModsPath}/MyMod/enabled.txt

    - name: "ue4ss: deep game-relative path collapsed"
      archive:
        - Subnautica2/Binaries/Win64/ue4ss/Mods/CoolMod/Scripts/main.lua
        - Subnautica2/Binaries/Win64/ue4ss/Mods/CoolMod/enabled.txt
      expect:
        matched: ue4ss-lua
        modType: subnautica2-ue4ss
        plan:
          - ${ue4ssModsPath}/CoolMod/Scripts/main.lua
          - ${ue4ssModsPath}/CoolMod/enabled.txt

    - name: "ue4ss: lua mod with extra asset files"
      archive:
        - MyMod/Scripts/main.lua
        - MyMod/shared/config.json
        - MyMod/enabled.txt
      expect:
        matched: ue4ss-lua
        modType: subnautica2-ue4ss
        plan:
          - ${ue4ssModsPath}/MyMod/Scripts/main.lua
          - ${ue4ssModsPath}/MyMod/shared/config.json
          - ${ue4ssModsPath}/MyMod/enabled.txt

    # --- UE4SS Lua (enabled.txt only) ---
    - name: "ue4ss-enabled: enabled.txt mod without Scripts"
      archive:
        - MyLuaMod/enabled.txt
        - MyLuaMod/data.json
      expect:
        matched: ue4ss-lua-enabled
        modType: subnautica2-ue4ss
        plan:
          - ${ue4ssModsPath}/MyLuaMod/enabled.txt
          - ${ue4ssModsPath}/MyLuaMod/data.json

    # --- Root ---
    - name: "root: Subnautica2 + Engine segments"
      archive:
        - Subnautica2/Content/Paks/foo.pak
        - Engine/Content/bar.uasset
      expect:
        matched: root
        modType: subnautica2-root
        plan:
          - ${installPath}/Subnautica2/Content/Paks/foo.pak
          - ${installPath}/Engine/Content/bar.uasset

    - name: "root: Binaries segment"
      archive:
        - Binaries/Win64/mod.dll
      expect:
        matched: root
        modType: subnautica2-root
        plan:
          - ${installPath}/Binaries/Win64/mod.dll

    # --- Content Folder ---
    - name: "content-folder: Content/ at archive root"
      archive:
        - Content/Foo.uasset
        - Content/Bar.uexp
      expect:
        matched: content-folder
        modType: subnautica2-contentfolder
        plan:
          - ${gamePath}/Content/Foo.uasset
          - ${gamePath}/Content/Bar.uexp

    - name: "content-folder: Config/ at archive root"
      archive:
        - Config/settings.ini
      expect:
        matched: content-folder
        modType: subnautica2-contentfolder
        plan:
          - ${gamePath}/Config/settings.ini

    # --- Pak Alt ---
    - name: "pak-alt: Paks/ folder without ~mods"
      archive:
        - mod/Paks/sub/x.pak
        - mod/Paks/sub/x.ucas
        - mod/Paks/sub/x.utoc
      expect:
        matched: pak-alt
        modType: subnautica2-pakalt
        plan:
          - ${contentPath}/Paks/sub/x.pak
          - ${contentPath}/Paks/sub/x.ucas
          - ${contentPath}/Paks/sub/x.utoc

    # --- IO Store Only ---
    - name: "pak-iostore: utoc+ucas without pak"
      archive:
        - SomeMod/x_P.utoc
        - SomeMod/x_P.ucas
      expect:
        matched: pak-iostore
        modType: subnautica2-pak
        plan:
          - ${pakModsPath}/x_P.utoc
          - ${pakModsPath}/x_P.ucas

    # --- Pak (default) ---
    - name: "pak: single pak file"
      archive:
        - SomeMod/Cool.pak
      expect:
        matched: pak
        modType: subnautica2-pak
        plan:
          - ${pakModsPath}/Cool.pak

    - name: "pak: pak+ucas+utoc triplet flattened"
      archive:
        - SomeMod/files/x_P.pak
        - SomeMod/files/x_P.ucas
        - SomeMod/files/x_P.utoc
      expect:
        matched: pak
        modType: subnautica2-pak
        plan:
          - ${pakModsPath}/x_P.pak
          - ${pakModsPath}/x_P.ucas
          - ${pakModsPath}/x_P.utoc

    - name: "pak: deeply nested pak flattened to basename"
      archive:
        - a/b/c/d/MyMod.pak
      expect:
        matched: pak
        modType: subnautica2-pak
        plan:
          - ${pakModsPath}/MyMod.pak

    # --- Priority / losesTo scenarios ---
    - name: "pak loses to logicmods"
      archive:
        - Outer/LogicMods/Inner/X.pak
      expect:
        matched: logicmods
        modType: subnautica2-logicmods

    - name: "pak loses to ue4ss-lua"
      archive:
        - Outer/Cool.pak
        - Outer/Scripts/main.lua
      expect:
        matched: ue4ss-lua
        modType: subnautica2-ue4ss

    - name: "content-folder loses to logicmods"
      archive:
        - Content/Paks/LogicMods/X.pak
      expect:
        matched: logicmods

validators:
  - id: logicmods-validator
    name: Archives with LogicMods should match logicmods installer
    when: { hasFile: "**/LogicMods/**/*.pak" }
    assert:
      matched: logicmods

  - id: ue4ss-lua-validator
    name: Archives with Scripts/*.lua should match ue4ss-lua
    when:
      all:
        - { hasFile: "**/Scripts/*.lua" }
        - not: { hasFile: "**/{dwmapi.dll,xinput1_4.dll,UE4SS-settings.ini}" }
    assert:
      matched: ue4ss-lua

  - id: injector-validator
    name: Archives with injector markers should match ue4ss-injector
    when: { hasFile: "**/{dwmapi.dll,xinput1_4.dll,UE4SS-settings.ini}" }
    assert:
      matched: ue4ss-injector
```

- [ ] **Step 2: Commit game.yaml**

```bash
git add game.yaml
git commit -m "Add game.yaml: declarative game definition for GDL"
```

---

### Task 4: Write src/hooks.ts

The only custom TypeScript remaining. Provides the `regenerateModsTxt` event hook.

**Files:**
- Create (replace): `src/hooks.ts`

- [ ] **Step 1: Write hooks.ts**

```typescript
import { fs, selectors, types } from 'vortex-api';

const GAME_ID = 'subnautica2';

interface VortexDiscovery {
  path?: string;
  store?: string;
}

function getDiscovery(api: types.IExtensionApi): VortexDiscovery | undefined {
  return (
    selectors.discoveryByGame as unknown as (s: unknown, g: string) => VortexDiscovery | undefined
  )(api.getState(), GAME_ID);
}

function getActiveGameId(api: types.IExtensionApi): string | undefined {
  return (selectors.activeGameId as unknown as (s: unknown) => string | undefined)(api.getState());
}

function resolveUE4SSModsDir(api: types.IExtensionApi): string | undefined {
  const d = getDiscovery(api);
  if (!d?.path) return undefined;
  const isXbox = d.store === 'xbox';
  const arch = isXbox ? 'WinGDK' : 'Win64';
  const gameDir = isXbox ? '' : 'Subnautica2';
  const parts = [d.path, gameDir, 'Binaries', arch, 'ue4ss', 'Mods'].filter(s => s.length > 0);
  return parts.join('/');
}

export async function listModDirs(modsDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdirAsync(modsDir);
  } catch {
    return [];
  }
  const candidates = entries.filter((e: string) => e !== 'mods.txt' && e !== 'mods.json');
  const checked = await Promise.all(
    candidates.map(async (entry: string) => {
      try {
        const stat = (await fs.statAsync(`${modsDir}/${entry}`)) as { isDirectory: () => boolean };
        return stat.isDirectory() ? entry : null;
      } catch {
        return null;
      }
    }),
  );
  return checked.filter((e): e is string => e !== null);
}

export async function regenerateModsTxt(ctx: {
  profileId: string;
  deployment: unknown;
  api: unknown;
}): Promise<void> {
  const api = ctx.api as types.IExtensionApi;
  if (getActiveGameId(api) !== GAME_ID) return;
  const modsDir = resolveUE4SSModsDir(api);
  if (modsDir === undefined) return;
  const dirs = await listModDirs(modsDir);
  const content = dirs.map((d) => `${d} : 1`).join('\n') + (dirs.length > 0 ? '\n' : '');
  await fs.writeFileAsync(`${modsDir}/mods.txt`, content);
}
```

- [ ] **Step 2: Commit hooks.ts**

```bash
git add src/hooks.ts
git commit -m "Add src/hooks.ts: regenerateModsTxt lifecycle hook for GDL"
```

---

### Task 5: Write test/hooks.test.ts

Unit tests for the lifecycle hook.

**Files:**
- Create: `test/hooks.test.ts`
- Keep: `test/__mocks__/vortex-api.ts` (needed for mocking)

- [ ] **Step 1: Write hooks test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fs, selectors } from 'vortex-api';
import { listModDirs, regenerateModsTxt } from '../src/hooks';

const mockActiveGameId = vi.mocked(selectors.activeGameId);
const mockDiscoveryByGame = vi.mocked(selectors.discoveryByGame);
const mockReaddirAsync = vi.mocked(fs.readdirAsync);
const mockStatAsync = vi.mocked(fs.statAsync);
const mockWriteFileAsync = vi.mocked(fs.writeFileAsync);

const fakeApi = (activeId: string, gamePath?: string, store?: string) => ({
  getState: () => ({}),
  __setup__() {
    (mockActiveGameId as unknown as ReturnType<typeof vi.fn>).mockReturnValue(activeId);
    (mockDiscoveryByGame as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      gamePath ? { path: gamePath, store } : undefined,
    );
  },
});

describe('listModDirs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists only directories, skipping mods.txt and mods.json', async () => {
    mockReaddirAsync.mockResolvedValue(['ModA', 'ModB', 'mods.txt', 'mods.json', 'readme.txt'] as never);
    mockStatAsync.mockImplementation((p: string) => {
      const name = p.split('/').pop();
      return Promise.resolve({ isDirectory: () => name !== 'readme.txt' }) as never;
    });
    const dirs = await listModDirs('/fake/Mods');
    expect(dirs).toEqual(['ModA', 'ModB']);
  });

  it('returns empty array when directory does not exist', async () => {
    mockReaddirAsync.mockRejectedValue(new Error('ENOENT') as never);
    const dirs = await listModDirs('/fake/missing');
    expect(dirs).toEqual([]);
  });
});

describe('regenerateModsTxt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes mods.txt with enabled entries for Steam', async () => {
    const api = fakeApi('subnautica2', '/games/SN2', 'steam');
    api.__setup__();
    mockReaddirAsync.mockResolvedValue(['ModA', 'ModB'] as never);
    mockStatAsync.mockResolvedValue({ isDirectory: () => true } as never);

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).toHaveBeenCalledWith(
      '/games/SN2/Subnautica2/Binaries/Win64/ue4ss/Mods/mods.txt',
      'ModA : 1\nModB : 1\n',
    );
  });

  it('uses WinGDK path for Xbox', async () => {
    const api = fakeApi('subnautica2', '/games/SN2', 'xbox');
    api.__setup__();
    mockReaddirAsync.mockResolvedValue(['ModA'] as never);
    mockStatAsync.mockResolvedValue({ isDirectory: () => true } as never);

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).toHaveBeenCalledWith(
      '/games/SN2/Binaries/WinGDK/ue4ss/Mods/mods.txt',
      'ModA : 1\n',
    );
  });

  it('no-ops when a different game is active', async () => {
    const api = fakeApi('othergame', '/games/SN2', 'steam');
    api.__setup__();

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).not.toHaveBeenCalled();
  });

  it('no-ops when discovery has no path', async () => {
    const api = fakeApi('subnautica2', undefined);
    api.__setup__();

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).not.toHaveBeenCalled();
  });

  it('writes empty file when no mod directories exist', async () => {
    const api = fakeApi('subnautica2', '/games/SN2', 'steam');
    api.__setup__();
    mockReaddirAsync.mockResolvedValue([] as never);

    await regenerateModsTxt({ profileId: 'p1', deployment: {}, api });

    expect(mockWriteFileAsync).toHaveBeenCalledWith(
      '/games/SN2/Subnautica2/Binaries/Win64/ue4ss/Mods/mods.txt',
      '',
    );
  });
});
```

- [ ] **Step 2: Commit hook tests**

```bash
git add test/hooks.test.ts
git commit -m "Add test/hooks.test.ts: unit tests for regenerateModsTxt hook"
```

---

### Task 6: Update config files

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`
- Modify: `tsconfig.json`
- Delete: `tsconfig.build.json`, `webpack.config.cjs`, `.eslintrc.cjs`

- [ ] **Step 1: Rewrite package.json**

```json
{
  "name": "game-subnautica2",
  "version": "1.0.3",
  "description": "Adds support for Subnautica 2 (UE5 / UE4SS). Supports pak mods, LogicMods, and UE4SS Lua mods.",
  "author": "tbaldridge",
  "license": "GPL-3.0-or-later",
  "private": true,
  "packageManager": "pnpm@11.0.9",
  "engines": {
    "node": ">=22"
  },
  "pnpm": {
    "ignoredBuiltDependencies": [
      "core-js"
    ]
  },
  "scripts": {
    "build": "node gdl/dist/cli.js build",
    "test": "node gdl/dist/cli.js build && vitest run",
    "test:corpus": "node gdl/dist/cli.js test:corpus",
    "package": "node gdl/dist/cli.js package"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "vortex-api": "github:Nexus-Mods/vortex-api"
  }
}
```

- [ ] **Step 2: Rewrite vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      '.gdl-out/tests.gen.ts',
      'test/**/*.test.ts',
    ],
    alias: {
      'vortex-api': resolve(__dirname, 'test/__mocks__/vortex-api.ts'),
      '@gdl/runtime': resolve(__dirname, 'gdl/src/runtime/index.ts'),
    },
    restoreMocks: true,
  },
});
```

- [ ] **Step 3: Rewrite tsconfig.json**

The tsconfig is only needed for the hooks file now. GDL uses its own tsconfig for bundling.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": false,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "test/**/*"]
}
```

- [ ] **Step 4: Commit config files**

```bash
git add package.json vitest.config.ts tsconfig.json
git commit -m "Update config files for GDL-based build pipeline"
```

---

### Task 7: Delete old source and test files

Remove all the custom code that GDL replaces.

**Files:**
- Delete: `src/index.ts`, `src/constants.ts`, `src/game.ts`, `src/modTypes.ts`, `src/installers.ts`, `src/stopPatterns.ts`
- Delete: `src/util/archive.ts`, `src/util/paths.ts`, `src/util/ue4ssState.ts`
- Delete: `test/archive.test.ts`, `test/paths.test.ts`, `test/constants.test.ts`, `test/game.test.ts`, `test/modTypes.test.ts`, `test/stopPatterns.test.ts`
- Delete: `test/pakInstaller.test.ts`, `test/logicModsInstaller.test.ts`, `test/ue4ssInstaller.test.ts`, `test/ue4ssInjectorInstaller.test.ts`
- Delete: `test/rootInstaller.test.ts`, `test/contentFolderInstaller.test.ts`, `test/pakAltInstaller.test.ts`, `test/ue4ssState.test.ts`
- Delete: `tsconfig.build.json`, `webpack.config.cjs`, `.eslintrc.cjs`, `.prettierrc`
- Keep: `test/__mocks__/vortex-api.ts` (needed for hooks tests)

- [ ] **Step 1: Delete old source files**

```bash
rm src/index.ts src/constants.ts src/game.ts src/modTypes.ts src/installers.ts src/stopPatterns.ts
rm -r src/util
```

- [ ] **Step 2: Delete old test files**

```bash
rm test/archive.test.ts test/paths.test.ts test/constants.test.ts test/game.test.ts
rm test/modTypes.test.ts test/stopPatterns.test.ts
rm test/pakInstaller.test.ts test/logicModsInstaller.test.ts test/ue4ssInstaller.test.ts
rm test/ue4ssInjectorInstaller.test.ts test/rootInstaller.test.ts test/contentFolderInstaller.test.ts
rm test/pakAltInstaller.test.ts test/ue4ssState.test.ts
```

- [ ] **Step 3: Delete obsolete config files**

```bash
rm -f tsconfig.build.json webpack.config.cjs .eslintrc.cjs .prettierrc
```

- [ ] **Step 4: Remove unnecessary devDependencies and reinstall**

```bash
pnpm install
```

- [ ] **Step 5: Commit deletions**

```bash
git add -A
git commit -m "Remove hand-coded extension: replaced by GDL game.yaml"
```

---

### Task 8: Build, generate tests, and verify

- [ ] **Step 1: Run GDL build**

```bash
node gdl/dist/cli.js build
```

Expected: `.gdl-out/extension.ts`, `.gdl-out/installers.gen.ts`, `.gdl-out/tests.gen.ts`, `.gdl-out/info.json` all generated. `dist/index.js` bundled.

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: all GDL-generated installer tests pass, hooks tests pass.

- [ ] **Step 3: Fix any test failures**

If tests fail, iterate on `game.yaml` installer rules (adjust `when`/`unless`/`anchor`/`take`/`placeAt`) and `src/hooks.ts` until all pass.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "Fix test failures from GDL rewrite"
```

---

### Task 9: Update .gitignore and final cleanup

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Update .gitignore**

Ensure `.gdl-out/` and `dist/` and `out/` are ignored, and `tests/cache/` (corpus archives) is ignored:

```
node_modules/
dist/
out/
.gdl-out/
tests/cache/
```

- [ ] **Step 2: Add .gdl-out to .gitignore if not already present**

- [ ] **Step 3: Final commit**

```bash
git add .gitignore
git commit -m "Update .gitignore for GDL output directories"
```

---

### Task 10: Corpus testing (if Nexus API key available)

- [ ] **Step 1: Fetch corpus archives**

```bash
node gdl/dist/cli.js test:corpus --fetch
```

This downloads real mod archives from NexusMods into `tests/cache/`. Requires `NEXUS_API_KEY` env var.

- [ ] **Step 2: Run corpus validation**

```bash
node gdl/dist/cli.js test:corpus
```

Expected: all archives match an installer, validators pass.

- [ ] **Step 3: Fix any corpus failures**

If archives don't match the expected installer, adjust the game.yaml rules or add new installers. Common issues:
- Archives with unexpected structure need new `when` patterns
- Priority ordering may need adjustment
- May need additional `unless` exclusions

- [ ] **Step 4: Commit corpus fixes**

```bash
git add game.yaml
git commit -m "Tune installer rules based on corpus testing"
```
