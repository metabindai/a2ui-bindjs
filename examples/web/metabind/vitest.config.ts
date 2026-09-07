import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        // Vite loads `.env.local`, so a developer with real credentials would otherwise
        // have the "unconfigured" test try to reach the network. The remote path is
        // covered by driving the hook with an injected transport instead.
        env: {
            VITE_METABIND_ORGANIZATION_ID: '',
            VITE_METABIND_PROJECT_ID: '',
            VITE_METABIND_PACKAGE_ID: '',
            VITE_METABIND_API_KEY: '',
            VITE_METABIND_PREVIEW_TOKEN: '',
        },
        setupFiles: ['./tests/setup.ts'],
        // The published bindjs-react dist uses extensionless relative imports, which
        // Node's ESM resolver rejects; inlining routes it through Vite.
        server: { deps: { inline: ['@metabindai/bindjs-react'] } },
    },
})
