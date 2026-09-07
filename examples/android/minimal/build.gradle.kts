plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "ai.metabind.a2ui.minimal"
    // The minor API level matches bindjs-android's. AAR metadata carries it, so a
    // consumer compiled against plain 36 is rejected at build time.
    compileSdk {
        version = release(libs.versions.android.compile.sdk.get().toInt()) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "ai.metabind.a2ui.minimal"
        minSdk = libs.versions.android.min.sdk.get().toInt()
        targetSdk = libs.versions.android.compile.sdk.get().toInt()
        versionCode = 1
        versionName = "0.1.0"
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

dependencies {
    implementation(project(":a2ui"))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.android.compose.ui)
    implementation(libs.android.compose.foundation)
    implementation(libs.android.compose.material3)
}
