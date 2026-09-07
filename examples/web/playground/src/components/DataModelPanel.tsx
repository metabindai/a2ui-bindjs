import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import type { JsonValue } from '@metabindai/a2ui-bindjs'

import { MessageEditor } from './MessageEditor'

interface DataModelPanelProps {
    surfaceId?: string

    /** The live surface's data model. Changes here flow in unless the editor is dirty. */
    dataModel?: JsonValue

    /** Applies an edited model. Implemented as an `updateDataModel` at the root. */
    onApply(value: JsonValue): string | undefined
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

const Dirty = styled.span`
    color: #b45309;
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

const Apply = styled(Small)`
    border-color: #2563eb;
    background: #e8f0fe;
    color: #1d4ed8;
    font-weight: 600;
`

const EditorArea = styled.div`
    flex: 1;
    min-height: 0;
`

const ErrorBox = styled.div`
    margin: 8px 12px 0;
    padding: 8px;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 4px;
    font-size: 12px;
`

const Empty = styled.div`
    padding: 24px;
    color: #777;
    text-align: center;
`

function format(value: JsonValue | undefined): string {
    return JSON.stringify(value ?? {}, null, 4)
}

export function DataModelPanel({ surfaceId, dataModel, onApply }: DataModelPanelProps) {
    const incoming = format(dataModel)
    const [text, setText] = useState(incoming)
    const [dirty, setDirty] = useState(false)
    const [error, setError] = useState<string>()
    const lastIncoming = useRef(incoming)

    // Track the live model — but never overwrite unsaved edits, or typing here would
    // fight every write coming from a rendered input.
    useEffect(() => {
        if (incoming === lastIncoming.current) {
            return
        }

        lastIncoming.current = incoming

        if (!dirty) {
            setText(incoming)
        }
    }, [incoming, dirty])

    function change(next: string) {
        setText(next)
        setDirty(next !== lastIncoming.current)
    }

    function revert() {
        setText(lastIncoming.current)
        setDirty(false)
        setError(undefined)
    }

    function apply() {
        let parsed: JsonValue

        try {
            parsed = JSON.parse(text)
        } catch (thrown) {
            setError(`Not valid JSON: ${(thrown as Error).message}`)
            return
        }

        const failure = onApply(parsed)

        setError(failure)

        if (!failure) {
            setDirty(false)
        }
    }

    if (!surfaceId) {
        return <Empty>No surface yet — apply a createSurface message.</Empty>
    }

    return (
        <Panel>
            <Toolbar>
                {dirty ? (
                    <Dirty>Unsaved edits — live updates paused</Dirty>
                ) : (
                    <Hint>Live model for “{surfaceId}”. Edits apply as an updateDataModel.</Hint>
                )}

                {dirty && <Small onClick={revert}>Revert</Small>}
                <Apply onClick={apply}>Apply</Apply>
            </Toolbar>

            {error && <ErrorBox>{error}</ErrorBox>}

            <EditorArea>
                <MessageEditor value={text} onChange={change} path="file:///datamodel.json" />
            </EditorArea>
        </Panel>
    )
}
