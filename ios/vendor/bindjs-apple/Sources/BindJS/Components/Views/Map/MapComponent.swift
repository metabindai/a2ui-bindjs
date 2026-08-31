#if os(iOS) || os(visionOS)
import SwiftUI
import MapKit

// MARK: - Map Component

public struct MapComponent: Component {
    public static var directiveName: String = "Map"

    @EnvironmentObject private var context: BindJSContext
    @State private var selectedTag: String?

    let latitude: Double
    let longitude: Double
    let distance: Double
    let mapStyle: MapStyleType
    let interactionModes: MapInteractionModes
    let markers: [MarkerData]
    let annotations: [AnnotationData]
    let circles: [MapCircleData]
    let polylines: [MapPolylineData]
    let polygons: [MapPolygonData]
    let controls: MapControlSet?
    let onCameraChangeId: String?
    let cameraChangeFrequency: CameraChangeFrequency
    let showsUserLocation: Bool
    let onSelectId: String?

    enum MapStyleType: String {
        case standard
        case imagery
        case hybrid
    }

    enum CameraChangeFrequency: String {
        case onEnd, continuous
    }

    struct MapControlSet {
        let compass: Bool
        let scale: Bool
        let userLocation: Bool
        let pitch: Bool
    }
}

extension MapComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        latitude = directive["latitude"] ?? 0
        longitude = directive["longitude"] ?? 0
        distance = directive["distance"] ?? 1000

        let styleString: String = directive["style"] ?? "standard"
        mapStyle = MapStyleType(rawValue: styleString) ?? .standard

        if let modesArray = directive.props["interactionModes"] as? [Any] {
            let strings = modesArray.compactMap { $0 as? String }
            var modes: MapInteractionModes = []
            for mode in strings {
                switch mode {
                case "pan": modes.insert(.pan)
                case "zoom": modes.insert(.zoom)
                case "rotate": modes.insert(.rotate)
                case "pitch": modes.insert(.pitch)
                case "all": modes = .all
                default: break
                }
            }
            interactionModes = modes
        } else {
            interactionModes = .all
        }

        // Parse children directly from raw directives — not through makeComponent.
        // Map children are MapContent, not View, so they bypass the Component system.
        var parsedMarkers: [MarkerData] = []
        var parsedAnnotations: [AnnotationData] = []
        var parsedCircles: [MapCircleData] = []
        var parsedPolylines: [MapPolylineData] = []
        var parsedPolygons: [MapPolygonData] = []

        for child in directive.children {
            switch child.type {
            case MarkerData.directiveName:
                if let marker = MarkerData(from: child) { parsedMarkers.append(marker) }
            case AnnotationData.directiveName:
                if let annotation = AnnotationData(from: child) { parsedAnnotations.append(annotation) }
            case MapCircleData.directiveName:
                if let circle = MapCircleData(from: child) { parsedCircles.append(circle) }
            case MapPolylineData.directiveName:
                if let polyline = MapPolylineData(from: child) { parsedPolylines.append(polyline) }
            case MapPolygonData.directiveName:
                if let polygon = MapPolygonData(from: child) { parsedPolygons.append(polygon) }
            default: break
            }
        }

        markers = parsedMarkers
        annotations = parsedAnnotations
        circles = parsedCircles
        polylines = parsedPolylines
        polygons = parsedPolygons

        // Controls
        if let controlsArray = directive.props["controls"] as? [Any] {
            let strings = controlsArray.compactMap { $0 as? String }
            controls = MapControlSet(
                compass: strings.contains("compass"),
                scale: strings.contains("scale"),
                userLocation: strings.contains("userLocation"),
                pitch: strings.contains("pitch")
            )
        } else {
            controls = nil
        }

        // Camera change
        onCameraChangeId = directive["onCameraChangeId"]
        let freq: String = directive["cameraChangeFrequency"] ?? "onEnd"
        cameraChangeFrequency = CameraChangeFrequency(rawValue: freq) ?? .onEnd

        // User location
        showsUserLocation = directive["showsUserLocation"] ?? false

        // Selection
        onSelectId = directive["onSelectId"]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitMap(self)
    }
}

extension MapComponent: View {
    public var body: some View {
        Group {
            if onSelectId != nil {
                Map(initialPosition: cameraPosition, interactionModes: interactionModes, selection: $selectedTag) {
                    mapContent
                }
            } else {
                Map(initialPosition: cameraPosition, interactionModes: interactionModes) {
                    mapContent
                }
            }
        }
        .mapStyle(resolvedMapStyle)
        .applyMapControls(controls)
        .applyOnMapCameraChange(handlerId: onCameraChangeId, frequency: cameraChangeFrequency, context: context)
        .onChange(of: selectedTag) { _, newValue in
            if let onSelectId {
                _ = context.callEventHandler(id: onSelectId, arguments: newValue as Any)
            }
        }
    }

