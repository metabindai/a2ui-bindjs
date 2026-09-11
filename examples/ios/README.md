# iOS examples

Each subdirectory is a standalone SwiftPM package with its own Xcode project, depending by
path on the repository root, whose `Package.swift` declares the
[`a2ui-bindjs-apple`](../../ios/packages/a2ui-bindjs-apple/README.md) library. They share
that library and nothing else, so one can be copied out without dragging the others along.

| Example    | What it shows                                                                        |
| ---------- | ------------------------------------------------------------------------------------ |
| [`minimal/`](minimal/README.md) | One agent-authored surface: bindings, functions, two-way controls, an action round trip |
| [`catalog/`](catalog/README.md) | Every basic-catalog component on its own screen, each a real A2UI surface: icon names, image variants, justify values, checks, filterable pickers |
| [`custom-catalog/`](custom-catalog/README.md) | The app's own BindJS component named by the agent, plus two overrides, using the web example's sources unchanged |

Each example runs the same three ways:

```bash
cd minimal
open A2UIMinimal.xcodeproj      # iOS: pick a simulator and run
swift run                       # macOS: same sources, a window
swift run A2UIMinimal --check   # the bridge, headless
```

## Adding another example

Copy `minimal/`, then give the new one its own identity: the package name, the executable
and scheme name, and `PRODUCT_BUNDLE_IDENTIFIER` in `project.yml`. Two examples sharing a
scheme name is confusing in Xcode's UI, and two sharing a bundle id means installing one
replaces the other on the simulator.

`xcodegen` regenerates the project from `project.yml`; the generated `.xcodeproj` is
checked in so an example opens and runs without any tooling.
