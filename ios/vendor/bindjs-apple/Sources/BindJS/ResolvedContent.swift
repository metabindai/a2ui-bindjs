//
//  ResolvedContent.swift
//
//  Created on 10/2/25.
//

import Foundation

/// Resolved content ready for rendering (compiled JavaScript + resolved package dependencies)
public struct ResolvedContent: Sendable, Equatable, Hashable {
    public let compiled: String                  // Main content JavaScript
    public let package: PackageComponents        // Resolved component sources

    public init(compiled: String, package: PackageComponents) {
        self.compiled = compiled
        self.package = package
    }
}

public struct PackageComponents: Sendable, Equatable, Hashable {
    public let version: String
    public let components: [String: String]      // name → source

    public init(version: String, components: [String: String]) {
        self.version = version
        self.components = components
    }
}
