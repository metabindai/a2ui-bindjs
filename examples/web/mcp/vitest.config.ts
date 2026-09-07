import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        // The published bindjs-react dist uses extensionless relative imports, which
        // Node's ESM resolver rejects; inlining routes it through Vite.
        server: { deps: { inline: ['@metabindai/bindjs-react'] } },
    },
})