    private var cameraPosition: MapCameraPosition {
        .camera(MapCamera(
            centerCoordinate: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
            distance: distance
        ))
    }

    @MapContentBuilder
    private var mapContent: some MapContent {
        ForEach(markers.indices, id: \.self) { index in
            markers[index].selectableMapContent
        }
        ForEach(annotations.indices, id: \.self) { index in
            annotations[index].selectableMapContent
        }
        ForEach(circles.indices, id: \.self) { index in
            circles[index].mapContent
        }
        ForEach(polylines.indices, id: \.self) { index in
            polylines[index].mapContent
        }
        ForEach(polygons.indices, id: \.self) { index in
            polygons[index].mapContent
        }
        if showsUserLocation {
            UserAnnotation()
        }
    }

    private var resolvedMapStyle: MapStyle {
        switch mapStyle {
        case .standard: .standard
        case .imagery: .imagery
        case .hybrid: .hybrid
        }
    }
}

// MARK: - Map Controls & Camera Change

private extension View {
    @ViewBuilder
    func applyMapControls(_ controlSet: MapComponent.MapControlSet?) -> some View {
        if let controlSet {
            self.mapControls {
                if controlSet.compass { MapCompass() }
                if controlSet.scale { MapScaleView() }
                if controlSet.userLocation { MapUserLocationButton() }
                if controlSet.pitch { MapPitchToggle() }
            }
        } else {
            self
        }
    }

    @ViewBuilder
    func applyOnMapCameraChange(handlerId: String?, frequency: MapComponent.CameraChangeFrequency, context: BindJSContext) -> some View {
        if let handlerId {
            self.onMapCameraChange(frequency: frequency == .continuous ? .continuous : .onEnd) { ctx in
                _ = context.callEventHandler(id: handlerId, arguments: [
                    "latitude": ctx.camera.centerCoordinate.latitude,
                    "longitude": ctx.camera.centerCoordinate.longitude,
                    "distance": ctx.camera.distance,
                    "heading": ctx.camera.heading,
                    "pitch": ctx.camera.pitch
                ])
            }
        } else {
            self
        }
    }
}

// MARK: - Marker Data

struct MarkerData {
    static let directiveName = "Marker"

    let title: String
    let coordinate: CLLocationCoordinate2D
    let systemImage: String?
    let tintColor: Color?
    let tag: String?

    init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        guard let latitude: Double = directive["latitude"],
              let longitude: Double = directive["longitude"] else { return nil }

        title = directive["title"] ?? ""
        coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        systemImage = directive["systemImage"]
        tag = directive["tag"]

        if let tintDirective: Directive = directive["tint"],
           let color = ColorComponent(from: tintDirective) {
            tintColor = color.swiftUI
        } else {
            tintColor = nil
        }

    }

    @MapContentBuilder
    var mapContent: some MapContent {
        if let systemImage {
            if let tintColor {
                Marker(title, systemImage: systemImage, coordinate: coordinate)
                    .tint(tintColor)
            } else {
                Marker(title, systemImage: systemImage, coordinate: coordinate)
            }
        } else {
            if let tintColor {
                Marker(title, coordinate: coordinate)
                    .tint(tintColor)
            } else {
                Marker(title, coordinate: coordinate)
            }
        }
    }

    @MapContentBuilder
    var selectableMapContent: some MapContent {
        if let tag {
            mapContent.tag(tag)
        } else {
            mapContent
        }
    }
}

// MARK: - Annotation Data

struct AnnotationData {
    static let directiveName = "Annotation"

    let title: String
    let coordinate: CLLocationCoordinate2D
    let anchor: UnitPoint
    let children: [Component]
    let tag: String?

    init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        guard let latitude: Double = directive["latitude"],
              let longitude: Double = directive["longitude"] else { return nil }

        title = directive["title"] ?? ""
        coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        tag = directive["tag"]

        let anchorString: String = directive["anchor"] ?? "bottom"
        switch anchorString {
        case "center": anchor = .center
        case "top": anchor = .top
        case "bottom": anchor = .bottom
        case "leading": anchor = .leading
        case "trailing": anchor = .trailing
        case "topLeading": anchor = .topLeading
        case "topTrailing": anchor = .topTrailing
        case "bottomLeading": anchor = .bottomLeading
        case "bottomTrailing": anchor = .bottomTrailing
        default: anchor = .bottom
        }

