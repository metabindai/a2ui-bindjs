import SwiftUI

// MARK: – Component

public struct OnDragGestureComponent: Component {
    public static var directiveName: String = "onDragGesture"
    
    public var minimumDistance: Double
    public let handlerId: String
}

extension OnDragGestureComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        minimumDistance = directive["minimumDistance"] ?? 0.0
        handlerId = directive["handlerId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOnDragGesture(self)
    }
}

extension OnDragGestureComponent: ViewModifier {
    public func body(content: Content) -> some View {
        OnDragGestureWrapper(configuration: self, content: content)
    }
}

// MARK: – Wrapper View

struct OnDragGestureWrapper<Content: View>: View {
    let configuration: OnDragGestureComponent
    let content: Content

    @GestureState private var phase: GesturePhase = .possible
    @GestureState private var location: CGPoint = .zero
    @GestureState private var translation: CGSize = .zero
    @GestureState private var velocity: CGSize = .zero

    @EnvironmentObject private var context: BindJSContext

    private func callHandler(_ newPhase: GesturePhase) {
        _ = context.callEventHandler(
            id: configuration.handlerId,
            arguments: [
                "phase": newPhase.rawValue,
                "locationInView": ["x": round2(location.x), "y": round2(location.y)],
                "translation": ["x": round2(translation.width), "y": round2(translation.height)],
                "velocity": ["x": round2(velocity.width), "y": round2(velocity.height)]
            ]
        )
    }
    
    private func round2(_ x: CGFloat) -> CGFloat {
        round(x * 100) / 100
    }

    var body: some View {
        content
            .gesture(
                DragGesture(minimumDistance: configuration.minimumDistance, coordinateSpace: .local)
                    // 1) phase: began/changed
                    .updating($phase) { value, state, _ in
                        if state == .possible {
                            state = .began
                            callHandler(.began)
                        } else {
                            state = .changed
                            callHandler(.changed)
                        }
                    }
                    // 2) current location
                    .updating($location) { value, state, _ in
                        state = value.location
                    }
                    // 3) accumulated translation
                    .updating($translation) { value, state, _ in
                        state = value.translation
                    }
                    // 4) estimated velocity
                    .updating($velocity) { value, state, _ in
                        state = value.predictedEndTranslation
                    }
                    // 5) final end — read translation/velocity directly off
                    // `value`. SwiftUI resets @GestureState to its initial
                    // value the moment the gesture ends, so reading the
                    // bound state here would always return zero.
                    .onEnded { value in
                        _ = context.callEventHandler(
                            id: configuration.handlerId,
                            arguments: [
                                "phase": GesturePhase.ended.rawValue,
                                "locationInView": [
                                    "x": round2(value.location.x),
                                    "y": round2(value.location.y)
                                ],
                                "translation": [
                                    "x": round2(value.translation.width),
                                    "y": round2(value.translation.height)
                                ],
                                "velocity": [
                                    "x": round2(value.velocity.width),
                                    "y": round2(value.velocity.height)
                                ]
                            ]
                        )
                    }
            )
    }
}

