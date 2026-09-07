import { useMemo, useState } from 'react'
import styled from 'styled-components'
import type { AgentMessage } from '@metabindai/a2ui-bindjs'

import { MessageEditor } from './MessageEditor'
import type { SentEntry } from '../lib/useLiveStore'

interface ComposePanelProps {
    surfaceId?: string
    sent: SentEntry[]
    onSend(message: AgentMessage): string | undefined
    onReset(): void
}

const Panel = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
`

const Toolbar = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
`

const Hint = styled.span`
    color: #777;
    font-size: 11px;
    margin-right: auto;
`

const Small = styled.button`
    border: 1px solid #d4d4d4;
    background: #fff;
    border-radius: 4px;
    padding: 3px 8px;
    font: inherit;
    font-size: 11px;
    cursor: pointer;
`

const Send = styled(Small)`
    border-color: #2563eb;
    background: #e8f0fe;
    color: #1d4ed8;
    font-weight: 600;
`

const EditorArea = styled.div`
    flex: 1;
    min-height: 0;
`

const Footer = styled.div`
    border-top: 1px solid #eee;
    max-height: 140px;
    overflow: auto;
    padding: 8px 12px;
    background: #fafafa;
`

const FooterHead = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
`

const FooterTitle = styled.strong`
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #888;
    margin-right: auto;
`

const LogRow = styled.div<{ $error: boolean }>`
    font-size: 12px;
    font-family: ui-monospace, Menlo, monospace;
    color: ${(p) => (p.$error ? '#b91c1c' : '#166534')};
    margin-bottom: 3px;
`

const ErrorBox = styled.div`
    margin: 8px 12px 0;
    padding: 8px;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 4px;
    font-size: 12px;
`

function presetFor(kind: 'data' | 'components' | 'delete', surfaceId: string): string {
    if (kind === 'data') {
        return JSON.stringify({ version: 'v1.0', updateDataModel: { surfaceId, path: '/name', value: 'Updated!' } }, null, 4)
    }

    if (kind === 'components') {
        return JSON.stringify(
            {
                version: 'v1.0',
                updateComponents: {
                    surfaceId,
                    components: [{ id: 'root', component: 'Text', variant: 'h2', text: 'Replaced root' }],
                },
            },
            null,
            4
        )
    }

    return JSON.stringify({ version: 'v1.0', deleteSurface: { surfaceId } }, null, 4)
}

export function ComposePanel({ surfaceId, sent, onSend, onReset }: ComposePanelProps) {
    const target = surfaceId ?? 'main'
    const initial = useMemo(() => presetFor('data', target), [target])
    const [text, setText] = useState(initial)
    const [error, setError] = useState<string>()

    function submit() {
        let parsed: unknown

        try {
            parsed = JSON.parse(text)
        } catch (thrown) {
            setError(`Not valid JSON: ${(thrown as Error).message}`)
            return
        }

        // Accept a single message or a small batch. Each is applied individually so the
        // sent log records them separately; the store coalesces the notifications.
        const messages = Array.isArray(parsed) ? parsed : [parsed]
        let failure: string | undefined

        for (const message of messages) {
            failure = onSend(message as AgentMessage) ?? failure
        }

        setError(failure)
    }

    return (
        <Panel>
            <Toolbar>
                <Hint>Applied to the live surface — no replay, so typed input survives.</Hint>

                <Small onClick={() => setText(presetFor('data', target))}>data</Small>
                <Small onClick={() => setText(presetFor('components', target))}>components</Small>
                <Small onClick={() => setText(presetFor('delete', target))}>delete</Small>
                <Send onClick={submit}>Send</Send>
            </Toolbar>

            {error && <ErrorBox>{error}</ErrorBox>}

            <EditorArea>
                <MessageEditor value={text} onChange={setText} path="file:///update.json" />
            </EditorArea>

            <Footer>
                <FooterHead>
                    <FooterTitle>Sent ({sent.length})</FooterTitle>
                    {sent.length > 0 && <Small onClick={onReset}>Reset session</Small>}
                </FooterHead>

                {sent.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>Nothing sent yet.</span>}

                {sent.map((entry, index) => (
                    <LogRow key={index} $error={Boolean(entry.error)}>
                        {entry.at} · {Object.keys(entry.message).filter((key) => key !== 'version')[0]}
                        {entry.error ? ` — ${entry.error}` : ''}
                    </LogRow>
                ))}
            </Footer>
        </Panel>
    )
}
