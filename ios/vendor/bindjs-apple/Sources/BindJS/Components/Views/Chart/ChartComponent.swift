import Charts
import Foundation
import SwiftUI

public struct ChartComponent: Component {
    public static var directiveName: String = "Chart"

    public var children: [Component]
}

extension ChartComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        children = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChart(self)
    }
}

extension ChartComponent: View {
    public var body: some View {
        ChartRenderedView(model: ChartCollector.collect(chart: self))
    }
}

struct ChartRenderedView: View {
    let model: ChartModel

    var body: some View {
        Chart {
            ChartMarkContent(model: model)
        }
        // Swift Charts does not clip marks to the plot area by default — an
        // unstacked AreaMark whose zero baseline sits below the y-domain
        // floor paints all the way past the chart's frame into whatever is
        // laid out beneath it. The web renderer clips to the SVG viewport;
        // match that.
        .chartPlotStyle { plot in plot.clipped() }
        .modifier(ChartAxisApplier(axis: .x, options: model.axes.x, scale: model.scales.x))
        .modifier(ChartAxisApplier(axis: .y, options: model.axes.y, scale: model.scales.y))
        .modifier(ChartAxisLabelApplier(xLabel: model.axes.x?.label, yLabel: model.axes.y?.label))
        .modifier(ChartScaleApplier(scales: model.scales))
        .modifier(ChartLegendApplier(legend: model.legend))
        .modifier(ChartForegroundScaleApplier(scale: model.style.foregroundStyleScale, domain: model.style.foregroundStyleScaleDomain))
        .modifier(ChartSymbolScaleApplier(scale: model.style.symbolScale, domain: model.style.symbolScaleDomain))
        .modifier(ChartSelectionApplier(selection: model.selection, scales: model.scales))
        .modifier(ChartAccessibilityApplier(accessibility: model.accessibility))
        .preference(key: ChartModelPreferenceKey.self, value: model)
    }
}

struct ChartModelPreferenceKey: PreferenceKey {
    static var defaultValue: ChartModel? = nil

    static func reduce(value: inout ChartModel?, nextValue: () -> ChartModel?) {
        value = nextValue() ?? value
    }
}

enum ChartAxisKind {
    case x
    case y
}

struct ChartAxisApplier: ViewModifier {
    let axis: ChartAxisKind
    let options: ChartAxisOption?
    let scale: ChartScaleOption?

    @ViewBuilder
    func body(content: Content) -> some View {
        switch axis {
        case .x:
            if options?.hidden == true {
                content.chartXAxis(.hidden)
            } else if let options, options.hasCustomAxisMarks {
                content.chartXAxis { chartAxisMarks(options, scale: scale, fallbackPosition: .bottom) }
            } else {
                content.chartXAxis(.automatic)
            }
        case .y:
            if options?.hidden == true {
                content.chartYAxis(.hidden)
            } else if let options, options.hasCustomAxisMarks {
                content.chartYAxis { chartAxisMarks(options, scale: scale, fallbackPosition: .leading) }
            } else {
                content.chartYAxis(.automatic)
            }
        }
    }
}

@AxisContentBuilder
private func chartAxisMarks(_ options: ChartAxisOption, scale: ChartScaleOption?, fallbackPosition: AxisMarkPosition) -> some AxisContent {
    let position = options.axisMarkPosition ?? fallbackPosition
    if let dateValues = options.dateAxisValues(scale: scale) {
        AxisMarks(position: position, values: dateValues) { value in
            chartAxisMarkParts(options, value: value)
        }
    } else if let numericValues = options.numericAxisValues {
        AxisMarks(position: position, values: numericValues) { value in
            chartAxisMarkParts(options, value: value)
        }
    } else if let stringValues = options.stringAxisValues {
        AxisMarks(position: position, values: stringValues) { value in
            chartAxisMarkParts(options, value: value)
        }
    } else {
        AxisMarks(position: position) { value in
            chartAxisMarkParts(options, value: value)
        }
    }
}

@AxisMarkBuilder
private func chartAxisMarkParts(_ options: ChartAxisOption, value: AxisValue) -> some AxisMark {
    if !options.gridHidden {
        AxisGridLine()
    }
    if !options.ticksHidden {
        AxisTick()
    }
    if !options.labelsHidden {
        if let formatter = options.formatter {
            AxisValueLabel {
                Text(formatter.string(for: value))
            }
        } else {
            AxisValueLabel()
        }
    }
}

private struct ChartAxisLabelApplier: ViewModifier {
    let xLabel: String?
    let yLabel: String?

