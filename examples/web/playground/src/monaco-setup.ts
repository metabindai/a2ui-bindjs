// Load Monaco from the local package (not a CDN) and wire up the JSON worker
// so the message editor gets validation + formatting.
import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
        if (label === 'json') {
            return new jsonWorker()
        }

        return new editorWorker()
    },
}

loader.config({ monaco })
