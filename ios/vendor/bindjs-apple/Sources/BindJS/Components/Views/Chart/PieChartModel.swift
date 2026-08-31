import Foundation

public struct PieChartModel: Equatable {
    public var slices: [PieSliceMark]
    public var innerRadius: Double?
    public var legend: ChartLegendOptions
    public var style: ChartStyleOptions
    public var selection: PieSelectionBinding?
    public var accessibility: ChartAccessibilityOptions
    public var diagnostics: [ChartDiagnostic]

    public init(
        slices: [PieSliceMark] = [],
        innerRadius: Double? = nil,
        legend: ChartLegendOptions = ChartLegendOptions(),
        style: ChartStyleOptions = ChartStyleOptions(),
        selection: PieSelectionBinding? = nil,
        accessibility: ChartAccessibilityOptions = ChartAccessibilityOptions(),
        diagnostics: [ChartDiagnostic] = []
    ) {
        self.slices = slices
        self.innerRadius = innerRadius
        self.legend = legend
        self.style = style
        self.selection = selection
        self.accessibility = accessibility
        self.diagnostics = diagnostics
    }
}

public struct PieSliceMark: Identifiable, Equatable {
    public var id: String
    public var value: Double
    public var label: String?
    public var style: PieSliceStyle
    public var accessibility: ChartMarkAccessibility

    public init(
        id: String,
        value: Double,
        label: String? = nil,
        style: PieSliceStyle = PieSliceStyle(),
        accessibility: ChartMarkAccessibility = ChartMarkAccessibility()
    ) {
        self.id = id
        self.value = value
        self.label = label
        self.style = style
        self.accessibility = accessibility
    }
}

public struct PieSliceStyle: Equatable {
    public var foregroundStyle: ChartMarkStyle.ForegroundStyle?
    public var cornerRadius: Double?

    public init(
        foregroundStyle: ChartMarkStyle.ForegroundStyle? = nil,
        cornerRadius: Double? = nil
    ) {
        self.foregroundStyle = foregroundStyle
        self.cornerRadius = cornerRadius
    }
}

public struct PieSelectionBinding: Equatable {
    public var value: String?
    public var onChangeId: String?

    public init(value: String? = nil, onChangeId: String? = nil) {
        self.value = value
        self.onChangeId = onChangeId
    }
}

protocol PieSliceMarkComponentProtocol: Component {
    var sliceId: String? { get }
    var value: Double? { get }
    var label: String? { get }
    var baseStyle: PieSliceStyle { get }
}

extension PieSliceMarkComponentProtocol {
    func pieSliceMark(
        fallbackId: String,
        style: PieSliceStyle? = nil,
        accessibility: ChartMarkAccessibility = ChartMarkAccessibility()
    ) -> PieSliceMark? {
        guard let value else { return nil }
        return PieSliceMark(
            id: sliceId ?? fallbackId,
            value: value,
            label: label,
            style: style ?? baseStyle,
            accessibility: accessibility
        )
    }
}
