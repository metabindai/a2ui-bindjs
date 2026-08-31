// swift-tools-version: 5.9
import PackageDescription

// SwiftPM resolves a package by the manifest at the repository root, so this is what makes
// the Apple library consumable:
//
//     .package(url: "https://github.com/metabindai/a2ui-bindjs.git", from: "0.1.0")
//
// The sources live under `ios/`, and the JavaScript renderer travels with them as a
// resource. `bindjs-apple` is a path dependency on the vendored copy for now; it becomes a
// versioned one once the four `BindJSContext` methods it needs are released.
let package = Package(
    name: "a2ui-bindjs",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .library(name: "A2UI", targets: ["A2UI"])
    ],
    dependencies: [
        .package(path: "ios/vendor/bindjs-apple")
    ],
    targets: [
        .target(
            name: "A2UI",
            dependencies: [
                .product(name: "BindJS", package: "bindjs-apple")
            ],
            path: "ios/packages/a2ui-bindjs-apple/Sources/A2UI",
            resources: [
                // Built by `pnpm sync:native`, and committed so this package works without
                // a JavaScript toolchain.
                .copy("Resources/a2ui-native.js")
            ]
        )
    ]
)
