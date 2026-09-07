# iOS / macOS

What ships for Apple platforms. No example apps live here — those are in
`examples/ios/`.

| Path                         | What it is                                                          |
| ---------------------------- | ------------------------------------------------------------------- |
| `packages/a2ui-bindjs-apple` | The library's sources: `A2UIHost`, `A2UISurfaceView`, and the renderer bundle. Its manifest is the repository's root `Package.swift`, which is what SwiftPM resolves by URL. |

Start with `packages/a2ui-bindjs-apple/README.md` — it covers the two things any native
host has to get right (one runtime; redraws come from the store) and why the seam it
stands on in `bindjs-apple` is shaped the way it is.

`pnpm sync:native` rebuilds `a2ui-native.js` into the library's resources from `core/`.