        // Annotation children are actual SwiftUI views — parse through makeComponent
        children = directive.children.compactMap { makeComponent($0) }
    }

    @MapContentBuilder
    var mapContent: some MapContent {
        Annotation(title, coordinate: coordinate, anchor: anchor) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }

    @MapContentBuilder
    var selectableMapContent: some MapContent {
        if let tag {
            mapContent.tag(tag)
        } else {
            mapContent
        }
    }
}

// MARK: - MapCircle Data

struct MapCircleData {
    static let directiveName = "MapCircle"

    let center: CLLocationCoordinate2D
    let radius: CLLocationDistance
    let fillColor: Color?
    let fillOpacity: Double
    let strokeColor: Color?
    let lineWidth: Double

    init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        guard let latitude: Double = directive["latitude"],
              let longitude: Double = directive["longitude"] else { return nil }

        center = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        radius = directive["radius"] ?? 1000
        fillOpacity = directive["fillOpacity"] ?? 1.0
        lineWidth = directive["lineWidth"] ?? 1.0

        if let fillDirective: Directive = directive["fill"],
           let color = ColorComponent(from: fillDirective) {
            fillColor = color.swiftUI
        } else {
            fillColor = nil
        }

        if let strokeDirective: Directive = directive["stroke"],
           let color = ColorComponent(from: strokeDirective) {
            strokeColor = color.swiftUI
        } else {
            strokeColor = nil
        }
    }

    @MapContentBuilder
    var mapContent: some MapContent {
        MapCircle(center: center, radius: radius)
            .foregroundStyle((fillColor ?? .blue).opacity(fillOpacity))
            .stroke(strokeColor ?? .blue, lineWidth: lineWidth)
    }
}

// MARK: - MapPolyline Data

struct MapPolylineData {
    static let directiveName = "MapPolyline"

    let coordinates: [CLLocationCoordinate2D]
    let strokeColor: Color?
    let lineWidth: Double

    init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        coordinates = Self.parseCoordinates(from: directive)
        lineWidth = directive["lineWidth"] ?? 1.0

        if let strokeDirective: Directive = directive["stroke"],
           let color = ColorComponent(from: strokeDirective) {
            strokeColor = color.swiftUI
        } else {
            strokeColor = nil
        }
    }

    @MapContentBuilder
    var mapContent: some MapContent {
        MapPolyline(coordinates: coordinates)
            .stroke(strokeColor ?? .blue, lineWidth: lineWidth)
    }

    private static func parseCoordinates(from directive: Directive) -> [CLLocationCoordinate2D] {
        guard let coordsArray = directive.props["coordinates"] as? [Any] else { return [] }
        return coordsArray.compactMap { item -> CLLocationCoordinate2D? in
            guard let dict = item as? [String: Any],
                  let lat = dict["latitude"] as? Double,
                  let lon = dict["longitude"] as? Double else { return nil }
            return CLLocationCoordinate2D(latitude: lat, longitude: lon)
        }
    }
}

// MARK: - MapPolygon Data

struct MapPolygonData {
    static let directiveName = "MapPolygon"

    let coordinates: [CLLocationCoordinate2D]
    let fillColor: Color?
    let fillOpacity: Double
    let strokeColor: Color?
    let lineWidth: Double

    init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        coordinates = Self.parseCoordinates(from: directive)
        fillOpacity = directive["fillOpacity"] ?? 1.0
        lineWidth = directive["lineWidth"] ?? 1.0

        if let fillDirective: Directive = directive["fill"],
           let color = ColorComponent(from: fillDirective) {
            fillColor = color.swiftUI
        } else {
            fillColor = nil
        }

        if let strokeDirective: Directive = directive["stroke"],
           let color = ColorComponent(from: strokeDirective) {
            strokeColor = color.swiftUI
        } else {
            strokeColor = nil
        }
    }

    @MapContentBuilder
    var mapContent: some MapContent {
        MapPolygon(coordinates: coordinates)
            .foregroundStyle((fillColor ?? .blue).opacity(fillOpacity))
            .stroke(strokeColor ?? .blue, lineWidth: lineWidth)
    }

    private static func parseCoordinates(from directive: Directive) -> [CLLocationCoordinate2D] {
        guard let coordsArray = directive.props["coordinates"] as? [Any] else { return [] }
        return coordsArray.compactMap { item -> CLLocationCoordinate2D? in
            guard let dict = item as? [String: Any],
                  let lat = dict["latitude"] as? Double,
                  let lon = dict["longitude"] as? Double else { return nil }
            return CLLocationCoordinate2D(latitude: lat, longitude: lon)
        }
    }
}

#endif
