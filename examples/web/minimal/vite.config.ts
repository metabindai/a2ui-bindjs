import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    // Only the workspace package is excluded from pre-bundling; bindjs-react and the
    // runtime must go through the dep optimizer, because their dependency tree contains
    // CommonJS modules that would otherwise fail to link in the browser.
    optimizeDeps: { exclude: ['@metabindai/a2ui-bindjs', '@metabindai/a2ui-bindjs-react'] },
    server: { port: 5182 },
})
