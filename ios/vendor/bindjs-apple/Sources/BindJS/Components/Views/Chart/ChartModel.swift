import Foundation
import SwiftUI

public struct ChartModel: Equatable {
    public var marks: [ChartMark]
    public var axes: ChartAxisOptions
    public var scales: ChartScaleOptions
    public var legend: ChartLegendOptions
    public var style: ChartStyleOptions
    public var selection: ChartSelectionOptions?
    public var accessibility: ChartAccessibilityOptions
    public var diagnostics: [ChartDiagnostic]

    public init(
        marks: [ChartMark] = [],
        axes: ChartAxisOptions = ChartAxisOptions(),
        scales: ChartScaleOptions = ChartScaleOptions(),
        legend: ChartLegendOptions = ChartLegendOptions(),
        style: ChartStyleOptions = ChartStyleOptions(),
        selection: ChartSelectionOptions? = nil,
        accessibility: ChartAccessibilityOptions = ChartAccessibilityOptions(),
        diagnostics: [ChartDiagnostic] = []
    ) {
        self.marks = marks
        self.axes = axes
        self.scales = scales
        self.legend = legend
        self.style = style
        self.selection = selection
        self.accessibility = accessibility
        self.diagnostics = diagnostics
    }
}

public struct ChartMark: Identifiable, Equatable {
    public enum Kind: String, Equatable {
        case bar
        case line
        case area
        case point
        case rule
        case rectangle
    }

    public var id: String
    public var kind: Kind
    public var channels: ChartMarkChannels
    public var style: ChartMarkStyle
    public var accessibility: ChartMarkAccessibility

    public init(
        id: String,
        kind: Kind,
        channels: ChartMarkChannels,
        style: ChartMarkStyle = ChartMarkStyle(),
        accessibility: ChartMarkAccessibility = ChartMarkAccessibility()
    ) {
        self.id = id
        self.kind = kind
        self.channels = channels
        self.style = style
        self.accessibility = accessibility
    }
}

public struct ChartMarkStyle: Equatable {
    public enum ForegroundStyle: Equatable {
        case color(String)
        case series(ChartChannel)
    }

    public enum Stacking: String, Equatable {
        case standard
        case unstacked
    }

    public enum Interpolation: String, Equatable {
        case linear
        case monotone
        case cardinal
        case catmullRom
        case stepStart
        case stepCenter
        case stepEnd
    }

    public enum SymbolName: String, Equatable {
        case circle
        case square
        case diamond
        case triangle
        case plus
        case cross
    }

    public var foregroundStyle: ForegroundStyle?
    public var lineStyle: ChartLineStyle?
    public var interpolationMethod: Interpolation?
    public var cornerRadius: Double?
    public var stacking: Stacking
    public var symbol: SymbolName?
    public var symbolSize: Double?
    public var annotation: ChartAnnotation?

    public init(
        foregroundStyle: ForegroundStyle? = nil,
        lineStyle: ChartLineStyle? = nil,
        interpolationMethod: Interpolation? = nil,
        cornerRadius: Double? = nil,
        stacking: Stacking = .standard,
        symbol: SymbolName? = nil,
        symbolSize: Double? = nil,
        annotation: ChartAnnotation? = nil
    ) {
        self.foregroundStyle = foregroundStyle
        self.lineStyle = lineStyle
        self.interpolationMethod = interpolationMethod
        self.cornerRadius = cornerRadius
        self.stacking = stacking
        self.symbol = symbol
        self.symbolSize = symbolSize
        self.annotation = annotation
    }
}

public struct ChartAnnotation: Equatable {
    public enum Position: String, Equatable {
        case top
        case bottom
        case leading
        case trailing
        case center
    }

    public var text: String
    public var position: Position

    public init(text: String, position: Position = .top) {
        self.text = text
        self.position = position
    }
}

public struct ChartLineStyle: Equatable {
    public var width: Double?
    public var dash: [Double]?

    public init(width: Double? = nil, dash: [Double]? = nil) {
        self.width = width
        self.dash = dash
    }
}

public struct ChartMarkAccessibility: Equatable {
    public var label: String?
    public var description: String?
    public var value: String?

    public init(label: String? = nil, description: String? = nil, value: String? = nil) {
        self.label = label
        self.description = description
        self.value = value
    }
}

public struct ChartAxisOptions: Equatable {
    public var x: ChartAxisOption?
    public var y: ChartAxisOption?

    public init(x: ChartAxisOption? = nil, y: ChartAxisOption? = nil) {
        self.x = x
        self.y = y
    }
}