    @ViewBuilder
    func body(content: Content) -> some View {
        if let xLabel, let yLabel {
            content
                .chartXAxisLabel(xLabel)
                .chartYAxisLabel(yLabel)
        } else if let xLabel {
            content.chartXAxisLabel(xLabel)
        } else if let yLabel {
            content.chartYAxisLabel(yLabel)
        } else {
            content
        }
    }
}

private struct ChartScaleApplier: ViewModifier {
    let scales: ChartScaleOptions

    func body(content: Content) -> some View {
        content
            .modifier(ChartSingleScaleApplier(axis: .x, scale: scales.x))
            .modifier(ChartSingleScaleApplier(axis: .y, scale: scales.y))
    }
}

struct ChartSingleScaleApplier: ViewModifier {
    let axis: ChartAxisKind
    let scale: ChartScaleOption?

    @ViewBuilder
    func body(content: Content) -> some View {
        switch axis {
        case .x:
            if scale?.scaleTypeName == .date, let range = scale?.domain?.dateRange {
                content.chartXScale(domain: range, type: scale?.chartsScaleType)
            } else if let range = scale?.domain?.numericRange {
                content.chartXScale(domain: range, type: scale?.chartsScaleType)
            } else if let categories = scale?.domain?.stringDomain {
                content.chartXScale(domain: categories, type: scale?.chartsScaleType)
            } else if let scaleType = scale?.chartsScaleType {
                content.chartXScale(type: scaleType)
            } else {
                content
            }
        case .y:
            if scale?.scaleTypeName == .date, let range = scale?.domain?.dateRange {
                content.chartYScale(domain: range, type: scale?.chartsScaleType)
            } else if let range = scale?.domain?.numericRange {
                content.chartYScale(domain: range, type: scale?.chartsScaleType)
            } else if let categories = scale?.domain?.stringDomain {
                content.chartYScale(domain: categories, type: scale?.chartsScaleType)
            } else if let scaleType = scale?.chartsScaleType {
                content.chartYScale(type: scaleType)
            } else {
                content
            }
        }
    }
}

struct ChartLegendApplier: ViewModifier {
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

struct ChartForegroundScaleApplier: ViewModifier {
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

struct ChartSymbolScaleApplier: ViewModifier {
    let scale: [String: ChartMarkStyle.SymbolName]
    let domain: [String]

    @ViewBuilder
    func body(content: Content) -> some View {
        if scale.isEmpty {
            content
        } else {
            let ordered = orderedDomain(domain, scale: scale)
            content.chartSymbolScale(
                domain: ordered,
                range: ordered.map { (scale[$0] ?? .circle).chartsSymbolShape }
            )
        }
    }
}

struct ChartSelectionApplier: ViewModifier {
    @EnvironmentObject private var context: BindJSContext
    let selection: ChartSelectionOptions?
    let scales: ChartScaleOptions

    @ViewBuilder
    func body(content: Content) -> some View {
        content
            .modifier(ChartXSelectionApplier(binding: selection?.x, scale: scales.x, context: context))
            .modifier(ChartYSelectionApplier(binding: selection?.y, scale: scales.y, context: context))
    }
}

struct ChartXSelectionApplier: ViewModifier {
    let binding: ChartSelectionBinding?
    let scale: ChartScaleOption?
    let context: BindJSContext

    @ViewBuilder
    func body(content: Content) -> some View {
        if let binding {
            let value = chartSelectionResolvedValue(binding.value, scale: scale)
            switch chartSelectionValueKind(for: value, scale: scale) {
            case .number:
                content.chartXSelection(value: Binding<Double?>(
                    get: { value?.numberSelectionValue },
                    set: { newValue in sendSelection(newValue) }
                ))
            case .string:
                content.chartXSelection(value: Binding<String?>(
                    get: { value?.stringSelectionValue },
                    set: { newValue in sendSelection(newValue) }
                ))
            case .date:
                content.chartXSelection(value: Binding<Date?>(
                    get: { value?.dateValue },
                    set: { newValue in sendSelection(newValue) }
                ))
            }
        } else {
            content
        }
    }

    private func sendSelection(_ value: Any?) {
        ChartSelectionBridge.dispatch(binding: binding, value: value) { handlerId, selectedValue in
            _ = context.callEventHandler(id: handlerId, arguments: selectedValue)
        }
    }
}

struct ChartYSelectionApplier: ViewModifier {
    let binding: ChartSelectionBinding?
    let scale: ChartScaleOption?
    let context: BindJSContext

