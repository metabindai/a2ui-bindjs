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
18 passed, 2 known gaps, 53 out of scope, of 73 cases
```

**Out of scope (53).** 39 are v0.8 payloads, which use a different vocabulary
(`beginRendering`, `surfaceUpdate`) that this renderer rejects by design; 0.9.1 and 1.0 are
supported. The other 14 are catalog operations an agent SDK performs before prompting a
model — `prune`, `load`, `render`, `verify_cuttable_keys` — and `accessibility_check`, which
drives axe-core.

**Known gaps (2).** Neither is an oversight.

`test_validator_0_9` wants every field rule the v0.9 schema states enforced — `version`
required and drawn from a known set, `surfaceId` typed, `catalogId` required. `parseMessage`
checks a message's shape and `validateMessages` checks the component graph; neither enforces
the full schema, and turning those on would reject messages this renderer accepts today.

`test_custom_catalog_validation_failure_v09` wants component properties checked against the
catalog's JSON Schema. That needs a JSON Schema validator, and `core/` ships with no runtime
dependencies — the bundle build fails if one appears. A host that wants this can validate
with its own before applying.

The other twelve were closed by `core/src/validation/validate.ts`: missing root, dangling
references, self-reference, cycles, reachability through child templates, malformed data
paths, function-call nesting, and graph and data-model depth. Two things that came out of
running the suite properly are worth recording, because both would have made the validator
wrong in practice:

- **A path may be relative.** Inside a child template A2UI writes `title`, not
  `/items/0/title`. Requiring a leading `/` rejected eleven of the official examples.
- **A superseded component is not an orphan.** A stream that shows a placeholder and then
  replaces it leaves the placeholder unreferenced at the end;
  `31_incremental-dashboard.json` does exactly this. Reachability is judged over the whole
  replay, not the final snapshot.

Gaps are listed by name in `KNOWN_GAPS` in the harness and run under `it.fails`, so they
stay counted, and closing one turns the suite red until its entry is deleted.

## Updating

Re-copy the files from upstream and run `pnpm test`. Cases that start passing will fail as
unexpected passes, which is the signal to remove them from `KNOWN_GAPS`.
