// One A2UI surface, decoded into SwiftUI.

import SwiftUI
import BindJS

public struct A2UISurfaceView: View {

    /// Both objects are observed, because there are two independent reasons to redraw: the
    /// A2UI data model changing, which the host publishes, and BindJS's own hook state
    /// changing inside a stateful component such as `Modal`, which the context publishes.
    @ObservedObject private var host: A2UIHost
    @ObservedObject private var context: BindJSContext

    private let surfaceId: String?

    /// - Parameters:
    ///   - host: the host holding the surfaces.
    ///   - surfaceId: which surface to draw. Defaults to the first one, which is all an
    ///     agent driving a single screen ever creates.
    public init(host: A2UIHost, surfaceId: String? = nil) {
        self.host = host
        self.context = host.context
        self.surfaceId = surfaceId
    }

    public var body: some View {
        if let id = surfaceId ?? host.surfaceIds.first, let ast = host.ast(for: id) {
            context.viewForAST(ast, id: id)
        }
    }
}
