// Runs the Android Gradle build with the JDK and SDK resolved for it.
//
//     node scripts/gradle.mjs :a2ui:connectedDebugAndroidTest
//
// See `android-env.mjs` for why either needs finding at all.

import { execFileSync } from 'node:child_process'
import { androidEnvironment } from './android-env.mjs'

const { environment } = androidEnvironment()

try {
    execFileSync('android/gradlew', ['-p', 'android', ...process.argv.slice(2)], {
        stdio: 'inherit',
        env: environment,
    })
} catch (error) {
    // Gradle has already printed why it failed; a Node stack trace on top of it is noise.
    process.exit(error.status ?? 1)
}
