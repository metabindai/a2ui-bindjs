import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        // Only the workspace packages are excluded, so edits to their dist/ are picked up
        // without clearing Vite's cache.
        //
        // bindjs-react and bindjs-runtime are NOT excluded: unlike the bindjs monorepo
        // (where they are workspace links), here they are ordinary npm packages whose
        // dependency tree includes CommonJS modules — `fast-deep-equal` among them.
        // Excluding them skips the dep optimizer, so those CJS modules are served raw
        // and `import equal from 'fast-deep-equal'` fails to link with
        // "does not provide an export named 'default'", blanking the page.
        exclude: ['@metabindai/a2ui-bindjs', '@metabindai/a2ui-bindjs-react'],
    },
    server: {
        port: 5181,
    },
})
