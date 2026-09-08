# BindJS package migration (pending)

This branch switches the Android renderer and all three Android examples to the
planned `ai.metabind:bindjs-android:0.0.31` release, downloaded from
`https://maven.pkg.github.com/metabindai/bindjs-android`.

**Do not merge until that version is published at the new location and a clean
registry-backed build passes.** It is not published there yet.

The dependency name and Kotlin package names stay the same. Both the repository
URL in `settings.gradle.kts` and the `bindjs` version in
`gradle/libs.versions.toml` must change. GitHub Packages still requires a token
with `read:packages`; keep credentials outside the repository.

If old BindJS versions are deleted, fresh builds pinned to them will fail.
Existing installed apps remain functional. After cutover, build the library and
examples on a fresh CI worker without `mavenLocal` or a source substitution, and
run the native rendering tests on an Android device or emulator.
