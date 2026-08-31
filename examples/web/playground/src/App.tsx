import { useMemo, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import styled from 'styled-components'

import { EventsView } from './components/EventsView'
import { MessageEditor } from './components/MessageEditor'
import { RenderView } from './components/RenderView'
import { ComposePanel } from './components/ComposePanel'
import { DataModelPanel } from './components/DataModelPanel'
import { SurfacesView } from './components/SurfacesView'
import { Timeline } from './components/Timeline'
import type { AgentMessage } from '@metabindai/a2ui-bindjs'
import { replay } from './lib/replay'
import { snapshotSurface } from './lib/snapshot'
import { useLiveStore } from './lib/useLiveStore'
import { SAMPLES, SAMPLE_GROUPS } from './lib/samples'

type Tab = 'events' | 'surfaces' | 'render'
type InputMode = 'stream' | 'update' | 'data'

const Shell = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`

const TopBar = styled.header`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e5e5;
`

const Brand = styled.strong`
    margin-right: auto;
`

const Description = styled.span`
    color: #666;
    font-size: 12px;
    max-width: 340px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const ResetButton = styled.button`
    border: 1px solid #d4d4d4;
    background: #fff;
    border-radius: 4px;
    padding: 3px 10px;
    font: inherit;
    font-size: 12px;
    cursor: pointer;

    &:hover {
        border-color: #2563eb;
        color: #1d4ed8;
    }
`

const Body = styled.div`
    flex: 1;
    min-height: 0;
`

const Handle = styled(PanelResizeHandle)`
    width: 4px;
    background: #eee;

    &:hover,
    &[data-resize-handle-active] {
        background: #2563eb;
    }
`

const Left = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
`

const Fill = styled.div`
    flex: 1;
    min-height: 0;
`

const Right = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`

const Tabs = styled.div`
    display: flex;
    gap: 2px;
    padding: 6px 12px 0;
    border-bottom: 1px solid #e5e5e5;
`

const TabButton = styled.button<{ $active: boolean }>`
    border: none;
    border-bottom: 2px solid ${(p) => (p.$active ? '#2563eb' : 'transparent')};
    background: none;
    padding: 6px 10px;
    font: inherit;
    color: ${(p) => (p.$active ? '#111' : '#666')};
    cursor: pointer;
`

const Scroll = styled.div`
    flex: 1;
    min-height: 0;
    overflow: auto;
`

const SourceError = styled.div`
    margin: 12px;
    padding: 10px;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 6px;
    font-family: ui-monospace, Menlo, monospace;
`

export function App() {
    const [sampleName, setSampleName] = useState(SAMPLES[0].name)
    const [source, setSource] = useState(SAMPLES[0].source)
    const [tab, setTab] = useState<Tab>('surfaces')
    const [mode, setMode] = useState<InputMode>('stream')
    const [selected, setSelected] = useState<number | null>(null)

    const result = useMemo(() => replay(source), [source])

    // Default to "everything applied"; clamp if the stream got shorter after an edit.
    const lastIndex = result.steps.length - 1
    const effectiveSelected = selected === null ? lastIndex : Math.min(selected, lastIndex)
    const currentStep = effectiveSelected >= 0 ? result.steps[effectiveSelected] : undefined

    // The raw envelopes up to the selected step seed the live session.
    const appliedMessages = useMemo(
        () => result.steps.slice(0, effectiveSelected + 1).map((step) => step.raw as AgentMessage),
        [result.steps, effectiveSelected]
    )

    const currentSample = SAMPLES.find((sample) => sample.name === sampleName)

    const live = useLiveStore(appliedMessages)
    const liveSurfaceId =
        currentStep?.surfaceId && live.store.getSurface(currentStep.surfaceId) ? currentStep.surfaceId : live.store.surfaceIds[0]

    // Every tab reads the live session, so a sent update shows up in Surfaces and
    // Events too — not just in the render.
    const liveSurface = liveSurfaceId ? live.store.getSurface(liveSurfaceId) : undefined

    const surfaces = useMemo(
        () => live.store.surfaceIds.map((id) => snapshotSurface(live.store.requireSurface(id))),
        [live.store, live.tick]
    )

    function loadSample(name: string) {
        const sample = SAMPLES.find((candidate) => candidate.name === name)

        if (!sample) {
            return
        }

        setSampleName(name)
        setSource(sample.source)
        setSelected(null)
    }

    return (
        <Shell>
            <TopBar>
                <Brand>A2UI on BindJS</Brand>

                <ResetButton onClick={live.reset} title="Rebuild the surface from the stream, discarding sent updates and typed input">
                    Reset session{live.sent.length > 0 ? ` (${live.sent.length})` : ''}
                </ResetButton>

                <label>
                    Sample:{' '}
                    <select value={sampleName} onChange={(event) => loadSample(event.target.value)}>
                        {SAMPLE_GROUPS.map(({ group, samples }) => (
                            <optgroup key={group} label={`${group} (${samples.length})`}>
                                {samples.map((sample) => (
                                    <option key={sample.name}>{sample.name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </label>

                {currentSample?.description && <Description title={currentSample.description}>{currentSample.description}</Description>}
            </TopBar>

            <Body>
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={45} minSize={25}>
                        <Left>
                            <Tabs>
                                <TabButton $active={mode === 'stream'} onClick={() => setMode('stream')}>
                                    Stream
                                </TabButton>
                                <TabButton $active={mode === 'update'} onClick={() => setMode('update')}>
                                    Send update
                                </TabButton>
                                <TabButton $active={mode === 'data'} onClick={() => setMode('data')}>
                                    Data model
                                </TabButton>
                            </Tabs>

                            <Fill>
                                {mode === 'stream' && <MessageEditor value={source} onChange={setSource} />}

                                {mode === 'update' && (
                                    <ComposePanel
                                        surfaceId={liveSurfaceId}
                                        sent={live.sent}
                                        onSend={live.send}
                                        onReset={live.reset}
                                    />
                                )}

                                {mode === 'data' && (
                                    <DataModelPanel
                                        surfaceId={liveSurfaceId}
                                        dataModel={liveSurface?.dataModel}
                                        onApply={(value) =>
                                            live.send({
                                                version: 'v1.0',
                                                updateDataModel: { surfaceId: liveSurfaceId as string, value },
                                            })
                                        }
                                    />
                                )}
                            </Fill>
                        </Left>
                    </Panel>

                    <Handle />

                    <Panel minSize={25}>
                        <Right>
                            <Timeline steps={result.steps} selected={effectiveSelected} onSelect={setSelected} />

                            <Tabs>
                                <TabButton $active={tab === 'surfaces'} onClick={() => setTab('surfaces')}>
                                    Surfaces
                                </TabButton>
                                <TabButton $active={tab === 'events'} onClick={() => setTab('events')}>
                                    Events
                                </TabButton>
                                <TabButton $active={tab === 'render'} onClick={() => setTab('render')}>
                                    Render
                                </TabButton>
                            </Tabs>

                            <Scroll>
                                {result.sourceError && <SourceError>Stream is not valid JSON: {result.sourceError}</SourceError>}

                                {tab === 'surfaces' && <SurfacesView surfaces={surfaces} />}
                                {tab === 'events' && (
                                    <EventsView steps={result.steps} selected={effectiveSelected} sent={live.sent} />
                                )}
                                {tab === 'render' && (
                                    <RenderView key={live.epoch} store={live.store} tick={live.tick} />
                                )}
                            </Scroll>
                        </Right>
                    </Panel>
                </PanelGroup>
            </Body>
        </Shell>
    )
}
