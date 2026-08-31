// swift-tools-version: 5.9
import PackageDescription

// What would ship as `a2ui-bindjs-apple`. It lives beside the example for now so the API
// can settle before it takes a repo and a version of its own; nothing in it knows about
// the example, and promoting it is a move plus swapping the path dependency below for a
// versioned one.
let package = Package(
    name: "a2ui-bindjs-apple",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .library(name: "A2UI", targets: ["A2UI"])
    ],
    dependencies: [
        // Vendored until the four `BindJSContext` methods this needs are released.
        .package(path: "../../vendor/bindjs-apple")
    ],
    targets: [
        .target(
            name: "A2UI",
            dependencies: [
                .product(name: "BindJS", package: "bindjs-apple")
            ],
            resources: [
                // Built by `pnpm --filter @metabindai/a2ui-bindjs sync:native`, and
                // versioned in lockstep with the npm package it comes from.
                .copy("Resources/a2ui-native.js")
            ]
        )
    ]
)
