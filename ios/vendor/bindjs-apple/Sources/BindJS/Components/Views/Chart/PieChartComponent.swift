import Charts
import Foundation
import SwiftUI

public struct PieChartComponent: Component {
    public static var directiveName: String = "PieChart"

    public var children: [Component]
    public var innerRadius: Double?
}

extension PieChartComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        children = directive.children.compactMap { makeComponent($0) }
        innerRadius = Self.number(from: directive.props["innerRadius"])
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitPieChart(self)
    }

    private static func number(from raw: Any?) -> Double? {
        switch raw {
        case let value as Int:
            return Double(value)
        case let value as Double:
            return value
        case let value as Float:
            return Double(value)
        case let value as NSNumber:
            if CFGetTypeID(value) == CFBooleanGetTypeID() {
                return nil
            }
            return value.doubleValue
        default:
            return nil
        }
    }
}

extension PieChartComponent: View {
    public var body: some View {
        PieChartRenderedView(model: PieChartCollector.collect(chart: self))
    }
}

struct PieChartRenderedView: View {
    let model: PieChartModel

    var body: some View {
        Chart {
            PieSliceContent(model: model)
        }
        .modifier(PieChartLegendApplier(legend: model.legend))
        .modifier(PieChartForegroundScaleApplier(scale: model.style.foregroundStyleScale, domain: model.style.foregroundStyleScaleDomain))
        .modifier(PieChartSelectionApplier(model: model))
        .modifier(ChartAccessibilityApplier(accessibility: model.accessibility))
        .preference(key: PieChartModelPreferenceKey.self, value: model)
    }
}

struct PieChartModelPreferenceKey: PreferenceKey {
    static var defaultValue: PieChartModel? = nil

    static func reduce(value: inout PieChartModel?, nextValue: () -> PieChartModel?) {
        value = nextValue() ?? value
    }
}

private struct PieSliceContent: ChartContent {
    let model: PieChartModel

    var body: some ChartContent {
        ForEach(model.slices.filter { $0.value > 0 }) { slice in
            styledSector(
                SectorMark(
                    angle: .value(slice.label ?? "Value", slice.value),
                    innerRadius: .ratio(model.normalizedInnerRadius)
                ),
                slice: slice
            )
        }
    }
}

@ChartContentBuilder
private func styledSector<Content: ChartContent>(_ content: Content, slice: PieSliceMark) -> some ChartContent {
    let rounded = slice.style.cornerRadius.map { content.cornerRadius($0) }
    if let rounded {
        foregroundStyled(rounded, slice: slice)
    } else {
        foregroundStyled(content, slice: slice)
    }
}

@ChartContentBuilder
private func foregroundStyled<Content: ChartContent>(_ content: Content, slice: PieSliceMark) -> some ChartContent {
    switch slice.style.foregroundStyle {
    case .color(let color):
        accessibilityStyled(content.foregroundStyle(Color.chartColor(named: color)), slice: slice)
    case .series(let channel):
        accessibilityStyled(content.foregroundStyle(by: .value(channel.label ?? "Series", channel.accessibilityKey)), slice: slice)
    case .none:
        accessibilityStyled(content.foregroundStyle(by: .value("Slice", slice.label ?? slice.id)), slice: slice)
    }
}

@ChartContentBuilder
private func accessibilityStyled<Content: ChartContent>(_ content: Content, slice: PieSliceMark) -> some ChartContent {
    if let label = slice.accessibility.label, let value = slice.accessibility.value {
        content
            .accessibilityLabel(label)
            .accessibilityValue(value)
    } else if let label = slice.accessibility.label {
        content.accessibilityLabel(label)
    } else if let value = slice.accessibility.value {
        content.accessibilityValue(value)
    } else {
        content
    }
}

struct PieChartLegendApplier: ViewModifier {
    let legend: ChartLegendOptions

