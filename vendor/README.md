# Vendored

Copies of other people's code, checked in and **never edited**. Each subdirectory says
where it came from and why it is here rather than being a dependency.

| Path                 | Source                                              | Why vendored                                           |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| `spec/v1_0/`         | `a2ui-project/a2ui` — A2UI v1.0 schemas and examples | The build generates the catalog from it, and the tests render all 43 examples through it. |
| `spec/v0_9/`         | `a2ui-project/a2ui` — the v0.9 basic-catalog examples only | Every upstream renderer, gallery and demo is still v0.9, so this is the corpus to compare against. The tests render all 43 and the native catalog example shows them beside the v1.0 ones. Schemas are not vendored; the engine answers to the v0.9 catalog id and renders them through the v1.0 catalog. |
| `conformance/`       | `a2ui-project/a2ui` — the official conformance suite | `pnpm test` runs it; vendoring keeps the run offline and pinned. |

Both are Apache-2.0, as is this repository.

## Updating

Re-copy from upstream and run `pnpm test`. Anything that changes shape will fail loudly:
the conformance harness lists the cases it cannot satisfy in `KNOWN_GAPS`, so a case that
starts passing fails as an unexpected pass and has to be removed from the list.