    @ViewBuilder
    func body(content: Content) -> some View {
        if let binding {
            let value = chartSelectionResolvedValue(binding.value, scale: scale)
            switch chartSelectionValueKind(for: value, scale: scale) {
            case .number:
                content.chartYSelection(value: Binding<Double?>(
                    get: { value?.numberSelectionValue },
                    set: { newValue in sendSelection(newValue) }
                ))
            case .string:
                content.chartYSelection(value: Binding<String?>(
                    get: { value?.stringSelectionValue },
                    set: { newValue in sendSelection(newValue) }
                ))
            case .date:
                content.chartYSelection(value: Binding<Date?>(
                    get: { value?.dateValue },
                    set: { newValue in sendSelection(newValue) }
                ))
            }
        } else {
            content
        }
    }

    private func sendSelection(_ value: Any?) {
        ChartSelectionBridge.dispatch(binding: binding, value: value) { handlerId, selectedValue in
            _ = context.callEventHandler(id: handlerId, arguments: selectedValue)
        }
    }
}

enum ChartSelectionBridge {
    static func dispatch(
        binding: ChartSelectionBinding?,
        value: Any?,
        callback: (String, Any) -> Void
    ) {
        guard let onChangeId = binding?.onChangeId else { return }
        callback(onChangeId, chartSelectionPayload(value))
    }
}

enum ChartSelectionValueKind: Equatable {
    case number
    case string
    case date
}

func chartSelectionResolvedValue(_ value: ChartValue?, scale: ChartScaleOption?) -> ChartValue? {
    if scale?.scaleTypeName == .date, let date = value?.dateValue {
        return .date(date)
    }
    return value
}

func chartSelectionValueKind(for value: ChartValue?, scale: ChartScaleOption?) -> ChartSelectionValueKind {
    switch scale?.scaleTypeName {
    case .date:
        return .date
    case .category:
        return .string
    case .linear, .log:
        return .number
    case .none:
        break
    }

    switch value {
    case .date:
        return .date
    case .string:
        return .string
    case .number, .bool, .none:
        return .number
    }
}

func chartSelectionPayload(_ value: Any?) -> Any {
    guard let value else { return NSNull() }
    let mirror = Mirror(reflecting: value)
    guard mirror.displayStyle == .optional else { return value }
    return mirror.children.first?.value ?? NSNull()
}

struct ChartAccessibilityApplier: ViewModifier {
    let accessibility: ChartAccessibilityOptions

    @ViewBuilder
    func body(content: Content) -> some View {
        if let label = accessibility.label, let description = accessibility.description {
            content
                .accessibilityLabel(label)
                .accessibilityHint(description)
        } else if let label = accessibility.label {
            content.accessibilityLabel(label)
        } else if let description = accessibility.description {
            content.accessibilityHint(description)
        } else {
            content
        }
    }
}

func orderedDomain<Value>(_ domain: [String], scale: [String: Value]) -> [String] {
    var seen = Set<String>()
    var ordered = domain.filter { key in
        guard scale[key] != nil, !seen.contains(key) else { return false }
        seen.insert(key)
        return true
    }
    for key in scale.keys where !seen.contains(key) {
        ordered.append(key)
    }
    return ordered
}

extension ChartAxisOption {
    var hasCustomAxisMarks: Bool {
        values != nil || position != nil || labelsHidden || ticksHidden || gridHidden || formatter != nil
    }

    var axisMarkPosition: AxisMarkPosition? {
        switch position {
        case "top":
            return .top
        case "bottom":
            return .bottom
        case "leading":
            return .leading
        case "trailing":
            return .trailing
        default:
            return nil
        }
    }

    var numericAxisValues: [Double]? {
        guard let values = renderableAxisValues else { return nil }
        let numbers = values.compactMap { value -> Double? in
            guard case .number(let number) = value else { return nil }
            return number
        }
        return numbers.count == values.count && !numbers.isEmpty ? numbers : nil
    }

    var stringAxisValues: [String]? {
        guard let values = renderableAxisValues else { return nil }
        let strings = values.compactMap { value -> String? in
            guard case .string(let string) = value else { return nil }
            return string
        }
        return strings.count == values.count && !strings.isEmpty ? strings : nil
    }

    func dateAxisValues(scale: ChartScaleOption?) -> [Date]? {
        guard scale?.scaleTypeName == .date else { return nil }
        guard let values = renderableAxisValues else { return nil }
        let dates = values.compactMap(\.dateValue)
        return dates.count == values.count && !dates.isEmpty ? dates : nil
    }

