plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.compose.compiler)
    `maven-publish`
}

// The 43 official spec examples, carried into the test APK so the same surfaces the core
// suite renders in Node are rendered here through the real bridge. Verbatim from
// `vendor/spec/` — copied, never edited.
//
// A task class rather than a `Sync`, because AGP wires generated assets through the
// variant API and that wants a `DirectoryProperty` output to hang the dependency on.
abstract class CopySpecExamples : DefaultTask() {

    @get:InputDirectory
    abstract val source: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDirectory: DirectoryProperty

    @TaskAction
    fun copy() {
        val target = outputDirectory.get().asFile.resolve("a2ui-spec-examples")

        target.deleteRecursively()
        source.get().asFile.copyRecursively(target)
    }
}

val specExamples = tasks.register<CopySpecExamples>("syncSpecExamples") {
    source.set(rootProject.layout.projectDirectory.dir("../vendor/spec/v1_0/catalogs/basic/examples"))
}

android {
    namespace = "ai.metabind.a2ui"
    // The minor API level matches bindjs-android's. AAR metadata carries it, so a
    // consumer compiled against plain 36 is rejected at build time.
    compileSdk {
        version = release(libs.versions.android.compile.sdk.get().toInt()) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        minSdk = libs.versions.android.min.sdk.get().toInt()
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    buildFeatures {
        compose = true
    }

    sourceSets {
        named("main") { kotlin.srcDir("src/main/kotlin") }
        named("androidTest") { kotlin.srcDir("src/androidTest/kotlin") }
    }

    publishing {
        multipleVariants {
            includeBuildTypeValues("release", "debug")
        }
    }
}

androidComponents {
    onVariants { variant ->
        variant.androidTest?.sources?.assets?.addGeneratedSourceDirectory(specExamples, CopySpecExamples::outputDirectory)
    }
}

publishing {
    publications {
        register<MavenPublication>("release") {
            groupId = "ai.metabind"
            artifactId = "a2ui-bindjs-android"
            version = "0.1.1"

            pom {
                name.set("a2ui-bindjs-android")
                description.set("A2UI (Agent-to-UI) surfaces rendered natively through BindJS on Compose.")
                licenses {
                    license {
                        name.set("The Apache License, Version 2.0")
                        url.set("http://www.apache.org/licenses/LICENSE-2.0.txt")
                    }
                }
            }

            afterEvaluate {
                from(components["default"])
            }
        }
    }

    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/metabindai/a2ui-bindjs")
            credentials {
                username = project.findProperty("gpr.user") as String? ?: System.getenv("GITHUB_ACTOR")
                password = project.findProperty("gpr.key") as String? ?: System.getenv("GITHUB_TOKEN")
            }
        }
    }
}

dependencies {
    // `api`, not `implementation`: JsRuntime and BaseComponent are in this package's own
    // signatures — a host constructs the runtime it shares and passes it in.
    api(libs.bindjs)
    api(libs.kotlinx.coroutines.core)

    implementation(libs.androidx.core.ktx)
    implementation(libs.android.compose.ui)
    implementation(libs.android.compose.foundation)

    androidTestImplementation(libs.androidx.test.junit)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.junit)
}
