/**
 * Copies the renderer bundle into a native package's resources.
 *
 *     node scripts/sync-native.mjs [target-dir] [filename]
 *
 * Both arguments are optional and resolve against the repository root; the defaults are
 * the Apple package's. Android passes both, because `res/raw` file names may only hold
 * lowercase letters, digits and underscores — a hyphen there is a build error, not a
 * lint warning.
 *
 * Only one file moves. `BindJSRuntime.js` is not copied any more: the host already ships
 * it — `bindjs-apple` bundles it as a package resource and evaluates it at startup, and
 * `bindjs-android` carries it as `res/raw/script.js` — and a second copy would be a
 * second version to keep in step.
 *
 * The bundle attaches to whatever runtime the host has already created. Hook state and
 * stored `handlerId`s live in that instance, so there can only be one.
 */
import { mkdirSync, statSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildBundle } from './build-bundle.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(here, '..')
const repoRoot = join(packageRoot, '..')

const defaultTarget = join('ios', 'packages', 'a2ui-bindjs-apple', 'Sources', 'A2UI', 'Resources')
const target = resolve(repoRoot, process.argv[2] ?? defaultTarget)
const filename = process.argv[3] ?? 'a2ui-native.js'

await buildBundle({ entry: 'native' })

mkdirSync(target, { recursive: true })
copyFileSync(join(packageRoot, 'dist-bundle', 'a2ui-native.js'), join(target, filename))

console.log(`  ${filename.padEnd(20)} ${statSync(join(target, filename)).size} bytes`)
console.log(`sync-native: copied into ${target}`)
