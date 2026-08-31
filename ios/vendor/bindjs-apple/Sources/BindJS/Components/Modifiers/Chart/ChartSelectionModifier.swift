import SwiftUI

public struct ChartSelectionComponent: Component {
    public static var directiveName: String = "chartSelection"

    public var binding: PieSelectionBinding
}

extension ChartSelectionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        binding = PieSelectionBinding(from: directive)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartSelection(self)
    }
}

extension ChartSelectionComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.modifier(PieChartSelectionRuntimeApplier(binding: binding))
    }
}

public struct ChartXSelectionComponent: Component {
    public static var directiveName: String = "chartXSelection"

    public var binding: ChartSelectionBinding
}

extension ChartXSelectionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        binding = ChartSelectionBinding(from: directive)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartXSelection(self)
    }
}

extension ChartXSelectionComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.modifier(ChartXSelectionRuntimeApplier(binding: binding))
    }
}

public struct ChartYSelectionComponent: Component {
    public static var directiveName: String = "chartYSelection"

    public var binding: ChartSelectionBinding
}

extension ChartYSelectionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        binding = ChartSelectionBinding(from: directive)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartYSelection(self)
    }
}

extension ChartYSelectionComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.modifier(ChartYSelectionRuntimeApplier(binding: binding))
    }
}

private struct ChartXSelectionRuntimeApplier: ViewModifier {
    @EnvironmentObject private var context: BindJSContext
    @State private var model: ChartModel?
    let binding: ChartSelectionBinding

    func body(content: Content) -> some View {
        content
            .onPreferenceChange(ChartModelPreferenceKey.self) { model in
                self.model = model
            }
            .modifier(ChartXSelectionApplier(binding: binding, scale: model?.scales.x, context: context))
    }
}

private struct ChartYSelectionRuntimeApplier: ViewModifier {
    @EnvironmentObject private var context: BindJSContext
    @State private var model: ChartModel?
    let binding: ChartSelectionBinding

    func body(content: Content) -> some View {
        content
            .onPreferenceChange(ChartModelPreferenceKey.self) { model in
                self.model = model
            }
            .modifier(ChartYSelectionApplier(binding: binding, scale: model?.scales.y, context: context))
    }
}

extension ChartSelectionBinding {
    init(from directive: Directive) {
        self.init(
            value: ChartValue(directive.props["value"]),
            onChangeId: directive["onChangeId"]
        )
    }
}

extension PieSelectionBinding {
    init(from directive: Directive) {
        self.init(
            value: directive.props["value"] as? String,
            onChangeId: directive["onChangeId"]
        )
    }
}
