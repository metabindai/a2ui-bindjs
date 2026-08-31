/**
 * Copies the renderer bundle into the Apple package's resources.
 *
 * Only one file moves. `BindJSRuntime.js` is not copied any more: the host already ships
 * it — `bindjs-apple` bundles it as a package resource and evaluates it at startup — and
 * a second copy would be a second version to keep in step.
 *
 * `a2ui-native.js` attaches to whatever runtime the host has already created. Hook state
 * and stored `handlerId`s live in that instance, so there can only be one.
 */
import { mkdirSync, statSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildBundle } from './build-bundle.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(here, '..')
const repoRoot = join(packageRoot, '..')

const defaultTarget = join(repoRoot, 'ios', 'packages', 'a2ui-bindjs-apple', 'Sources', 'A2UI', 'Resources')
const target = resolve(process.argv[2] ?? defaultTarget)

await buildBundle({ entry: 'native' })

mkdirSync(target, { recursive: true })
copyFileSync(join(packageRoot, 'dist-bundle', 'a2ui-native.js'), join(target, 'a2ui-native.js'))

console.log(`  a2ui-native.js       ${statSync(join(target, 'a2ui-native.js')).size} bytes`)
console.log(`sync-native: copied into ${target}`)
