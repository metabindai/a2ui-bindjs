import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    optimizeDeps: { exclude: ['@metabindai/a2ui-bindjs', '@metabindai/a2ui-bindjs-react'] },
    // No proxy: the MCP server sets CORS headers itself, because the SSE handshake hands
    // the client a path to POST back to and a proxy would have to rewrite that too.
    server: { port: 5185 },
})
