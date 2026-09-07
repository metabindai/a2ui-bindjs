// Finds the JDK and SDK the Android build needs, so a plain shell can run it.
//
// Neither is discoverable from a plain shell on macOS: no JDK has shipped since Java 8,
// and Android Studio installs its SDK under ~/Library without exporting anything. The iOS
// side needs no equivalent because `xcodebuild` is native and arrives with Xcode.
//
// Both resolvers defer to the environment and only step in when nothing is set.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

// MARK: - Finding a JDK

/** Bundled runtimes, at the paths the installers actually use. */
const BUNDLED_RUNTIMES = [
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    `${process.env.HOME}/Applications/Android Studio.app/Contents/jbr/Contents/Home`,
    '/Applications/IntelliJ IDEA.app/Contents/jbr/Contents/Home',
]

/** `/usr/bin/java` exists on every Mac and is a stub that only prints an error — run it. */
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
        return { path: process.env.JAVA_HOME, fromEnvironment: true }
    }

    if (pathJavaWorks()) {
        return { path: undefined, fromEnvironment: true }
    }

    const bundled = BUNDLED_RUNTIMES.find((path) => existsSync(path))

    if (!bundled) {
        fail([
            'No Java runtime found, and Gradle needs one.',
            '',
            'Install Android Studio, which bundles a JDK, or set JAVA_HOME to one you have:',
            '',
            '    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"',
        ])
    }

    return { path: bundled, fromEnvironment: false }
}

// MARK: - Finding the SDK

const SDK_LOCATIONS = [
    `${process.env.HOME}/Library/Android/sdk`,
    '/usr/local/share/android-sdk',
    '/opt/homebrew/share/android-sdk',
]

/**
 * `local.properties` is the file Gradle itself reads, and it is gitignored because the
 * path is particular to one machine. If someone has written one, it is the answer.
 */
function sdkFromLocalProperties() {
    const path = 'android/local.properties'

    if (!existsSync(path)) {
        return undefined
    }

    return readFileSync(path, 'utf8').match(/^sdk\.dir=(.+)$/m)?.[1]?.trim()
}

function findAndroidHome() {
    const configured = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || sdkFromLocalProperties()

    if (configured) {
        return { path: configured, fromEnvironment: true }
    }

    const installed = SDK_LOCATIONS.find((path) => existsSync(path))

    if (!installed) {
        fail([
            'No Android SDK found, and Gradle needs one.',
            '',
            'Install it through Android Studio (Settings > Languages & Frameworks > Android SDK),',
            'or point ANDROID_HOME at one you have:',
            '',
            '    export ANDROID_HOME="$HOME/Library/Android/sdk"',
        ])
    }

    return { path: installed, fromEnvironment: false }
}

// MARK: - Public

export function fail(lines) {
    console.error(Array.isArray(lines) ? lines.join('\n') : lines)
    process.exit(1)
}

/**
 * The environment to hand a child process, plus the SDK path its own tools live under.
 * Resolutions this script made are announced; an exported value is the user's own and is
 * not worth a line.
 */
export function androidEnvironment() {
    const java = findJavaHome()
    const sdk = findAndroidHome()

    for (const [name, resolved] of [
        ['JAVA_HOME', java],
        ['ANDROID_HOME', sdk],
    ]) {
        if (resolved.path && !resolved.fromEnvironment) {
            console.log(`==> ${name}: ${resolved.path}`)
        }
    }

    const environment = { ...process.env, ANDROID_HOME: sdk.path }

    if (java.path) {
        environment.JAVA_HOME = java.path
    }

    return { environment, sdk: sdk.path }
}

export function tool(sdk, ...parts) {
    return [sdk, ...parts].join('/')
}
