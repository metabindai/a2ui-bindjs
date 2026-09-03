# Vendored

Copies of other people's code, checked in and **never edited**. Each subdirectory says
where it came from and why it is here rather than being a dependency.

| Path                 | Source                                              | Why vendored                                           |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| `spec/`              | `a2ui-project/a2ui` — A2UI v1.0 schemas and examples | The build generates the catalog from it, and the tests render all 43 examples through it. |
| `conformance/`       | `a2ui-project/a2ui` — the official conformance suite | `pnpm test` runs it; vendoring keeps the run offline and pinned. |

Both are Apache-2.0, as is this repository.

## Updating

Re-copy from upstream and run `pnpm test`. Anything that changes shape will fail loudly:
the conformance harness lists the cases it cannot satisfy in `KNOWN_GAPS`, so a case that
starts passing fails as an unexpected pass and has to be removed from the list.
