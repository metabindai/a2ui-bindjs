# BindJS for Apple development guide

This repo is the BindJS rendering engine for Apple platforms: a single SwiftPM library product, `BindJS`, that evaluates compiled BindJS bundles in a JSContext and renders them as SwiftUI.

## Build commands

- Build package: `swift build`
- Run tests: `swift test`
- Run a single test: `swift test --filter BindJSTests/specificTestName`

## Source layout

| Path | Contents |
|---|---|
| `Sources/BindJS/BindJSView.swift` | Entry-point view — evaluates a bundle and builds the SwiftUI view graph |
| `Sources/BindJS/ResolvedContent.swift` | Compiled-bundle model passed into `BindJSView` |
| `Sources/BindJS/Components/` | `Component` protocol, `ComponentRepresentable`, `ComponentView` (factory registration and render switches), with implementations in `Views/` and `Modifiers/` |
| `Sources/BindJS/Core/` | `Directive`, `ContentAction`, `GesturePhase`, `JSAnimation`, `ParsableArgument` |
| `Sources/BindJS/Infrastructure/` | `BindJSContext` (JS execution), `MCPHostBridge`, `ComponentRegistry` (host-app components registered via `.withComponent`), `JSTimers`, chart collectors |
| `Sources/BindJS/Visitors/` | `ComponentVisitor` protocol plus walker, rewriter, and children helpers |
| `Sources/BindJS/Resources/` | `BindJSRuntime.js` (bundled runtime — see provenance below), `BindJSRuntimeWrapper.js` (JSContext bootstrap that exposes the runtime to Swift) |
| `Tests/BindJSTests/` | Unit tests (charts, `MCPHostBridge` integration) |
| `Scripts/build-xcframework.sh` | Binary release build |

## JS runtime provenance

`Sources/BindJS/Resources/BindJSRuntime.js` is a bundled copy of the rollup output of bindjs-runtime's `packages/runtime` (entry `src/runtime/BindJSRuntime.js`, output `dist-runtime/runtime.js`). **bindjs-runtime is the source of truth.** Make runtime changes there, build the rollup output, and copy it over — the sync is manual today. Don't hand-edit the bundled file; edits are lost on the next sync.

## Code style guidelines

- **Naming**: PascalCase for types, camelCase for properties and methods. Component types use the `Component` suffix (`ButtonComponent`, `BoldComponent`)
- **SwiftUI pattern**: follow the SwiftUI modifier pattern (`.frame`, `.padding`) for component modifiers
- **Error handling**: use failable initializers (`init?(from:)`) and fallbacks instead of throwing errors upward
- **Imports**: minimal — most files need only SwiftUI; `JavaScriptCore`, `os`, Charts, and MapKit only where required
- **Documentation**: document public APIs with comments explaining purpose
- **Architecture**: protocol-oriented design (`Component` + `ComponentVisitor`) with protocol extensions for shared functionality
- **Testing**: add unit tests in `Tests/BindJSTests/` for new component types and modifiers

## Creating new components

To add a new component to BindJS, follow these steps:

1. **Create the component file** in `Sources/BindJS/Components/Views/` (or `Modifiers/` for modifiers)
   - Implement the `Component` protocol: `static var directiveName`, `init?(from:)`, and `accept<V: ComponentVisitor>` calling the matching visitor method
   - Conform to `View` (or `ViewModifier` for modifiers) with the SwiftUI implementation
   - For components with state, use `@State` properties as needed

2. **Add to ComponentVisitor** in `Sources/BindJS/Visitors/ComponentVisitor.swift`
   - Add the visitor method to the protocol: `mutating func visitYourComponent(_ component: YourComponent) -> Result`
   - Add a default implementation in the extension that calls `defaultVisit`

3. **Register the factory** in `Sources/BindJS/Components/ComponentView.swift`
   - Add an entry to the `componentFactories` dictionary: `YourComponent.directiveName: { YourComponent(from: $0) }`
   - Platform-gated components (Map, Gallery) go in `platformComponentFactories` instead

