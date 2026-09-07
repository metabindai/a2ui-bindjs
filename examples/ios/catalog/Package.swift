// swift-tools-version: 5.9
import PackageDescription

// The app depends on the repository root, which is where the Apple library's manifest
// lives so SwiftPM can resolve it by URL. Only this directory is the example; everything it
// imports lives under `ios/`.
let package = Package(
    name: "A2UICatalog",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .executable(name: "A2UICatalog", targets: ["A2UICatalog"])
    ],
    dependencies: [
        .package(path: "../../..")
    ],
    targets: [
        .executableTarget(
            name: "A2UICatalog",
            dependencies: [
                .product(name: "A2UI", package: "a2ui-bindjs")
            ]
        )
    ]
)
