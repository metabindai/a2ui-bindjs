/**
 * Scaffolding, not A2UI — it just shows what the surface sent back, so `App` can stay
 * about the protocol.
 */
import type { ActionMessage } from '@metabindai/a2ui-bindjs'

interface ActionLogProps {
    actions: ActionMessage[]
}

export function ActionLog({ actions }: ActionLogProps) {
    if (actions.length === 0) {
        return null
    }

    return (
        <section className="log">
            <h2>Sent to the agent</h2>

            {actions.map((action, index) => (
                <pre key={index}>
                    {action.name}
                    {action.context ? ` · ${JSON.stringify(action.context)}` : ''}
                </pre>
            ))}
        </section>
    )
}
