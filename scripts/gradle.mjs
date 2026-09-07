// Runs the Android Gradle build with a JDK, whether or not the shell has one.
//
//     node scripts/gradle.mjs :catalog:installDebug
//
// macOS has not bundled a JDK since Java 8. What it does ship is `/usr/bin/java`, a stub
// that prints "Unable to locate a Java Runtime" and exits — so a contributor with Android
// Studio installed, and therefore a perfectly good JDK on disk, still cannot run the
// Android examples. Gradle, the Android Gradle Plugin and the Kotlin compiler are all JVM
// programs, which is why nothing on this side works without one and the iOS side needs no
// equivalent: `xcodebuild` is native and arrives with Xcode.
//
// An existing JAVA_HOME always wins. This only steps in when there is nothing to use.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

// MARK: - Finding a JDK

/** Android Studio's bundled runtime, at the paths the installers actually use. */
const BUNDLED_RUNTIMES = [
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    `${process.env.HOME}/Applications/Android Studio.app/Contents/jbr/Contents/Home`,
    '/Applications/IntelliJ IDEA.app/Contents/jbr/Contents/Home',
]

/** `/usr/bin/java` exists on every Mac, so its presence proves nothing — run it. */
function pathJavaWorks() {
    try {
        execFileSync('java', ['-version'], { stdio: 'ignore' })

        return true
    } catch {
        return false
    }
}

function findJavaHome() {
    if (process.env.JAVA_HOME) {
        return process.env.JAVA_HOME
    }

    if (pathJavaWorks()) {
        return undefined
    }

    return BUNDLED_RUNTIMES.find((path) => existsSync(path))
}

// MARK: - Run

const javaHome = findJavaHome()

if (!javaHome && !pathJavaWorks()) {
    console.error(
        [
            'No Java runtime found, and Gradle needs one.',
            '',
            'Install Android Studio, which bundles a JDK, or set JAVA_HOME to one you have:',
            '',
            '    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"',
        ].join('\n')
    )

    process.exit(1)
}

if (javaHome && !process.env.JAVA_HOME) {
    console.log(`==> JAVA_HOME: ${javaHome}`)
}

execFileSync('android/gradlew', ['-p', 'android', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: javaHome ? { ...process.env, JAVA_HOME: javaHome } : process.env,
})