4. **Add the render case** in the same file
   - Views: add a case to the `ComponentView.body` switch: `case let yourComponent as YourComponent: yourComponent`
   - Modifiers: add a case to `ComponentViewModifier.body` instead

5. **Register in the JS runtime** — the component name must be in the `componentNames` array or the runtime won't recognize the directive
   - The array lives in bindjs-runtime at `packages/runtime/src/runtime/ComponentNames.js` (keep it alphabetically sorted)
   - Add it there, rebuild, and re-sync the bundled `BindJSRuntime.js` (see JS runtime provenance above) — don't edit the bundled copy directly

6. **Build and test**
   - Run `swift build` to make sure everything compiles
   - Components should support initialization from directives with various property names

## Publishing a binary release (maintainers)

When changes to bindjs-apple need to ship downstream (to metabind-apple), build an XCFramework and publish it to the `bindjs-apple-binary` repo.

### Steps

1. **Build the XCFramework** from the bindjs-apple repo root:
   ```bash
   bash ./Scripts/build-xcframework.sh
   ```
   This temporarily adds `type: .dynamic` to Package.swift (restored on exit), builds four slices (iOS device, iOS simulator, macOS, Mac Catalyst) with module stability, creates the XCFramework, zips it, and prints the checksum.

   Output:
   - `.build/xcframework/BindJS.xcframework.zip` — the distributable zip
   - Checksum (SHA256) — printed at the end
   - Slices: `ios-arm64`, `ios-arm64_x86_64-simulator`, `macos-arm64_x86_64`, `ios-arm64_x86_64-maccatalyst`

2. **Determine the next version** by checking existing tags:
   ```bash
   git -C ../bindjs-apple-binary tag --sort=-version:refname | head -1
   ```

3. **Update Package.swift** in `bindjs-apple-binary` with the new URL and checksum:
   ```swift
   .binaryTarget(
       name: "BindJS",
       url: "https://github.com/metabindai/bindjs-apple-binary/releases/download/<VERSION>/BindJS.xcframework.zip",
       checksum: "<CHECKSUM>"
   )
   ```
   Commit and push to `main` (the default branch).

4. **Create the GitHub release** targeting the commit that has the updated Package.swift:
   ```bash
   gh release create <VERSION> .build/xcframework/BindJS.xcframework.zip \
     --title "<VERSION>" --notes "Release notes" \
     --target <COMMIT_SHA> --repo metabindai/bindjs-apple-binary
   ```
   **Important:** Use `--target` to point at the Package.swift update commit. Creating the release before pushing the Package.swift update will tag the wrong commit, and SPM will resolve the old checksum.

5. **Update downstream** — bump the bindjs-apple-binary dependency version in metabind-apple's Package.swift.

### Key details
- The build script backs up and restores Package.swift automatically
- `BUILD_LIBRARY_FOR_DISTRIBUTION=YES` enables module stability for binary distribution
- SVGViewKit is statically linked into the framework; GLTFKit2 is provided separately by bindjs-apple-binary
- Binary repo is `metabindai/bindjs-apple-binary` (public), default branch `main`

## Component implementation notes

### Color handling
- Colors in BindJS use the `ColorComponent` type with named colors (e.g., "gray", "primary") or RGBA values
- For simple color fills in shapes, use SwiftUI's `Color` directly with `.fill()` modifier
- Default opacity values can be applied using `.opacity()` modifier

### Shape components pattern
- Shape components typically don't need to handle fill/stroke in the component itself
- The shape's appearance can be modified using SwiftUI's built-in modifiers
- RoundedRectangle is commonly used for placeholder-style components with customizable corner radius

### Component initialization
- Use default values in `init?(from:)` for optional parameters (e.g., `directive["cornerRadius"] ?? 10`)
- Keep components simple — avoid complex state management unless necessary
- Components without parameters still need the full protocol implementation
