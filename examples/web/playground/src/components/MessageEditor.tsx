import Editor from '@monaco-editor/react'

interface MessageEditorProps {
    value: string
    onChange: (value: string) => void

    /** Monaco model path. Distinct paths keep each editor's model and undo stack separate. */
    path?: string
}

export function MessageEditor({ value, onChange, path = 'file:///messages.json' }: MessageEditorProps) {
    return (
        <Editor
            height="100%"
            language="json"
            path={path}
            value={value}
            onChange={(next) => onChange(next ?? '')}
            options={{
                minimap: { enabled: false },
                fontSize: 13,
                tabSize: 4,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
            }}
        />
    )
}
