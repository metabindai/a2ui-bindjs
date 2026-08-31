// swift-tools-version: 5.11
// The swift-tools-version declares the minimum version of Swift required to build this package.
import PackageDescription

let package = Package(
    name: "bindjs-apple",
    platforms: [
        .macOS(.v14),
        .iOS(.v17),
        .watchOS(.v10),
        .tvOS(.v17),
        .visionOS(.v1)
    ],
    products: [
        .library(
            name: "BindJS",
            targets: ["BindJS"]),
    ],
    dependencies: [
        .package(url: "https://github.com/yapstudios/SVGView.git", exact: "1.0.7"),
        .package(url: "https://github.com/warrenm/GLTFKit2", exact: "0.5.14")
    ],
    targets: [
        .target(
            name: "BindJS",
            dependencies: [
                .product(name: "SVGViewKit", package: "SVGView"),
                .product(name: "GLTFKit2", package: "GLTFKit2")
            ],
            resources: [
                .copy("Resources/BindJSRuntime.js"),
                .copy("Resources/BindJSRuntimeWrapper.js")
            ]
        ),
    ]
)
