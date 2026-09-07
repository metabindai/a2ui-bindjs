// Builds the minimal example for an iOS simulator, installs it and launches it.
//
// `swift run` builds the same sources as a macOS window, which is quicker but draws with
// AppKit-backed SwiftUI: `Button` picks up platform chrome and there is no touch input.
// This runs the iOS the example is written for, so it is what `pnpm dev:ios` does.
//
// Devices are addressed by UDID rather than name. `-destination name=...` implies
// `OS:latest`, so a simulator on any older runtime simply is not found — and names repeat
// across runtimes, which makes the failure look like the device is missing.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

// MARK: - Constants

const PROJECT = 'examples/ios/minimal/A2UIMinimal.xcodeproj'
const SCHEME = 'A2UIMinimal'
const BUNDLE_ID = 'ai.metabind.a2ui.minimal'

const DERIVED_DATA = '.build/ios-simulator'
const APP = `${DERIVED_DATA}/Build/Products/Debug-iphonesimulator/${SCHEME}.app`

// MARK: - Helpers

function run(command, args, options = {}) {
    return execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options })
}

/** Every booted-or-bootable simulator, newest runtime first. */
function availableDevices() {
    const listed = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']))
    const devices = []

    for (const [runtime, entries] of Object.entries(listed.devices)) {
        const version = runtime.replace('com.apple.CoreSimulator.SimRuntime.', '')

        for (const entry of entries) {
            devices.push({ ...entry, runtime: version })
        }
    }

    return devices.sort((a, b) => b.runtime.localeCompare(a.runtime, undefined, { numeric: true }))
}

/**
 * $SIMULATOR (a name or a UDID) wins, then whatever is already booted, then the newest
 * iPhone. Preferring the booted device means a simulator the developer already has open
 * is the one that gets the app.
 */
function chooseDevice() {
    const devices = availableDevices()
    const requested = process.env.SIMULATOR

    if (requested) {
        const match = devices.find((device) => device.udid === requested || device.name === requested)

        if (!match) {
            const names = devices.map((device) => `  ${device.name} (${device.runtime})`).join('\n')
            throw new Error(`No simulator named "${requested}". Available:\n${names}`)
        }

        return match
    }

    const booted = devices.find((device) => device.state === 'Booted')

    if (booted) {
        return booted
    }

    const iPhone = devices.find((device) => device.name.startsWith('iPhone'))

    if (!iPhone) {
        throw new Error('No iOS simulator available. Add one in Xcode > Settings > Components.')
    }

    return iPhone
}

// MARK: - Run

const device = chooseDevice()

console.log(`==> Simulator: ${device.name} (${device.runtime})`)
console.log(`==> Building ${SCHEME}`)

run(
    'xcodebuild',
    [
        'build',
        '-project', PROJECT,
        '-scheme', SCHEME,
        '-configuration', 'Debug',
        '-destination', `id=${device.udid}`,
        '-derivedDataPath', DERIVED_DATA,
        '-quiet',
    ],
    { stdio: 'inherit' }
)

if (!existsSync(APP)) {
    throw new Error(`xcodebuild succeeded but ${APP} is missing.`)
}

// `boot` exits non-zero when the device is already booted, which is the common case.
if (device.state !== 'Booted') {
    run('xcrun', ['simctl', 'boot', device.udid])
}

run('xcrun', ['simctl', 'bootstatus', device.udid, '-b'])
run('open', ['-a', 'Simulator'])

console.log('==> Installing')
run('xcrun', ['simctl', 'install', device.udid, APP])

console.log(`==> Launching ${BUNDLE_ID}`)
run('xcrun', ['simctl', 'launch', device.udid, BUNDLE_ID], { stdio: 'inherit' })