    private var renderableAxisValues: [ChartValue]? {
        switch values {
        case .automatic, .none:
            return nil
        case .values(let values):
            let renderable = values.filter(\.isAxisValue)
            return renderable.isEmpty ? nil : renderable
        }
    }
}

extension ChartScaleOption {
    var chartsScaleType: ScaleType? {
        switch scaleTypeName {
        case .linear:
            return .linear
        case .log:
            return .log
        case .date:
            return .date
        case .category:
            return .category
        case .none:
            return nil
        }
    }
}

private extension ChartValue {
    var numberSelectionValue: Double? {
        guard case .number(let value) = self else { return nil }
        return value
    }

    var stringSelectionValue: String? {
        guard case .string(let value) = self else { return nil }
        return value
    }
}

extension ChartLegendOptions {
    var annotationPosition: AnnotationPosition {
        switch position {
        case "top":
            return .top
        case "bottom":
            return .bottom
        case "leading":
            return .leading
        case "trailing":
            return .trailing
        case "topLeading":
            return .topLeading
        case "topTrailing":
            return .topTrailing
        case "bottomLeading":
            return .bottomLeading
        case "bottomTrailing":
            return .bottomTrailing
        case "overlay":
            return .overlay
        default:
            return .automatic
        }
    }
}

private extension ChartValueFormatter {
    func string(for value: AxisValue) -> String {
        if let date = value.as(Date.self) {
            return string(for: date)
        }
        if let number = value.as(Double.self) {
            return string(for: number)
        }
        if let string = value.as(String.self) {
            if case .date = self, let date = ChartDateParser.date(from: string) {
                return self.string(for: date)
            }
            return string
        }
        return ""
    }

    private func string(for number: Double) -> String {
        switch self {
        case .number(let minimumFractionDigits, let maximumFractionDigits):
            return numberFormatter(
                style: .decimal,
                minimumFractionDigits: minimumFractionDigits,
                maximumFractionDigits: maximumFractionDigits
            ).string(from: NSNumber(value: number)) ?? "\(number)"
        case .percent(let minimumFractionDigits, let maximumFractionDigits):
            return numberFormatter(
                style: .percent,
                minimumFractionDigits: minimumFractionDigits,
                maximumFractionDigits: maximumFractionDigits
            ).string(from: NSNumber(value: number)) ?? "\(number)"
        case .currency(let currency, let minimumFractionDigits, let maximumFractionDigits):
            let formatter = numberFormatter(
                style: .currency,
                minimumFractionDigits: minimumFractionDigits,
                maximumFractionDigits: maximumFractionDigits
            )
            formatter.currencyCode = currency
            return formatter.string(from: NSNumber(value: number)) ?? "\(number)"
        case .date(let dateStyle, let timeStyle):
            return dateFormatter(dateStyle: dateStyle, timeStyle: timeStyle)
                .string(from: Date(timeIntervalSince1970: number))
        }
    }

    private func string(for date: Date) -> String {
        switch self {
        case .date(let dateStyle, let timeStyle):
            return dateFormatter(dateStyle: dateStyle, timeStyle: timeStyle).string(from: date)
        case .number, .percent, .currency:
            return ChartDateParser.accessibilityFormatter.string(from: date)
        }
    }

    private func numberFormatter(
        style: NumberFormatter.Style,
        minimumFractionDigits: Int?,
        maximumFractionDigits: Int?
    ) -> NumberFormatter {
        let formatter = NumberFormatter()
        formatter.numberStyle = style
        if let minimumFractionDigits {
            formatter.minimumFractionDigits = minimumFractionDigits
        }
        if let maximumFractionDigits {
            formatter.maximumFractionDigits = maximumFractionDigits
        }
        return formatter
    }

    private func dateFormatter(dateStyle: String?, timeStyle: String?) -> DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = DateFormatter.Style(chartStyle: dateStyle) ?? .medium
        formatter.timeStyle = DateFormatter.Style(chartStyle: timeStyle) ?? .none
        return formatter
    }
}

private extension DateFormatter.Style {
    init?(chartStyle: String?) {
        switch chartStyle {
        case "none":
            self = .none
        case "short":
            self = .short
        case "medium":
            self = .medium
        case "long":
            self = .long
        case "full":
            self = .full
        case .none:
            return nil
        default:
            return nil
        }
    }
}

private extension ChartMarkStyle.SymbolName {
    var chartsSymbolShape: BasicChartSymbolShape {
        switch self {
        case .circle:
            return .circle
        case .square:
            return .square
        case .diamond:
            return .diamond
        case .triangle:
            return .triangle
        case .plus:
            return .plus
        case .cross:
            return .cross
        }
    }
}
