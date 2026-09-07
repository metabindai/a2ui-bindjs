/**
 * Bundles the renderer into a single dependency-free JavaScript file, the way
 * `bindjs-runtime` ships `dist-runtime/runtime.js` for the native hosts to embed.
 *
 * What goes in is `src/index.ts` — protocol, store, functions, engine and the basic
 * catalog sources. React is not part of it: only `src/react` imports React, and a native
 * host brings its own renderer.
 *
 * Output is an IIFE exposing a single `A2UI` global, which is the shape a JS context
 * embedded in an app can evaluate directly.
 */
import { gzipSync } from 'node:zlib'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(here, '..')
const outputDir = join(packageRoot, 'dist-bundle')

/**
 * ES2022 private fields (`#field`) are not supported by every engine an app might embed
 * — notably older Hermes on Android — so the shipped bundle is downlevelled. It costs
 * about 700 bytes gzipped.
 */
const TARGET = 'es2020'

/** Anything here means the bundle assumes a host it will not always get. */
const FORBIDDEN = [
    { pattern: /\brequire\s*\(/, name: 'require()' },
    { pattern: /\bprocess\s*\./, name: 'process.*' },
    { pattern: /\b__dirname\b/, name: '__dirname' },
    { pattern: /\bBuffer\b/, name: 'Buffer' },
    { pattern: /from\s*["']node:/, name: 'node: import' },
]

export async function buildBundle({ write = true, entry = 'index' } = {}) {
    const entryPoint = join(packageRoot, 'src', entry === 'native' ? 'native/global.ts' : 'index.ts')

    const result = await esbuild.build({
        entryPoints: [entryPoint],
        // Pinned so the output does not depend on where the script was invoked from:
        // esbuild writes each input's path into a comment, relative to its working
        // directory, and CI asserts the committed bundle is byte-identical.
        absWorkingDir: packageRoot,
        bundle: true,
        format: 'iife',
        globalName: 'A2UI',
        platform: 'neutral',
        target: TARGET,
        write: false,
        metafile: true,
        logLevel: 'error',
    })

    const minified = await esbuild.build({
        entryPoints: [entryPoint],
        absWorkingDir: packageRoot,
        bundle: true,
        format: 'iife',
        globalName: 'A2UI',
        platform: 'neutral',
        target: TARGET,
        minify: true,
        write: false,
        logLevel: 'error',
    })

    const readable = result.outputFiles[0].text
    const compact = minified.outputFiles[0].text

    // The point of the exercise: nothing outside the package may be pulled in.
    const external = Object.keys(result.metafile.inputs).filter((input) => input.includes('node_modules'))

    if (external.length > 0) {
        throw new Error(`Bundle is not self-contained; it pulled in: ${external.join(', ')}`)
    }

    for (const { pattern, name } of FORBIDDEN) {
        if (pattern.test(readable)) {
            throw new Error(`Bundle references ${name}, which an embedded JS context may not provide.`)
        }
    }

    if (write) {
        const name = entry === 'native' ? 'a2ui-native' : 'a2ui'

        mkdirSync(outputDir, { recursive: true })
        writeFileSync(join(outputDir, `${name}.js`), readable)
        writeFileSync(join(outputDir, `${name}.min.js`), compact)
    }

    return { readable, compact, outputDir }
}

function report(label, source) {
    const raw = Buffer.byteLength(source)
    const gzipped = gzipSync(source, { level: 9 }).length

    console.log(`  ${label.padEnd(12)} ${String(raw).padStart(7)} bytes   ${String(gzipped).padStart(6)} gzipped`)
}

// Only run when invoked directly, so tests can import `buildBundle` without side effects.
if (process.argv[1] && readFileSync(process.argv[1], 'utf8').includes('build-bundle')) {
    console.log(`build-bundle: target ${TARGET}, no external dependencies`)

    for (const entry of ['index', 'native']) {
        const { readable, compact } = await buildBundle({ entry })
        const name = entry === 'native' ? 'a2ui-native' : 'a2ui'

        report(`${name}.js`, readable)
        report(`${name}.min.js`, compact)
    }
}
