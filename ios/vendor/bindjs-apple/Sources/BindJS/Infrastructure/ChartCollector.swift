import Foundation

public struct ChartCollector {
    public static func collect(chart: ChartComponent) -> ChartModel {
        var collector = ChartCollector()
        collector.collectChildren(chart.children, path: "Chart.children")
        var model = collector.model
        model.diagnostics = collector.diagnostics
        return model
    }

    public static func collect(root component: Component) -> ChartModel? {
        if let call = component as? ComponentCall, let wrapped = call.children.first {
            return collect(root: wrapped)
        }

        var modifiers: [Component] = []
        let base = unwrapModified(component, modifiers: &modifiers)
        guard let chart = base as? ChartComponent else { return nil }

        var model = collect(chart: chart)
        for modifier in modifiers.reversed() {
            applyChartModifier(modifier, to: &model, path: "Chart")
        }
        validateModel(&model, path: "Chart")
        return model
    }

    static func collectRenderableRoot(_ component: Component) -> ChartModel? {
        if let call = component as? ComponentCall, let wrapped = call.children.first {
            return collectRenderableRoot(wrapped)
        }

        var modifiers: [Component] = []
        let base = unwrapModified(component, modifiers: &modifiers)
        guard let chart = base as? ChartComponent else { return nil }
        guard modifiers.allSatisfy(isRenderableChartRootModifier) else { return nil }

        var model = collect(chart: chart)
        for modifier in modifiers.reversed() {
            applyChartModifier(modifier, to: &model, path: "Chart")
        }
        validateModel(&model, path: "Chart")
        return model
    }

    static func isChartLevelModifier(_ component: Component) -> Bool {
        component is ChartXAxisComponent
            || component is ChartYAxisComponent
            || component is ChartXScaleComponent
            || component is ChartYScaleComponent
            || component is ChartForegroundStyleScaleComponent
            || component is ChartLegendComponent
            || component is ChartSymbolScaleComponent
            || component is ChartXAxisLabelComponent
            || component is ChartSelectionComponent
            || component is ChartXSelectionComponent
            || component is ChartYAxisLabelComponent
            || component is ChartYSelectionComponent
    }

    private static func isRenderableChartRootModifier(_ component: Component) -> Bool {
        isChartLevelModifier(component)
            || component is AccessibilityLabelComponent
            || component is AccessibilityHintComponent
    }

