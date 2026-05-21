// Hook implementations referenced by game.yaml's !hook tags.

export async function regenerateModsTxt(ctx: { profileId: string; deployment: unknown; api: unknown }): Promise<void> {
  // Real implementation: scan the UE4SS Mods folder and rewrite mods.txt so UE4SS
  // can find newly-installed lua mods. For now this is a stub; the legacy
  // subnautica2 extension's full logic can be ported here when the port goes live.
  void ctx;
}
