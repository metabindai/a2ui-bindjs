import SwiftUI

struct LazyMaterializedComponentView: View {
    let handlerId: String?
    let isActive: Bool
    let placeholder: Component

    @EnvironmentObject private var context: BindJSContext
    @State private var component: Component
    @State private var loadedRenderRevision: UInt64?

    init(
        handlerId: String?,
        isActive: Bool = true,
        placeholder: Component = EmptyComponent()
    ) {
        self.handlerId = handlerId
        self.isActive = isActive
        self.placeholder = placeholder
        _component = State(initialValue: placeholder)
    }

    var body: some View {
        ComponentView(component)
            .onAppear {
                reload(for: context.renderRevision, force: true)
            }
            .onChange(of: isActive) { _, newValue in
                guard newValue else { return }
                reload(for: context.renderRevision, force: true)
            }
            .onChange(of: handlerId) { _, _ in
                reload(for: context.renderRevision, force: true)
            }
            .onChange(of: context.renderRevision) { _, newRevision in
                scheduleReload(after: newRevision)
            }
    }

    private func scheduleReload(after renderRevision: UInt64) {
        guard isActive else { return }

        // Wait for the parent render to reinstall the JS callback for this revision.
        DispatchQueue.main.async {
            guard context.renderRevision == renderRevision else { return }
            reload(for: renderRevision)
        }
    }

    private func reload(for renderRevision: UInt64, force: Bool = false) {
        guard isActive else { return }
        guard force || loadedRenderRevision != renderRevision else { return }

        component = materializeComponent()
        loadedRenderRevision = renderRevision
    }

    private func materializeComponent() -> Component {
        guard let handlerId,
              let jsValue = context.callEventHandler(id: handlerId, arguments: []),
              let directive = jsValue.toDirective(),
              let component = makeComponent(directive)
        else {
            return placeholder
        }

        return component
    }
}
