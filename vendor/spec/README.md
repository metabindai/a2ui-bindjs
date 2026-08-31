# Vendored A2UI v1.0 specification

Copied verbatim from the A2UI project (Apache-2.0), via `@a2ui/web_core@0.10.6`
(`src/v1_0/schemas/`). Upstream: https://github.com/a2ui-project/a2ui

Nothing here is edited. It is the authoritative source for:

- `agent_to_renderer.json`, `renderer_to_agent.json`, `common_types.json` — message shapes
- `catalogs/basic/catalog.json` — the basic catalog's components and functions. The
  engine's child-slot map is **generated** from this file by
  `scripts/build-catalog-slots.mjs`, so which properties hold child references comes
  from the spec rather than from a hand-written list.
- `catalogs/basic/examples/*.json` — 43 example surfaces, used as test fixtures.

To update: drop in a newer copy and re-run `pnpm build`.