public struct ChartAxisOption: Equatable {
    public var hidden: Bool
    public var values: ChartAxisValues?
    public var position: String?
    public var label: String?
    public var labelsHidden: Bool
    public var ticksHidden: Bool
    public var gridHidden: Bool
    public var formatter: ChartValueFormatter?

    public init(
        hidden: Bool = false,
        values: ChartAxisValues? = nil,
        position: String? = nil,
        label: String? = nil,
        labelsHidden: Bool = false,
        ticksHidden: Bool = false,
        gridHidden: Bool = false,
        formatter: ChartValueFormatter? = nil
    ) {
        self.hidden = hidden
        self.values = values
        self.position = position
        self.label = label
        self.labelsHidden = labelsHidden
        self.ticksHidden = ticksHidden
        self.gridHidden = gridHidden
        self.formatter = formatter
    }
}

public enum ChartAxisValues: Equatable {
    case automatic
    case values([ChartValue])
}

public enum ChartValueFormatter: Equatable {
    case number(minimumFractionDigits: Int?, maximumFractionDigits: Int?)
    case percent(minimumFractionDigits: Int?, maximumFractionDigits: Int?)
    case currency(currency: String, minimumFractionDigits: Int?, maximumFractionDigits: Int?)
    case date(dateStyle: String?, timeStyle: String?)
}

public struct ChartScaleOptions: Equatable {
    public var x: ChartScaleOption?
    public var y: ChartScaleOption?

    public init(x: ChartScaleOption? = nil, y: ChartScaleOption? = nil) {
        self.x = x
        self.y = y
    }
}

public struct ChartScaleOption: Equatable {
    public var type: String?
    public var domain: [ChartValue]?

    public init(type: String? = nil, domain: [ChartValue]? = nil) {
        self.type = type
        self.domain = domain
    }
}

public struct ChartLegendOptions: Equatable {
    public var hidden: Bool
    public var position: String?
    public var spacing: Double?

    public init(hidden: Bool = false, position: String? = nil, spacing: Double? = nil) {
        self.hidden = hidden
        self.position = position
        self.spacing = spacing
    }
}

public struct ChartStyleOptions: Equatable {
    public var foregroundStyleScale: [String: String]
    public var foregroundStyleScaleDomain: [String]
    public var symbolScale: [String: ChartMarkStyle.SymbolName]
    public var symbolScaleDomain: [String]

    public init(
        foregroundStyleScale: [String: String] = [:],
        foregroundStyleScaleDomain: [String] = [],
        symbolScale: [String: ChartMarkStyle.SymbolName] = [:],
        symbolScaleDomain: [String] = []
    ) {
        self.foregroundStyleScale = foregroundStyleScale
        self.foregroundStyleScaleDomain = foregroundStyleScaleDomain
        self.symbolScale = symbolScale
        self.symbolScaleDomain = symbolScaleDomain
    }
}

public struct ChartSelectionOptions: Equatable {
    public var x: ChartSelectionBinding?
    public var y: ChartSelectionBinding?

    public init(x: ChartSelectionBinding? = nil, y: ChartSelectionBinding? = nil) {
        self.x = x
        self.y = y
    }
}

public struct ChartSelectionBinding: Equatable {
    public var value: ChartValue?
    public var onChangeId: String?

    public init(value: ChartValue? = nil, onChangeId: String? = nil) {
        self.value = value
        self.onChangeId = onChangeId
    }
}

public struct ChartAccessibilityOptions: Equatable {
    public var label: String?
    public var description: String?

    public init(label: String? = nil, description: String? = nil) {
        self.label = label
        self.description = description
    }
}

public struct ChartDiagnostic: Equatable, Sendable {
    public enum Severity: String, Sendable {
        case warning
        case error
    }

    public var severity: Severity
    public var message: String
    public var path: String

    public init(_ severity: Severity, _ message: String, path: String) {
        self.severity = severity
        self.message = message
        self.path = path
    }
}

protocol ChartMarkComponent: Component {
    var chartMarkKind: ChartMark.Kind { get }
    var channels: ChartMarkChannels { get }
    var baseStyle: ChartMarkStyle { get }
}

extension ChartMarkComponent {
    func chartMark(id: String, style: ChartMarkStyle? = nil, accessibility: ChartMarkAccessibility = ChartMarkAccessibility()) -> ChartMark {
        ChartMark(
            id: id,
            kind: chartMarkKind,
            channels: channels,
            style: style ?? baseStyle,
            accessibility: accessibility
        )
    }
}
