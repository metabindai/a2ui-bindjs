/**
 * Runs the Metabind CLI's structural validator over every prebundled catalog component.
 *
 * This catches things neither TypeScript nor our tests can see — the props-form of a
 * layout requiring a literal `Component[]`, for instance, which is valid JavaScript and
 * renders fine in our tests but is rejected when pushed to Metabind.
 *
 * Skips cleanly when the CLI is not installed, so it can sit in CI without becoming a
 * hard dependency for contributors.
 */
import { execFile } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const catalogDir = join(here, '..', 'src', 'catalog', 'basic')

async function hasCli() {
    try {
        await run('metabind', ['--version'])

        return true
    } catch {
        return false
    }
}

if (!(await hasCli())) {
    console.log('validate-catalog: metabind CLI not found — skipping')
    process.exit(0)
}

const files = readdirSync(catalogDir).filter((name) => name.endsWith('.js'))
const failures = []

for (const file of files) {
    // A non-zero exit still carries the JSON report, so read stdout either way.
    const { stdout } = await run('metabind', ['validate', 'component', join(catalogDir, file)]).catch((error) => error)
    let report

    try {
        report = JSON.parse(stdout ?? '{}').data
    } catch {
        failures.push(`${file}: could not parse the validator's output`)
        continue
    }

    if (!report?.ok) {
        for (const diagnostic of report?.diagnostics ?? []) {
            failures.push(`${file}:${diagnostic.line ?? '?'} ${diagnostic.code} — ${diagnostic.message}`)
        }
    }
}

if (failures.length > 0) {
    console.error(`validate-catalog: ${failures.length} problem(s)`)
    failures.forEach((line) => console.error(`  ${line}`))
    process.exit(1)
}

console.log(`validate-catalog: ${files.length} components valid`)
