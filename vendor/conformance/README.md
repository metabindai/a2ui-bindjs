# Vendored A2UI conformance suite

Copied verbatim from the A2UI project (Apache-2.0), `vendor/conformance/` at
https://github.com/a2ui-project/a2ui — the language-agnostic YAML suite every
implementation is expected to run. Never edited.

The harness is `core/tests/conformance.suite.test.ts` and runs with `pnpm test`. It follows
the convention the suite's README documents, modelled on the Python SDK's reference harness
(`agent_sdks/python/a2ui_agent/tests/conformance/test_conformance.py`): read the YAML, feed
each payload to the implementation, assert the outcome.

## What is vendored

Only `core/`, plus the `test_data/` and `conformance_schema.json` it needs. The `agent/`
and `extensions/` suites cover streaming parsers, inference formats, A2A and ADK — agent-SDK
concerns, not renderer behaviour.

## Current standing

```
20 passed, 0 known gaps, 53 out of scope, of 73 cases
```

**Out of scope (53).** 39 are v0.8 payloads, which use a different vocabulary
(`beginRendering`, `surfaceUpdate`) that this renderer rejects by design; 0.9.1 and 1.0 are
supported. The other 14 are catalog operations an agent SDK performs before prompting a
model — `prune`, `load`, `render`, `verify_cuttable_keys` — and `accessibility_check`, which
drives axe-core.

**Known gaps: none.** The last two both wanted JSON Schema evaluation — one for message
fields (`version` required, `surfaceId` typed), one for component properties against a
custom catalog — and both are answered by the same mechanism.

`validateMessages` accepts a `schema` option: a validator the **host** supplies. Core carries
no JSON Schema engine, because it ships with no runtime dependencies at all and the bundle
build fails if one appears. What core does is the orchestration — which message to validate,
where the failure belongs in the run, and how to turn it into an issue with a JSON pointer
the `error` message can carry. The harness supplies ajv, which is already a devDependency;
`examples/web/metabind` is where this earns its keep, since it fetches a catalog at runtime
and nothing otherwise checks the components against their declared schema.

Worth stating plainly: those two cases pass by **delegating** JSON Schema evaluation, not by
implementing it. That is the same arrangement as a peer dependency, and a host with no engine
simply omits the option and gets the structural checks alone.

The message schema reaches the catalog through `catalog.json#/$defs/anyComponent`, so
validating a message validates the components inside it — which is why one mechanism closed
both cases rather than two.

`KNOWN_GAPS` in the harness is empty and should stay that way. Anything added to it runs
under `it.fails`, so it stays counted rather than hidden, and closing it turns the suite red
until the entry is deleted.

## Updating

Re-copy the files from upstream and run `pnpm test`. Cases that start passing will fail as
unexpected passes, which is the signal to remove them from `KNOWN_GAPS`.
