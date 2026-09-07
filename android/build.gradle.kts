buildscript {
    dependencies {
        // Keep in step with `kotlin` in gradle/libs.versions.toml, the way bindjs-android
        // does — the two builds compose when the includeBuild in settings is enabled.
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.10")
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.compose.compiler) apply false
}
