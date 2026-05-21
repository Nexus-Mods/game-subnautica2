# Subnautica 2 support for Vortex (GDL port)

This branch is the GDL-based port of game-subnautica2. The game's
behavior is described in [`game.yaml`](./game.yaml); the GDL toolchain
in [`gdl/`](./gdl/) compiles it into a Vortex extension bundle.

The legacy hand-written TypeScript extension is on `main`. See
[`GAPS.md`](./GAPS.md) for what this port does **not** yet cover —
features the legacy extension provides that GDL needs to grow before
the port can fully replace it.

## Develop

```bash
git submodule update --init
cd gdl && pnpm install && pnpm build && cd ..
pnpm install
pnpm run build    # game.yaml -> dist/extension.js
pnpm test         # runs inline cases from game.yaml
pnpm run package  # produces out/subnautica2-vortex-v<version>.zip
```

## Release

Bump `package.json#version`, tag `v<version>`, push. CI does the rest.
