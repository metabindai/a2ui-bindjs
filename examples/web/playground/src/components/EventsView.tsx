import styled from 'styled-components'

import type { ReplayStep } from '../lib/replay'
import type { SentEntry } from '../lib/useLiveStore'

interface EventsViewProps {
    steps: ReplayStep[]
    selected: number

    /** Messages pushed into the live session after the authored stream. */
    sent?: SentEntry[]
}

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
`

const Card = styled.div<{ $error: boolean; $applied: boolean }>`
    border: 1px solid ${(p) => (p.$error ? '#f3b4b4' : '#e5e5e5')};
    border-left: 4px solid ${(p) => (p.$error ? '#e0524f' : p.$applied ? '#16a34a' : '#d4d4d4')};
    border-radius: 6px;
    background: ${(p) => (p.$applied ? '#fff' : '#f7f7f7')};
    opacity: ${(p) => (p.$applied ? 1 : 0.6)};
`

const Header = styled.div`
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 8px 10px;
    font-weight: 600;
`

const Meta = styled.span`
    font-weight: 400;
    color: #666;
`

const ErrorBox = styled.div`
    margin: 0 10px 8px;
    padding: 8px;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 4px;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
    white-space: pre-wrap;
`

const Raw = styled.pre`
    margin: 0;
    padding: 0 10px 10px;
    font-size: 11px;
    color: #444;
    max-height: 200px;
    overflow: auto;
`

export function EventsView({ steps, selected, sent = [] }: EventsViewProps) {
    return (
        <List>
            {steps.map((step) => {
                const applied = step.index <= selected

                return (
                    <Card key={step.index} $error={Boolean(step.error)} $applied={applied}>
                        <Header>
                            <span>#{step.index + 1}</span>
                            <span>{step.type ?? 'invalid message'}</span>
                            {step.surfaceId && <Meta>surface: {step.surfaceId}</Meta>}
                            <Meta>{applied ? (step.error ? 'rejected' : 'applied') : 'pending'}</Meta>
                        </Header>

                        {step.error && (
                            <ErrorBox>
                                {step.error.code ?? step.error.name}
                                {step.error.path ? ` at ${step.error.path}` : ''}
                                {'\n'}
                                {step.error.message}
                            </ErrorBox>
                        )}

                        <Raw>{JSON.stringify(step.raw, null, 2)}</Raw>
                    </Card>
                )
            })}

            {sent.map((entry, index) => (
                <Card key={`sent-${index}`} $error={Boolean(entry.error)} $applied>
                    <Header>
                        <span>sent</span>
                        <span>{Object.keys(entry.message).filter((key) => key !== 'version')[0]}</span>
                        <Meta>{entry.at}</Meta>
                        <Meta>{entry.error ? 'rejected' : 'applied'}</Meta>
                    </Header>

                    {entry.error && <ErrorBox>{entry.error}</ErrorBox>}

                    <Raw>{JSON.stringify(entry.message, null, 2)}</Raw>
                </Card>
            ))}
        </List>
    )
}
