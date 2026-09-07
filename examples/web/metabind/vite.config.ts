import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Same-origin path the browser calls; Vite forwards it to the real API. */
export const API_PROXY_PATH = '/metabind-api'

export default defineConfig({
    plugins: [react()],
    optimizeDeps: { exclude: ['@metabindai/a2ui-bindjs', '@metabindai/a2ui-bindjs-react'] },
    server: {
        port: 5184,
        // The Metabind API does not send CORS headers for browser origins, so a direct
        // fetch from the page is blocked. Dev proxies through Vite, which makes it a
        // same-origin request. A real app would proxy on its own server anyway — that is
        // also where the API key belongs, rather than in a client bundle.
        proxy: {
            [API_PROXY_PATH]: {
                target: 'https://api.metabind.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(new RegExp(`^${API_PROXY_PATH}`), '/graphql'),
            },
        },
    },
})
