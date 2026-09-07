import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { AgentMessage } from '../src/protocol/types'

export function fixture(name: string): AgentMessage[] {
    const url = new URL(`./fixtures/${name}.json`, import.meta.url)
    return JSON.parse(readFileSync(fileURLToPath(url), 'utf8'))
}
