import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Nothing here touches the DOM: React lives in the `react` package, and so does
        // its jsdom setup. This half is the protocol, the store, the functions and the
        // engine, all of which run in plain Node.
        environment: 'node',
    },
})