    @ViewBuilder
    func body(content: Content) -> some View {
        if legend.hidden {
            content.chartLegend(.hidden)
        } else if legend.position != nil || legend.spacing != nil {
            content.chartLegend(
                position: legend.annotationPosition,
                spacing: legend.spacing.map { CGFloat($0) }
            )
        } else {
            content
        }
    }
}

private struct PieChartForegroundScaleApplier: ViewModifier {
    let scale: [String: String]
    let domain: [String]

    @ViewBuilder
    func body(content: Content) -> some View {
        if scale.isEmpty {
            content
        } else {
            let ordered = orderedDomain(domain, scale: scale)
            content.chartForegroundStyleScale(
                domain: ordered,
                range: ordered.map { Color.chartColor(named: scale[$0] ?? $0) }
            )
        }
    }
}

private struct PieChartSelectionApplier: ViewModifier {
    @EnvironmentObject private var context: BindJSContext
    let model: PieChartModel

    @ViewBuilder
    func body(content: Content) -> some View {
        if model.selection?.onChangeId != nil {
            content.chartAngleSelection(value: Binding<Double?>(
                get: { PieSelectionBridge.angleValue(for: model.selection?.value, in: model) },
                set: { newValue in sendSelection(newValue) }
            ))
        } else {
            content
        }
    }

    private func sendSelection(_ value: Double?) {
        PieSelectionBridge.dispatch(selection: model.selection, angleValue: value, model: model) { handlerId, selectedValue in
            _ = context.callEventHandler(id: handlerId, arguments: selectedValue)
        }
    }
}

struct PieChartSelectionRuntimeApplier: ViewModifier {
    @EnvironmentObject private var context: BindJSContext
    @State private var model: PieChartModel?
    let binding: PieSelectionBinding

    func body(content: Content) -> some View {
        content
            .onPreferenceChange(PieChartModelPreferenceKey.self) { model in
                self.model = model
            }
            .modifier(PieChartSelectionBindingApplier(binding: binding, model: model, context: context))
    }
}

private struct PieChartSelectionBindingApplier: ViewModifier {
    let binding: PieSelectionBinding
    let model: PieChartModel?
    let context: BindJSContext

    @ViewBuilder
    func body(content: Content) -> some View {
        if let model, binding.onChangeId != nil {
            content.chartAngleSelection(value: Binding<Double?>(
                get: { PieSelectionBridge.angleValue(for: binding.value, in: model) },
                set: { newValue in sendSelection(newValue, model: model) }
            ))
        } else {
            content
        }
    }

    private func sendSelection(_ value: Double?, model: PieChartModel) {
        PieSelectionBridge.dispatch(selection: binding, angleValue: value, model: model) { handlerId, selectedValue in
            _ = context.callEventHandler(id: handlerId, arguments: selectedValue)
        }
    }
}

enum PieSelectionBridge {
    static func angleValue(for selectedId: String?, in model: PieChartModel) -> Double? {
        guard let selectedId else { return nil }
        var cursor = 0.0
        for slice in model.slices where slice.value > 0 {
            let start = cursor
            cursor += slice.value
            if slice.id == selectedId {
                return start + (slice.value / 2)
            }
        }
        return nil
    }

    static func sliceId(for angleValue: Double?, in model: PieChartModel) -> String? {
        guard let angleValue else { return nil }
        var cursor = 0.0
        for slice in model.slices where slice.value > 0 {
            cursor += slice.value
            if angleValue <= cursor {
                return slice.id
            }
        }
        return model.slices.last(where: { $0.value > 0 })?.id
    }

    static func dispatch(
        selection: PieSelectionBinding?,
        angleValue: Double?,
        model: PieChartModel,
        callback: (String, Any) -> Void
    ) {
        guard let onChangeId = selection?.onChangeId else { return }
        callback(onChangeId, chartSelectionPayload(sliceId(for: angleValue, in: model)))
    }
}

private extension PieChartModel {
    var normalizedInnerRadius: CGFloat {
        CGFloat(max(0, min(innerRadius ?? 0, 1)))
    }
}

private extension ChartChannel {
    var accessibilityKey: String {
        value.accessibilityText
    }
}
