import Foundation

public struct PieChartCollector {
    public static func collect(chart: PieChartComponent) -> PieChartModel {
        var collector = PieChartCollector()
        collector.model.innerRadius = chart.innerRadius
        if let innerRadius = chart.innerRadius, !(0...1).contains(innerRadius) {
            collector.diagnostics.append(
                ChartDiagnostic(.warning, "PieChart innerRadius must be between 0 and 1; rendering will clamp the value", path: "PieChart")
            )
        }
        collector.collectChildren(chart.children, path: "PieChart.children")
        var model = collector.model
        model.diagnostics = collector.diagnostics
        return model
    }

    public static func collect(root component: Component) -> PieChartModel? {
        if let call = component as? ComponentCall, let wrapped = call.children.first {
            return collect(root: wrapped)
        }

        var modifiers: [Component] = []
        let base = unwrapModified(component, modifiers: &modifiers)
        guard let chart = base as? PieChartComponent else { return nil }

        var model = collect(chart: chart)
        for modifier in modifiers.reversed() {
            applyPieChartModifier(modifier, to: &model, path: "PieChart")
        }
        return model
    }

    static func collectRenderableRoot(_ component: Component) -> PieChartModel? {
        if let call = component as? ComponentCall, let wrapped = call.children.first {
            return collectRenderableRoot(wrapped)
        }

        var modifiers: [Component] = []
        let base = unwrapModified(component, modifiers: &modifiers)
        guard let chart = base as? PieChartComponent else { return nil }
        guard modifiers.allSatisfy(isRenderablePieChartRootModifier) else { return nil }

        var model = collect(chart: chart)
        for modifier in modifiers.reversed() {
            applyPieChartModifier(modifier, to: &model, path: "PieChart")
        }
        return model
    }

    static func isPieChartLevelModifier(_ component: Component) -> Bool {
        component is ChartForegroundStyleScaleComponent
            || component is ChartLegendComponent
            || component is ChartSelectionComponent
            || component is AccessibilityLabelComponent
            || component is AccessibilityHintComponent
    }

    private static func isRenderablePieChartRootModifier(_ component: Component) -> Bool {
        isPieChartLevelModifier(component)
            || component is ChartXSelectionComponent
            || component is ChartYSelectionComponent
            || ChartCollector.isChartLevelModifier(component)
    }

    private var model = PieChartModel()
    private var diagnostics: [ChartDiagnostic] = []

    private init() {}

    private mutating func collectChildren(_ children: [Component], path: String) {
        for (index, child) in children.enumerated() {
            collectChild(child, path: "\(path)[\(index)]")
        }
    }

    private mutating func collectChild(_ component: Component, path: String) {
        switch component {
        case let group as GroupComponent:
            collectChildren(group.content, path: "\(path).Group")
        case let forEach as ForEachComponent:
            collectChildren(forEach.resolvedChildren ?? [], path: "\(path).ForEach")
            if forEach.resolvedChildren == nil {
                diagnostics.append(ChartDiagnostic(.warning, "ForEach inside PieChart has no materialized children", path: path))
            }
        case let modified as ModifiedComponent:
            collectModifiedChild(modified, path: path)
        case let slice as PieSliceMarkComponentProtocol:
            appendSlice(slice.pieSliceMark(fallbackId: path), componentName: type(of: slice).directiveName, path: path)
        case _ where component is ChartMarkComponent:
            diagnostics.append(ChartDiagnostic(.error, "PieChart children must be PieSliceMark, Group, or materialized ForEach; found Cartesian mark \(type(of: component).directiveName)", path: path))
        default:
            diagnostics.append(ChartDiagnostic(.error, "PieChart children must be PieSliceMark, Group, or materialized ForEach; found \(type(of: component).directiveName)", path: path))
        }
    }

    private mutating func collectModifiedChild(_ modified: ModifiedComponent, path: String) {
        var modifiers: [Component] = []
        let base = Self.unwrapModified(modified, modifiers: &modifiers)
        guard let slice = base as? PieSliceMarkComponentProtocol else {
            collectChild(base, path: path)
            return
        }

        var style = slice.baseStyle
        var accessibility = ChartMarkAccessibility()
        for modifier in modifiers.reversed() {
            foldSliceModifier(modifier, into: &style, accessibility: &accessibility, sliceName: type(of: slice).directiveName, path: path)
        }
        appendSlice(slice.pieSliceMark(fallbackId: path, style: style, accessibility: accessibility), componentName: type(of: slice).directiveName, path: path)
    }

