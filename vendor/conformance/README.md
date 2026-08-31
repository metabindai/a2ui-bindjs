# Vendored A2UI conformance suite

Copied verbatim from the A2UI project (Apache-2.0), `conformance/` at
https://github.com/a2ui-project/a2ui — the language-agnostic YAML suite every implementation
is expected to run. Never edited.

Only `core/` is vendored, plus the `test_data/` and `conformance_schema.json` it needs. The
`agent/` and `extensions/` suites cover streaming parsers, inference formats, A2A and ADK,
which are agent-SDK concerns rather than renderer behaviour.

## Running it

The harness is `core/tests/conformance.suite.test.ts`, and `pnpm test` runs it. It follows
the convention the suite's own README documents, modelled on the Python SDK's reference
harness (`agent_sdks/python/a2ui_agent/tests/conformance/test_conformance.py`): read the
YAML, feed each payload to the implementation, assert the outcome.

```
20 passed, 0 known gaps, 53 out of scope, of 73 cases
```

## Out of scope

Thirty-nine cases are v0.8 payloads. They use a different vocabulary — `beginRendering`,
`surfaceUpdate` — which this renderer rejects by design; v0.9.1 and v1.0 are supported.

The other fourteen are operations an agent SDK performs before prompting a model — `prune`,
`load`, `render`, `verify_cuttable_keys` — and `accessibility_check`, which drives axe-core.

## Known gaps

`KNOWN_GAPS` in the harness is empty. Anything listed there runs under `it.fails`, so a gap
stays counted rather than hidden, and satisfying it turns the suite red until its entry is
deleted.

## Schema validation

Cases that check message fields or component properties need a JSON Schema engine. Core
carries none — it ships with no runtime dependencies, and the bundle build fails if one
appears — so `validateMessages` takes one from the caller:

```ts
validateMessages(messages, { schema })
```

Core decides what to validate and where a failure belongs in the run of messages, turning
each into an issue carrying a JSON pointer the A2UI `error` message can use. Evaluating the
schema is the caller's job; the harness supplies ajv, already a devDependency. Those cases
pass by delegating that evaluation rather than implementing it, which is the same
arrangement as a peer dependency. A caller with no engine omits the option and gets the
structural checks alone.

The message schema reaches the catalog through `catalog.json#/$defs/anyComponent`, so
validating a message validates the components inside it.

## Updating

Re-copy the files from upstream and run `pnpm test`. A case that starts passing fails as an
unexpected pass, which is the signal to remove it from `KNOWN_GAPS`.
