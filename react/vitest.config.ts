import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Per-file: each test opts into jsdom with a docblock.
        environment: 'node',
        setupFiles: ['./tests/setup.dom.ts'],
        server: {
            deps: {
                // The published bindjs-react dist uses extensionless relative imports,
                // which Node's ESM resolver rejects. Inlining routes it through Vite,
                // which resolves them the way a bundler does.
                inline: ['@metabindai/bindjs-react'],
            },
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
})
