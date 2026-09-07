import { useState } from 'react'
import styled from 'styled-components'

import type { SurfaceSnapshot } from '../lib/replay'

interface SurfacesViewProps {
    surfaces: SurfaceSnapshot[]
}

const Wrap = styled.div`
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`

const Empty = styled.div`
    color: #777;
    padding: 24px;
    text-align: center;
`

const Card = styled.div`
    border: 1px solid #e5e5e5;
    border-radius: 6px;
`

const Title = styled.div`
    padding: 8px 10px;
    font-weight: 600;
    border-bottom: 1px solid #eee;
    display: flex;
    gap: 12px;
    align-items: baseline;
`

const Meta = styled.span`
    font-weight: 400;
    color: #666;
    font-size: 12px;
`

const Section = styled.div`
    padding: 8px 10px;

    & + & {
        border-top: 1px solid #eee;
    }
`

const SectionTitle = styled.div`
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #888;
    margin-bottom: 6px;
`

const Json = styled.pre`
    margin: 0;
    font-size: 12px;
    white-space: pre-wrap;
`

const Toggle = styled.button<{ $active: boolean }>`
    border: 1px solid ${(p) => (p.$active ? '#2563eb' : '#d4d4d4')};
    background: ${(p) => (p.$active ? '#e8f0fe' : '#fff')};
    border-radius: 4px;
    padding: 2px 8px;
    margin-left: 6px;
    font: inherit;
    font-size: 11px;
    cursor: pointer;
`

const Row = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 6px;
`

const Errors = styled.div`
    margin-top: 6px;
    padding: 6px 8px;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 4px;
    font-size: 12px;
`

export function SurfacesView({ surfaces }: SurfacesViewProps) {
    if (surfaces.length === 0) {
        return <Empty>No surfaces. Apply a createSurface message.</Empty>
    }

    return (
        <Wrap>
            {surfaces.map((surface) => (
                <Card key={surface.id}>
                    <Title>
                        <span>{surface.id}</span>
                        <Meta>v{surface.version}</Meta>
                        {surface.sendDataModel && <Meta>sendDataModel</Meta>}
                        {surface.catalogId && <Meta title={surface.catalogId}>catalog: {shortCatalog(surface.catalogId)}</Meta>}
                    </Title>

                    <Section>
                        <SectionTitle>Data model</SectionTitle>
                        <Json>{JSON.stringify(surface.dataModel, null, 2)}</Json>
                    </Section>

                    <ComponentsSection surface={surface} />
                </Card>
            ))}
        </Wrap>
    )
}

interface ComponentsSectionProps {
    surface: SurfaceSnapshot
}

/**
 * Components are shown either as the agent sent them, or with every `{ path }` binding
 * read and `{ call }` function invoked — the difference the functions library makes.
 */
function ComponentsSection({ surface }: ComponentsSectionProps) {
    const [showResolved, setShowResolved] = useState(true)
    const count = Object.keys(surface.components).length
    const body = showResolved ? surface.resolved : surface.components

    return (
        <Section>
            <Row>
                <SectionTitle style={{ margin: 0 }}>Components ({count})</SectionTitle>

                <Toggle $active={!showResolved} onClick={() => setShowResolved(false)}>
                    raw
                </Toggle>
                <Toggle $active={showResolved} onClick={() => setShowResolved(true)}>
                    resolved
                </Toggle>
            </Row>

            <Json>{JSON.stringify(body, null, 2)}</Json>

            {showResolved && surface.resolveErrors.length > 0 && (
                <Errors>
                    {surface.resolveErrors.map((message) => (
                        <div key={message}>{message}</div>
                    ))}
                </Errors>
            )}
        </Section>
    )
}

function shortCatalog(catalogId: string): string {
    const parts = catalogId.split('/')

    return parts.slice(-2).join('/')
}
