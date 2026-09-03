// The Android build.
//
// Rooted here rather than at the repository root, which is the opposite of what
// `Package.swift` does — SwiftPM resolves a package by the manifest at the root of the
// repo, so the Apple manifest has nowhere else to live. Gradle has no such rule, and a
// settings file at the root would make every contributor's IDE try to import an Android
// build to work on the TypeScript.

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()

        // Before GitHub Packages, so `./gradlew :bindjs:publishToMavenLocal` in a
        // bindjs-android checkout is picked up without editing anything here.
        mavenLocal()

        // GitHub Packages requires authentication even to read. Credentials are nullable
        // on purpose: without them this repository simply cannot serve anything, and a
        // contributor who has bindjs in `mavenLocal` still gets a working build instead
        // of a configuration-time failure.
        maven {
            url = uri("https://maven.pkg.github.com/metabindai/bindjs-android-binary")
            credentials {
                username = providers.gradleProperty("gpr.user").orNull ?: System.getenv("GITHUB_ACTOR")
                password = providers.gradleProperty("gpr.key").orNull ?: System.getenv("GITHUB_TOKEN")
            }
        }
    }
}

rootProject.name = "a2ui-bindjs"

include(":a2ui")
project(":a2ui").projectDir = file("packages/a2ui-bindjs-android")

// The example's sources live with the other examples, grouped by platform like the web
// and iOS ones; only its build lives here, so the Android side has one Gradle build and
// one wrapper rather than two of each.
include(":minimal")
project(":minimal").projectDir = file("../examples/android/minimal")

// To develop against a local bindjs-android checkout instead of a published artifact,
// clone it beside this repository and uncomment:
//
//includeBuild("../../bindjs-android") {
//    dependencySubstitution {
//        substitute(module("ai.metabind:bindjs-android")).using(project(":bindjs"))
//    }
//}
