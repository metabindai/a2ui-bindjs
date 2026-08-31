// swift-tools-version: 5.9
import PackageDescription

// The app depends on `ios/packages/a2ui-bindjs-apple` — what would ship — which in turn
// depends on the vendored `bindjs-apple` beside it. Only this directory is the example;
// everything it imports lives under `ios/`.
let package = Package(
    name: "A2UIMinimal",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .executable(name: "A2UIMinimal", targets: ["A2UIMinimal"])
    ],
    dependencies: [
        .package(path: "../../../ios/packages/a2ui-bindjs-apple")
    ],
    targets: [
        .executableTarget(
            name: "A2UIMinimal",
            dependencies: [
                .product(name: "A2UI", package: "a2ui-bindjs-apple")
            ]
        )
    ]
)