    private mutating func appendSlice(_ slice: PieSliceMark?, componentName: String, path: String) {
        guard let slice else {
            diagnostics.append(ChartDiagnostic(.error, "\(componentName) requires a literal numeric value", path: path))
            return
        }
        if slice.value <= 0 {
            diagnostics.append(ChartDiagnostic(.warning, "\(componentName) value must be greater than zero; slice will not render", path: path))
        }
        model.slices.append(slice)
    }

    private mutating func foldSliceModifier(
        _ modifier: Component,
        into style: inout PieSliceStyle,
        accessibility: inout ChartMarkAccessibility,
        sliceName: String,
        path: String
    ) {
        switch modifier {
        case let foreground as ForegroundStyleComponent:
            if let chartStyle = foreground.chartForegroundStyle {
                style.foregroundStyle = chartStyle
            }
        case let cornerRadius as CornerRadiusComponent:
            style.cornerRadius = Double(cornerRadius.radius)
        case let accessibilityLabel as AccessibilityLabelComponent:
            accessibility.label = accessibilityLabel.label
        case let accessibilityHint as AccessibilityHintComponent:
            accessibility.description = accessibilityHint.hint
        case let accessibilityValue as AccessibilityValueComponent:
            accessibility.value = accessibilityValue.value
        case _ where Self.isCartesianOnlyMarkModifier(modifier):
            diagnostics.append(ChartDiagnostic(.error, "Cartesian-only mark modifier \(type(of: modifier).directiveName) cannot be attached to \(sliceName)", path: path))
        case _ where Self.isPieChartLevelModifier(modifier) || ChartCollector.isChartLevelModifier(modifier):
            diagnostics.append(ChartDiagnostic(.error, "Chart-level modifier \(type(of: modifier).directiveName) cannot be attached to \(sliceName)", path: path))
        default:
            diagnostics.append(ChartDiagnostic(.warning, "Ignoring unsupported pie slice modifier \(type(of: modifier).directiveName)", path: path))
        }
    }

    private static func isCartesianOnlyMarkModifier(_ modifier: Component) -> Bool {
        modifier is LineStyleComponent
            || modifier is InterpolationMethodComponent
            || modifier is SymbolComponent
            || modifier is SymbolSizeComponent
            || modifier is AnnotationComponent
    }

    private static func unwrapModified(_ component: Component, modifiers: inout [Component]) -> Component {
        guard let modified = component as? ModifiedComponent, modified.content.count == 1 else {
            return component
        }
        modifiers.append(modified.modifier)
        return unwrapModified(modified.content[0], modifiers: &modifiers)
    }

    private static func applyPieChartModifier(_ modifier: Component, to model: inout PieChartModel, path: String) {
        switch modifier {
        case let foregroundScale as ChartForegroundStyleScaleComponent:
            model.style.foregroundStyleScale = foregroundScale.scale
            model.style.foregroundStyleScaleDomain = foregroundScale.domain
            appendInvalidScaleEntryDiagnostics(foregroundScale.invalidEntries, model: &model, path: path)
        case let legend as ChartLegendComponent:
            model.legend = ChartLegendOptions(hidden: legend.hidden, position: legend.position, spacing: legend.spacing)
        case let selection as ChartSelectionComponent:
            model.selection = selection.binding
        case let accessibilityLabel as AccessibilityLabelComponent:
            model.accessibility.label = accessibilityLabel.label
        case let accessibilityHint as AccessibilityHintComponent:
            model.accessibility.description = accessibilityHint.hint
        case _ where modifier is ChartXSelectionComponent || modifier is ChartYSelectionComponent:
            model.diagnostics.append(ChartDiagnostic(.error, "\(type(of: modifier).directiveName) is not supported on PieChart; use chartSelection instead", path: path))
        case _ where ChartCollector.isChartLevelModifier(modifier):
            model.diagnostics.append(ChartDiagnostic(.error, "Cartesian chart modifier \(type(of: modifier).directiveName) is not supported on PieChart", path: path))
        default:
            model.diagnostics.append(ChartDiagnostic(.warning, "Ignoring unsupported pie chart modifier \(type(of: modifier).directiveName)", path: path))
        }
    }

    private static func appendInvalidScaleEntryDiagnostics(
        _ entries: [String],
        model: inout PieChartModel,
        path: String
    ) {
        guard !entries.isEmpty else { return }
        model.diagnostics.append(
            ChartDiagnostic(
                .warning,
                "Ignoring unsupported pie foreground style scale entries: \(entries.joined(separator: ", "))",
                path: path
            )
        )
    }
}
