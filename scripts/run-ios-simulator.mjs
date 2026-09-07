// Builds one of the iOS examples for a simulator, installs it and launches it.
//
//     node scripts/run-ios-simulator.mjs [minimal|catalog|custom-catalog]
//
// `swift run` builds the same sources as a macOS window, which is quicker but draws with
// AppKit-backed SwiftUI: `Button` picks up platform chrome and there is no touch input.
// This runs the iOS the examples are written for, so it is what `pnpm dev:ios` does.
//
// Devices are addressed by UDID rather than name. `-destination name=...` implies
// `OS:latest`, so a simulator on any older runtime simply is not found — and names repeat
// across runtimes, which makes the failure look like the device is missing.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

// MARK: - The example

const EXAMPLES_DIR = 'examples/ios'
const DERIVED_DATA = '.build/ios-simulator'

/**
 * Everything about an example is derived from its own directory rather than listed here,
 * so adding one to `examples/ios/` is enough to make it runnable: the scheme is the name
 * of its generated project, and the bundle id comes from the `project.yml` that generated
 * it. A table here would be a second place to keep them in step.
 */
function readExample(name) {
    const directory = `${EXAMPLES_DIR}/${name}`

    if (!existsSync(directory)) {
        const available = readdirSync(EXAMPLES_DIR, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)

        throw new Error(`No example "${name}" in ${EXAMPLES_DIR}/. Available: ${available.join(', ')}`)
    }

    const project = readdirSync(directory).find((entry) => entry.endsWith('.xcodeproj'))

    if (!project) {
        throw new Error(`${directory} has no .xcodeproj. Generate it with \`xcodegen\`.`)
    }

    const scheme = project.replace('.xcodeproj', '')
    const bundleId = readFileSync(`${directory}/project.yml`, 'utf8').match(/PRODUCT_BUNDLE_IDENTIFIER: *(\S+)/)?.[1]

    if (!bundleId) {
        throw new Error(`${directory}/project.yml declares no PRODUCT_BUNDLE_IDENTIFIER.`)
    }

    return {
        project: `${directory}/${project}`,
        scheme,
        bundleId,
        app: `${DERIVED_DATA}/Build/Products/Debug-iphonesimulator/${scheme}.app`,
    }
}

const example = readExample(process.argv[2] ?? 'minimal')

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
console.log(`==> Building ${example.scheme}`)

run(
    'xcodebuild',
    [
        'build',
        '-project', example.project,
        '-scheme', example.scheme,
        '-configuration', 'Debug',
        '-destination', `id=${device.udid}`,
        '-derivedDataPath', DERIVED_DATA,
        '-quiet',
    ],
    { stdio: 'inherit' }
)

if (!existsSync(example.app)) {
    throw new Error(`xcodebuild succeeded but ${example.app} is missing.`)
}

// `boot` exits non-zero when the device is already booted, which is the common case.
if (device.state !== 'Booted') {
    run('xcrun', ['simctl', 'boot', device.udid])
}

run('xcrun', ['simctl', 'bootstatus', device.udid, '-b'])
run('open', ['-a', 'Simulator'])

console.log('==> Installing')
run('xcrun', ['simctl', 'install', device.udid, example.app])

console.log(`==> Launching ${example.bundleId}`)
run('xcrun', ['simctl', 'launch', device.udid, example.bundleId], { stdio: 'inherit' })
