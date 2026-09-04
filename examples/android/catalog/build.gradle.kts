plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

// The official example surfaces, carried into the APK as assets so the app needs nothing
// outside its module at runtime and no generated Kotlin. Verbatim from `vendor/spec/` —
// copied by this build, never committed twice. The iOS example embeds the same files as a
// generated Swift source because SwiftPM has no equivalent of a build-time asset copy.
//
// A task class rather than a `Sync`, because AGP wires generated assets through the
// variant API and that wants a `DirectoryProperty` output to hang the dependency on.
abstract class CopySpecExamples : DefaultTask() {

    @get:InputDirectory
    abstract val v1: DirectoryProperty

    @get:InputDirectory
    abstract val v09: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDirectory: DirectoryProperty

    @TaskAction
    fun copy() {
        val target = outputDirectory.get().asFile.resolve("a2ui-spec-examples")

        target.deleteRecursively()
        v1.get().asFile.copyRecursively(target.resolve("v1_0"))
        v09.get().asFile.copyRecursively(target.resolve("v0_9"))
    }
}

val specExamples = tasks.register<CopySpecExamples>("syncSpecExamples") {
    v1.set(rootProject.layout.projectDirectory.dir("../vendor/spec/v1_0/catalogs/basic/examples"))
    v09.set(rootProject.layout.projectDirectory.dir("../vendor/spec/v0_9/catalogs/basic/examples"))
}

android {
    namespace = "ai.metabind.a2ui.catalog"
    // The minor API level matches bindjs-android's. AAR metadata carries it, so a
    // consumer compiled against plain 36 is rejected at build time.
    compileSdk {
        version = release(libs.versions.android.compile.sdk.get().toInt()) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "ai.metabind.a2ui.catalog"
        minSdk = libs.versions.android.min.sdk.get().toInt()
        targetSdk = libs.versions.android.compile.sdk.get().toInt()
        versionCode = 1
        versionName = "0.1.0"
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
    }
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(specExamples, CopySpecExamples::outputDirectory)
    }
}

dependencies {
    implementation(project(":a2ui"))
    implementation(libs.bindjs)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.android.compose.ui)
    implementation(libs.android.compose.foundation)
    implementation(libs.android.compose.material3)
    androidTestImplementation(libs.androidx.test.junit)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.kotlinx.coroutines.test)
}
