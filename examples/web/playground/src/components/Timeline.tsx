import styled from 'styled-components'

import type { ReplayStep } from '../lib/replay'

interface TimelineProps {
    steps: ReplayStep[]
    /** Index of the currently selected step, or -1 for "before any message". */
    selected: number
    onSelect: (index: number) => void
}

const Bar = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e5e5;
    background: #fafafa;
    overflow-x: auto;
`

const Chip = styled.button<{ $active: boolean; $error: boolean }>`
    flex: none;
    border: 1px solid ${(p) => (p.$error ? '#e0524f' : p.$active ? '#2563eb' : '#d4d4d4')};
    background: ${(p) => (p.$active ? (p.$error ? '#fde8e8' : '#e8f0fe') : '#fff')};
    color: ${(p) => (p.$error ? '#b91c1c' : '#222')};
    border-radius: 6px;
    padding: 4px 8px;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
`

const Label = styled.span`
    color: #666;
    margin-right: 4px;
`

export function Timeline({ steps, selected, onSelect }: TimelineProps) {
    return (
        <Bar>
            <Label>Apply through:</Label>

            <Chip $active={selected === -1} $error={false} onClick={() => onSelect(-1)}>
                start
            </Chip>

            {steps.map((step) => (
                <Chip key={step.index} $active={step.index === selected} $error={Boolean(step.error)} onClick={() => onSelect(step.index)}>
                    {step.index + 1}. {step.type ?? 'invalid'}
                </Chip>
            ))}
        </Bar>
    )
}
