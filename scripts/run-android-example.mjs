// Builds one of the Android examples, installs it on a device and launches it.
//
//     node scripts/run-android-example.mjs [minimal|catalog|custom-catalog]
//
// The counterpart of `run-ios-simulator.mjs`, and it starts an emulator for the same
// reason that one boots a simulator: `installDebug` fails with "No connected devices!"
// if nothing is attached, which is the state a machine is in most of the time.
//
// A device that is already connected — an emulator left running, or a real phone — is
// always used in preference to starting one. Set $AVD to pin a particular image.

import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { androidEnvironment, fail, tool } from './android-env.mjs'

// MARK: - The example

const EXAMPLES_DIR = 'examples/android'

/**
 * The Gradle module and the application id both come from the example's own directory,
 * so adding one to `examples/android/` and `android/settings.gradle.kts` is enough. A
 * table here would be a third place to keep in step.
 */
function readExample(name) {
    const directory = `${EXAMPLES_DIR}/${name}`
    const buildFile = `${directory}/build.gradle.kts`

    if (!existsSync(buildFile)) {
        fail(`No example "${name}" in ${EXAMPLES_DIR}/.`)
    }

    const applicationId = readFileSync(buildFile, 'utf8').match(/applicationId *= *"([^"]+)"/)?.[1]

    if (!applicationId) {
        fail(`${buildFile} declares no applicationId.`)
    }

    return { module: `:${name}`, applicationId }
}

// MARK: - A device to install onto

const BOOT_TIMEOUT_MS = 180_000

function connectedDevices(adb, environment) {
    const listed = execFileSync(adb, ['devices'], { encoding: 'utf8', env: environment })

    return listed
        .split('\n')
        .slice(1)
        .filter((line) => line.trim().endsWith('\tdevice'))
        .map((line) => line.split('\t')[0])
}

/**
 * `adb wait-for-device` returns as soon as the daemon answers, which is well before
 * Android is up — installing at that point fails. `sys.boot_completed` is the property
 * that actually means ready.
 */
async function waitForBoot(adb, environment) {
    const deadline = Date.now() + BOOT_TIMEOUT_MS

    execFileSync(adb, ['wait-for-device'], { stdio: 'inherit', env: environment })

    while (Date.now() < deadline) {
        try {
            const booted = execFileSync(adb, ['shell', 'getprop', 'sys.boot_completed'], {
                encoding: 'utf8',
                env: environment,
            })

            if (booted.trim() === '1') {
                return
            }
        } catch {
            // The shell is not up yet. Keep waiting.
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    fail(`The emulator did not finish booting within ${BOOT_TIMEOUT_MS / 1000}s.`)
}

async function ensureDevice(sdk, environment) {
    const adb = tool(sdk, 'platform-tools', 'adb')
    const existing = connectedDevices(adb, environment)

    if (existing.length > 0) {
        console.log(`==> Device: ${existing[0]}`)

        return adb
    }

    const emulator = tool(sdk, 'emulator', 'emulator')
    const available = execFileSync(emulator, ['-list-avds'], { encoding: 'utf8', env: environment })
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

    if (available.length === 0) {
        fail([
            'No connected device and no emulator image to start.',
            '',
            'Create one in Android Studio (Device Manager), or attach a phone with USB',
            'debugging enabled.',
        ])
    }

    const avd = process.env.AVD ?? available[0]

    if (!available.includes(avd)) {
        fail(`No emulator image named "${avd}". Available: ${available.join(', ')}`)
    }

    console.log(`==> Starting emulator: ${avd}`)

    // Detached, because it outlives this script: the next run finds it already connected.
    spawn(emulator, ['-avd', avd], { detached: true, stdio: 'ignore', env: environment }).unref()

    await waitForBoot(adb, environment)

    return adb
}

// MARK: - Run

const example = readExample(process.argv[2] ?? 'minimal')
const { environment, sdk } = androidEnvironment()
const adb = await ensureDevice(sdk, environment)

console.log(`==> Installing ${example.module}`)

try {
    execFileSync('android/gradlew', ['-p', 'android', `${example.module}:installDebug`], {
        stdio: 'inherit',
        env: environment,
    })
} catch (error) {
    process.exit(error.status ?? 1)
}

console.log(`==> Launching ${example.applicationId}`)

// `monkey` starts whatever the launcher would, so the activity does not have to be named
// here — one less thing to keep in step with the examples' manifests.
execFileSync(adb, ['shell', 'monkey', '-p', example.applicationId, '-c', 'android.intent.category.LAUNCHER', '1'], {
    stdio: 'ignore',
    env: environment,
})