    private var model = ChartModel()
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
                diagnostics.append(ChartDiagnostic(.warning, "ForEach inside Chart has no materialized children", path: path))
            }
        case let modified as ModifiedComponent:
            collectModifiedChild(modified, path: path)
        case let mark as ChartMarkComponent:
            appendMark(mark.chartMark(id: path), path: path)
        default:
            diagnostics.append(ChartDiagnostic(.error, "Chart children must be chart marks, Group, or materialized ForEach; found \(type(of: component).directiveName)", path: path))
        }
    }

    private mutating func collectModifiedChild(_ modified: ModifiedComponent, path: String) {
        var modifiers: [Component] = []
        let base = Self.unwrapModified(modified, modifiers: &modifiers)
        guard let mark = base as? ChartMarkComponent else {
            collectChild(base, path: path)
            return
        }

        var style = mark.baseStyle
        var accessibility = ChartMarkAccessibility()
        for modifier in modifiers.reversed() {
            foldMarkModifier(modifier, into: &style, accessibility: &accessibility, markName: type(of: mark).directiveName, path: path)
        }
        appendMark(mark.chartMark(id: path, style: style, accessibility: accessibility), path: path)
    }

    private mutating func appendMark(_ mark: ChartMark, path: String) {
        if mark.kind == .rule {
            let hasX = mark.channels.x != nil
            let hasY = mark.channels.y != nil
            if hasX == hasY {
                diagnostics.append(ChartDiagnostic(.error, "RuleMark requires exactly one of x or y", path: path))
                return
            }
        }
        if mark.kind == .rectangle, mark.channels.x == nil || mark.channels.y == nil {
            diagnostics.append(ChartDiagnostic(.error, "RectangleMark requires x and y channels", path: path))
            return
        }
        model.marks.append(mark)
    }

    private mutating func foldMarkModifier(
        _ modifier: Component,
        into style: inout ChartMarkStyle,
        accessibility: inout ChartMarkAccessibility,
        markName: String,
        path: String
    ) {
        switch modifier {
        case let foreground as ForegroundStyleComponent:
            if let chartStyle = foreground.chartForegroundStyle {
                style.foregroundStyle = chartStyle
            }
        case let lineStyle as LineStyleComponent:
            style.lineStyle = lineStyle.style
        case let interpolation as InterpolationMethodComponent:
            style.interpolationMethod = interpolation.method
        case let cornerRadius as CornerRadiusComponent:
            style.cornerRadius = Double(cornerRadius.radius)
        case let symbol as SymbolComponent:
            if let symbol = symbol.symbol {
                style.symbol = symbol
            } else {
                diagnostics.append(ChartDiagnostic(.error, "Unknown chart symbol on \(markName)", path: path))
            }
        case let symbolSize as SymbolSizeComponent:
            style.symbolSize = symbolSize.size
        case let annotation as AnnotationComponent:
            if let annotation = annotation.annotation {
                style.annotation = annotation
            } else {
                diagnostics.append(ChartDiagnostic(.error, "Chart annotation requires text", path: path))
            }
        case let accessibilityLabel as AccessibilityLabelComponent:
            accessibility.label = accessibilityLabel.label
        case let accessibilityHint as AccessibilityHintComponent:
            accessibility.description = accessibilityHint.hint
        case let accessibilityValue as AccessibilityValueComponent:
            accessibility.value = accessibilityValue.value
        case _ where Self.isChartLevelModifier(modifier):
            diagnostics.append(ChartDiagnostic(.error, "Chart-level modifier \(type(of: modifier).directiveName) cannot be attached to \(markName)", path: path))
        default:
            diagnostics.append(ChartDiagnostic(.warning, "Ignoring unsupported chart mark modifier \(type(of: modifier).directiveName)", path: path))
        }
    }

    private static func unwrapModified(_ component: Component, modifiers: inout [Component]) -> Component {
        guard let modified = component as? ModifiedComponent, modified.content.count == 1 else {
            return component
        }
        modifiers.append(modified.modifier)
        return unwrapModified(modified.content[0], modifiers: &modifiers)
    }

    private static func applyChartModifier(_ modifier: Component, to model: inout ChartModel, path: String) {
        switch modifier {
        case let axis as ChartXAxisComponent:
            model.axes.x = axis.options
        case let axis as ChartYAxisComponent:
            model.axes.y = axis.options
        case let scale as ChartXScaleComponent:
            validateScale(scale.scale, axis: "x", model: &model, path: path)
            model.scales.x = scale.scale
        case let scale as ChartYScaleComponent:
            validateScale(scale.scale, axis: "y", model: &model, path: path)
            model.scales.y = scale.scale
        case let foregroundScale as ChartForegroundStyleScaleComponent:
            model.style.foregroundStyleScale = foregroundScale.scale
            model.style.foregroundStyleScaleDomain = foregroundScale.domain
            appendInvalidScaleEntryDiagnostics(foregroundScale.invalidEntries, scaleName: "foreground style", model: &model, path: path)
        case let legend as ChartLegendComponent:
            model.legend = ChartLegendOptions(hidden: legend.hidden, position: legend.position, spacing: legend.spacing)
        case let symbolScale as ChartSymbolScaleComponent:
            model.style.symbolScale = symbolScale.scale
            model.style.symbolScaleDomain = symbolScale.domain
            appendInvalidScaleEntryDiagnostics(symbolScale.invalidEntries, scaleName: "symbol", model: &model, path: path)
        case let label as ChartXAxisLabelComponent:
            var axis = model.axes.x ?? ChartAxisOption()
            axis.label = label.label
            model.axes.x = axis
        case let selection as ChartXSelectionComponent:
            var chartSelection = model.selection ?? ChartSelectionOptions()
            chartSelection.x = selection.binding
            model.selection = chartSelection
        case let label as ChartYAxisLabelComponent:
            var axis = model.axes.y ?? ChartAxisOption()
            axis.label = label.label
            model.axes.y = axis
        case let selection as ChartYSelectionComponent:
            var chartSelection = model.selection ?? ChartSelectionOptions()
            chartSelection.y = selection.binding
            model.selection = chartSelection
        case _ as ChartSelectionComponent:
            model.diagnostics.append(ChartDiagnostic(.error, "chartSelection is not supported on Chart; use chartXSelection or chartYSelection instead", path: path))
        case let accessibilityLabel as AccessibilityLabelComponent:
            model.accessibility.label = accessibilityLabel.label
        case let accessibilityHint as AccessibilityHintComponent:
            model.accessibility.description = accessibilityHint.hint
        default:
            model.diagnostics.append(ChartDiagnostic(.warning, "Ignoring unsupported chart modifier \(type(of: modifier).directiveName)", path: path))
        }
    }

    private static func validateScale(_ scale: ChartScaleOption, axis: String, model: inout ChartModel, path: String) {
        if let type = scale.type, scale.scaleTypeName == nil {
            model.diagnostics.append(
                ChartDiagnostic(.warning, "Ignoring unsupported chart \(axis)-scale type '\(type)'", path: path)
            )
        }
        if scale.domain?.contains(where: { !$0.isAxisValue }) == true {
            model.diagnostics.append(
                ChartDiagnostic(.warning, "Ignoring unsupported boolean value in chart \(axis)-scale domain", path: path)
            )
        }
        if scale.domain?.hasInvalidNumericRange == true {
            model.diagnostics.append(
                ChartDiagnostic(.error, "Invalid chart \(axis)-scale domain: lower bound must be less than or equal to upper bound", path: path)
            )
        }
        if scale.scaleTypeName == .date, scale.domain?.hasInvalidDateRange == true {
            model.diagnostics.append(
                ChartDiagnostic(.error, "Invalid chart \(axis)-scale date domain: lower bound must be less than or equal to upper bound", path: path)
            )
        }
        if scale.scaleTypeName == .date, let domain = scale.domain, !domain.isEmpty, domain.dateRange == nil {
            model.diagnostics.append(
                ChartDiagnostic(.error, "Invalid chart \(axis)-scale date domain: expected two ISO-8601 date values", path: path)
            )
        }
        if scale.scaleTypeName == .log, let range = scale.domain?.numericRange, range.lowerBound <= 0 {
            model.diagnostics.append(
                ChartDiagnostic(.error, "Invalid chart \(axis)-scale log domain: bounds must be greater than zero", path: path)
            )
        }
    }

    private static func appendInvalidScaleEntryDiagnostics(
        _ entries: [String],
        scaleName: String,
        model: inout ChartModel,
        path: String
    ) {
        guard !entries.isEmpty else { return }
        model.diagnostics.append(
            ChartDiagnostic(
                .warning,
                "Ignoring unsupported chart \(scaleName) scale entries: \(entries.joined(separator: ", "))",
                path: path
            )
        )
    }

    private static func validateModel(_ model: inout ChartModel, path: String) {
        validateAxis(model.axes.x, axis: "x", model: &model, path: path)
        validateAxis(model.axes.y, axis: "y", model: &model, path: path)
        validateDateChannels(axis: "x", scale: model.scales.x, model: &model, path: path)
        validateDateChannels(axis: "y", scale: model.scales.y, model: &model, path: path)
    }

    private static func validateAxis(_ axis: ChartAxisOption?, axis axisName: String, model: inout ChartModel, path: String) {
        guard case .values(let values) = axis?.values else { return }
        if values.contains(where: { !$0.isAxisValue }) {
            model.diagnostics.append(
                ChartDiagnostic(.warning, "Ignoring unsupported boolean value in chart \(axisName)-axis values", path: path)
            )
        }
    }

    private static func validateDateChannels(axis: String, scale: ChartScaleOption?, model: inout ChartModel, path: String) {
        guard scale?.scaleTypeName == .date else { return }
        for mark in model.marks {
            let channels: [(name: String, channel: ChartChannel?)]
            if axis == "x" {
                channels = [("x", mark.channels.x), ("x2", mark.channels.x2)]
            } else {
                channels = [("y", mark.channels.y), ("y2", mark.channels.y2)]
            }

            for (name, channel) in channels {
                guard let channel else { continue }
                guard channel.value.dateValue == nil else { continue }
                model.diagnostics.append(
                    ChartDiagnostic(.error, "Chart \(axis)-scale type 'date' requires ISO-8601 date \(name)-values", path: path)
                )
                return
            }
        }
    }
}
