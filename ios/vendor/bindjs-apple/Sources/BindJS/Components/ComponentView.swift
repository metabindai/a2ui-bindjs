import SwiftUI

private let componentFactories: [String: (Directive) -> Component?] = [
    // Views
    AngularGradientComponent.directiveName: { AngularGradientComponent(from: $0) },
    ButtonComponent.directiveName: { ButtonComponent(from: $0) },
    ChartComponent.directiveName: { ChartComponent(from: $0) },
    PieChartComponent.directiveName: { PieChartComponent(from: $0) },
    ComponentCall.directiveName: { ComponentCall(from: $0) },
    BarMarkComponent.directiveName: { BarMarkComponent(from: $0) },
    CapsuleComponent.directiveName: { CapsuleComponent(from: $0) },
    CircleComponent.directiveName: { CircleComponent(from: $0) },
    ColorComponent.directiveName: { ColorComponent(from: $0) },
    ContentUnavailableViewComponent.directiveName: { ContentUnavailableViewComponent(from: $0) },
    DividerComponent.directiveName: { DividerComponent(from: $0) },
    EllipseComponent.directiveName: { EllipseComponent(from: $0) },
    EllipticalGradientComponent.directiveName: { EllipticalGradientComponent(from: $0) },
    EmptyComponent.directiveName: { EmptyComponent(from: $0) },
    AreaMarkComponent.directiveName: { AreaMarkComponent(from: $0) },
    ForEachComponent.directiveName: { ForEachComponent(from: $0) },
    GeometryReaderComponent.directiveName: { GeometryReaderComponent(from: $0) },
    GridComponent.directiveName: { GridComponent(from: $0) },
    GridRowComponent.directiveName: { GridRowComponent(from: $0) },
    GroupComponent.directiveName: { GroupComponent(from: $0) },
    HStackComponent.directiveName: { HStackComponent(from: $0) },
    LazyHStackComponent.directiveName: { LazyHStackComponent(from: $0) },
    LazyVStackComponent.directiveName: { LazyVStackComponent(from: $0) },
    LabelComponent.directiveName: { LabelComponent(from: $0) },
    ImageComponent.directiveName: { ImageComponent(from: $0) },
    LineMarkComponent.directiveName: { LineMarkComponent(from: $0) },
    MenuComponent.directiveName: { MenuComponent(from: $0) },
    PieSliceMarkComponent.directiveName: { PieSliceMarkComponent(from: $0) },
    LinearGradientComponent.directiveName: { LinearGradientComponent(from: $0) },
    ListComponent.directiveName: { ListComponent(from: $0) },
    MaterialComponent.directiveName: { MaterialComponent(from: $0) },
    Model3DComponent.directiveName: { Model3DComponent(from: $0) },
    ModifiedComponent.directiveName: { ModifiedComponent(from: $0) },
    NavigationLinkComponent.directiveName: { NavigationLinkComponent(from: $0) },
    NavigationStackComponent.directiveName: { NavigationStackComponent(from: $0) },
    PathComponent.directiveName: { PathComponent(from: $0) },
    PickerComponent.directiveName: { PickerComponent(from: $0) },
    PlaceholderComponent.directiveName: { PlaceholderComponent(from: $0) },
    PointMarkComponent.directiveName: { PointMarkComponent(from: $0) },
    ProgressViewComponent.directiveName: { ProgressViewComponent(from: $0) },
    RadialGradientComponent.directiveName: { RadialGradientComponent(from: $0) },
    RectangleComponent.directiveName: { RectangleComponent(from: $0) },
    RectangleMarkComponent.directiveName: { RectangleMarkComponent(from: $0) },
    RuleMarkComponent.directiveName: { RuleMarkComponent(from: $0) },
    RoundedRectangleComponent.directiveName: { RoundedRectangleComponent(from: $0) },
    ScrollViewComponent.directiveName: { ScrollViewComponent(from: $0) },
    SectionComponent.directiveName: { SectionComponent(from: $0) },
    SecureFieldComponent.directiveName: { SecureFieldComponent(from: $0) },
    SpacerComponent.directiveName: { SpacerComponent(from: $0) },
    TextComponent.directiveName: { TextComponent(from: $0) },
    TextEditorComponent.directiveName: { TextEditorComponent(from: $0) },
    TextFieldComponent.directiveName: { TextFieldComponent(from: $0) },
    ToggleComponent.directiveName: { ToggleComponent(from: $0) },
    ToolbarItemComponent.directiveName: { ToolbarItemComponent(from: $0) },
    ToolbarItemGroupComponent.directiveName: { ToolbarItemGroupComponent(from: $0) },
    VideoComponent.directiveName: { VideoComponent(from: $0) },
    ViewThatFitsComponent.directiveName: { ViewThatFitsComponent(from: $0) },
    VStackComponent.directiveName: { VStackComponent(from: $0) },
    ZStackComponent.directiveName: { ZStackComponent(from: $0) },

    // Modifiers
    AccessibilityHiddenComponent.directiveName: { AccessibilityHiddenComponent(from: $0) },
    AccessibilityHintComponent.directiveName: { AccessibilityHintComponent(from: $0) },
    AccessibilityLabelComponent.directiveName: { AccessibilityLabelComponent(from: $0) },
    AccessibilityRepresentationComponent.directiveName: { AccessibilityRepresentationComponent(from: $0) },
    AccessibilityValueComponent.directiveName: { AccessibilityValueComponent(from: $0) },
    AccessibilityAddTraitsComponent.directiveName: { AccessibilityAddTraitsComponent(from: $0) },
    AccessibilityRemoveTraitsComponent.directiveName: { AccessibilityRemoveTraitsComponent(from: $0) },
    AllowsHitTestingComponent.directiveName: { AllowsHitTestingComponent(from: $0) },
    AllowsTighteningComponent.directiveName: { AllowsTighteningComponent(from: $0) },
    AspectRatioComponent.directiveName: { AspectRatioComponent(from: $0) },
    AnnotationComponent.directiveName: { AnnotationComponent(from: $0) },
    AutocorrectionDisabledComponent.directiveName: { AutocorrectionDisabledComponent(from: $0) },
    BackgroundComponent.directiveName: { BackgroundComponent(from: $0) },
    BadgeComponent.directiveName: { BadgeComponent(from: $0) },
    BlendModeComponent.directiveName: { BlendModeComponent(from: $0) },
    BlurComponent.directiveName: { BlurComponent(from: $0) },
    BoldComponent.directiveName: { BoldComponent(from: $0) },
    BorderComponent.directiveName: { BorderComponent(from: $0) },
    BrightnessComponent.directiveName: { BrightnessComponent(from: $0) },
    ChartXAxisComponent.directiveName: { ChartXAxisComponent(from: $0) },
    ChartYAxisComponent.directiveName: { ChartYAxisComponent(from: $0) },
    ChartXScaleComponent.directiveName: { ChartXScaleComponent(from: $0) },
    ChartYScaleComponent.directiveName: { ChartYScaleComponent(from: $0) },
    ChartForegroundStyleScaleComponent.directiveName: { ChartForegroundStyleScaleComponent(from: $0) },
    ChartLegendComponent.directiveName: { ChartLegendComponent(from: $0) },
    ChartSymbolScaleComponent.directiveName: { ChartSymbolScaleComponent(from: $0) },
    ChartXAxisLabelComponent.directiveName: { ChartXAxisLabelComponent(from: $0) },
    ChartSelectionComponent.directiveName: { ChartSelectionComponent(from: $0) },
    ChartXSelectionComponent.directiveName: { ChartXSelectionComponent(from: $0) },
    ChartYAxisLabelComponent.directiveName: { ChartYAxisLabelComponent(from: $0) },
    ChartYSelectionComponent.directiveName: { ChartYSelectionComponent(from: $0) },
    ClippedComponent.directiveName: { ClippedComponent(from: $0) },
    ClipShapeComponent.directiveName: { ClipShapeComponent(from: $0) },
    ColorInvertComponent.directiveName: { ColorInvertComponent(from: $0) },
    ColorSchemeComponent.directiveName: { ColorSchemeComponent(from: $0) },
    ContentShapeComponent.directiveName: { ContentShapeComponent(from: $0) },
    ContainerRelativeFrameComponent.directiveName: { ContainerRelativeFrameComponent(from: $0) },
    ContentTransitionComponent.directiveName: { ContentTransitionComponent(from: $0) },
    ContextMenuComponent.directiveName: { ContextMenuComponent(from: $0) },
    ContrastComponent.directiveName: { ContrastComponent(from: $0) },
    ControlSizeComponent.directiveName: { ControlSizeComponent(from: $0) },
    CornerRadiusComponent.directiveName: { CornerRadiusComponent(from: $0) },
    CoordinateSpaceComponent.directiveName: { CoordinateSpaceComponent(from: $0) },
    DisabledComponent.directiveName: { DisabledComponent(from: $0) },
    DynamicTypeSizeComponent.directiveName: { DynamicTypeSizeComponent(from: $0) },
    FixedSizeComponent.directiveName: { FixedSizeComponent(from: $0) },
    FocusedComponent.directiveName: { FocusedComponent(from: $0) },
    FullScreenCoverComponent.directiveName: { FullScreenCoverComponent(from: $0) },
    FontComponent.directiveName: { FontComponent(from: $0) },
    FontDesignComponent.directiveName: { FontDesignComponent(from: $0) },
    FontWeightComponent.directiveName: { FontWeightComponent(from: $0) },
    FontWidthComponent.directiveName: { FontWidthComponent(from: $0) },
    ForegroundStyleComponent.directiveName: { ForegroundStyleComponent(from: $0) },
    FrameComponent.directiveName: { makeFrameComponent($0) },
    GlassEffectComponent.directiveName: { GlassEffectComponent(from: $0) },
    GridCellAnchorComponent.directiveName: { GridCellAnchorComponent(from: $0) },
    GridCellColumnsComponent.directiveName: { GridCellColumnsComponent(from: $0) },
    GridCellUnsizedAxesComponent.directiveName: { GridCellUnsizedAxesComponent(from: $0) },
    GridColumnAlignmentComponent.directiveName: { GridColumnAlignmentComponent(from: $0) },
    GrayscaleComponent.directiveName: { GrayscaleComponent(from: $0) },
    HiddenComponent.directiveName: { HiddenComponent(from: $0) },
    IDComponent.directiveName: { IDComponent(from: $0) },
    IgnoresSafeAreaComponent.directiveName: { IgnoresSafeAreaComponent(from: $0) },
    InterpolationMethodComponent.directiveName: { InterpolationMethodComponent(from: $0) },
    ItalicComponent.directiveName: { ItalicComponent(from: $0) },
    KeyboardTypeComponent.directiveName: { KeyboardTypeComponent(from: $0) },
    LayoutPriorityComponent.directiveName: { LayoutPriorityComponent(from: $0) },
    ListRowBackgroundComponent.directiveName: { ListRowBackgroundComponent(from: $0) },
    ListRowSeparatorComponent.directiveName: { ListRowSeparatorComponent(from: $0) },
    ListStyleComponent.directiveName: { ListStyleComponent(from: $0) },
    LineLimitComponent.directiveName: { LineLimitComponent(from: $0) },
    LineSpacingComponent.directiveName: { LineSpacingComponent(from: $0) },
    LineStyleComponent.directiveName: { LineStyleComponent(from: $0) },
    MaskComponent.directiveName: { MaskComponent(from: $0) },
    MinimumScaleFactorComponent.directiveName: { MinimumScaleFactorComponent(from: $0) },
    MonospacedComponent.directiveName: { MonospacedComponent(from: $0) },
    MultilineTextAlignmentComponent.directiveName: { MultilineTextAlignmentComponent(from: $0) },
    NavigationBarBackButtonHiddenComponent.directiveName: { NavigationBarBackButtonHiddenComponent(from: $0) },
    NavigationBarTitleDisplayModeComponent.directiveName: { NavigationBarTitleDisplayModeComponent(from: $0) },
    NavigationDestinationComponent.directiveName: { NavigationDestinationComponent(from: $0) },
    NavigationTitleComponent.directiveName: { NavigationTitleComponent(from: $0) },
    OffsetComponent.directiveName: { OffsetComponent(from: $0) },
    OnAppearComponent.directiveName: { OnAppearComponent(from: $0) },
    OnChangeComponent.directiveName: { OnChangeComponent(from: $0) },
    OnDisappearComponent.directiveName: { OnDisappearComponent(from: $0) },
    OnDragGestureComponent.directiveName: { OnDragGestureComponent(from: $0) },
    OnLongPressGestureComponent.directiveName: { OnLongPressGestureComponent(from: $0) },
    OnTapGestureComponent.directiveName: { OnTapGestureComponent(from: $0) },
    OnSubmitComponent.directiveName: { OnSubmitComponent(from: $0) },
    OpacityComponent.directiveName: { OpacityComponent(from: $0) },
    OverlayComponent.directiveName: { OverlayComponent(from: $0) },
    PaddingComponent.directiveName: { PaddingComponent(from: $0) },
    PickerStyleComponent.directiveName: { PickerStyleComponent(from: $0) },
    PresentationDetentsComponent.directiveName: { PresentationDetentsComponent(from: $0) },
    QuickLookComponent.directiveName: { QuickLookComponent(from: $0) },
    RotationEffectComponent.directiveName: { RotationEffectComponent(from: $0) },
    SaturationComponent.directiveName: { SaturationComponent(from: $0) },
    ScaledToFillComponent.directiveName: { ScaledToFillComponent(from: $0) },
    ScaledToFitComponent.directiveName: { ScaledToFitComponent(from: $0) },
    ScaleEffectComponent.directiveName: { ScaleEffectComponent(from: $0) },
    SafeAreaInsetComponent.directiveName: { SafeAreaInsetComponent(from: $0) },
    ScrollContentBackgroundComponent.directiveName: { ScrollContentBackgroundComponent(from: $0) },
    ScrollEdgeEffectHiddenComponent.directiveName: { ScrollEdgeEffectHiddenComponent(from: $0) },
    ScrollEdgeEffectStyleComponent.directiveName: { ScrollEdgeEffectStyleComponent(from: $0) },
    ScrollIndicatorsComponent.directiveName: { ScrollIndicatorsComponent(from: $0) },
    ScrollPositionComponent.directiveName: { ScrollPositionComponent(from: $0) },
    ScrollTargetBehaviorComponent.directiveName: { ScrollTargetBehaviorComponent(from: $0) },
    ScrollTargetLayoutComponent.directiveName: { ScrollTargetLayoutComponent(from: $0) },
    SensoryFeedbackComponent.directiveName: { SensoryFeedbackComponent(from: $0) },
    SubmitLabelComponent.directiveName: { SubmitLabelComponent(from: $0) },
    ShadowComponent.directiveName: { ShadowComponent(from: $0) },
    SheetComponent.directiveName: { SheetComponent(from: $0) },
    StrikethroughComponent.directiveName: { StrikethroughComponent(from: $0) },
    SymbolComponent.directiveName: { SymbolComponent(from: $0) },
    SymbolSizeComponent.directiveName: { SymbolSizeComponent(from: $0) },
    TagComponent.directiveName: { TagComponent(from: $0) },
    TextCaseComponent.directiveName: { TextCaseComponent(from: $0) },
    TextSelectionComponent.directiveName: { TextSelectionComponent(from: $0) },
    TextFieldStyleComponent.directiveName: { TextFieldStyleComponent(from: $0) },
    TintComponent.directiveName: { TintComponent(from: $0) },
    ToolbarComponent.directiveName: { ToolbarComponent(from: $0) },
    ToolbarVisibilityComponent.directiveName: { ToolbarVisibilityComponent(from: $0) },
    TrackingComponent.directiveName: { TrackingComponent(from: $0) },
    TransformEffectComponent.directiveName: { TransformEffectComponent(from: $0) },
    TransitionComponent.directiveName: { TransitionComponent(from: $0) },
    UnderlineComponent.directiveName: { UnderlineComponent(from: $0) },
    VisualEffectComponent.directiveName: { VisualEffectComponent(from: $0) },
    ZIndexComponent.directiveName: { ZIndexComponent(from: $0) },

    // Values
    CustomFontComponent.directiveName: { CustomFontComponent(from: $0) },
].merging(platformComponentFactories) { _, new in new }

#if os(iOS) || os(visionOS)
private let platformComponentFactories: [String: (Directive) -> Component?] = [
    GalleryComponent.directiveName: { GalleryComponent(from: $0) },
    GalleryItemComponent.directiveName: { GalleryItemComponent(from: $0) },
    MapComponent.directiveName: { MapComponent(from: $0) },
]
#else
private let platformComponentFactories: [String: (Directive) -> Component?] = [:]
#endif

private func makeFrameComponent(_ directive: Directive) -> Component? {
    let keys = directive.props.keys
    if keys.contains("minWidth") || keys.contains("minHeight") || keys.contains("maxWidth") || keys.contains("maxHeight") {
        return FlexibleFrameComponent(from: directive)
    }
    return FrameComponent(from: directive)
}

func makeComponent(_ directive: Directive) -> Component? {
    if let factory = componentFactories[directive.type] {
        return factory(directive)
    }
    return UnresolvedComponent(from: directive)
}

/// Returns a component only if the directive type matches a built-in factory.
/// Returns nil for unknown types (instead of falling back to UnresolvedComponent),
/// allowing callers to route through the ComponentRegistry instead.
func makeComponentIfBuiltIn(_ directive: Directive) -> Component? {
    componentFactories[directive.type]?(directive)
}

public struct ComponentView: View {
    let component: Component
    
    public init(_ component: Component) {
        self.component = component
    }
    
    public var body: some View {
        switch component {
        case let angularGradient as AngularGradientComponent: angularGradient
        case let button as ButtonComponent: button
        case let chart as ChartComponent: chart
        case let pieChart as PieChartComponent: pieChart
        case let callComponent as ComponentCall: callComponent
        case let barMark as BarMarkComponent: UnsupportedChartContentView(componentName: type(of: barMark).directiveName)
        case let capsule as CapsuleComponent: capsule
        case let circle as CircleComponent: circle
        case let color as ColorComponent: color
        case let contentUnavailable as ContentUnavailableViewComponent: contentUnavailable
        case let divider as DividerComponent: divider
        case let ellipse as EllipseComponent: ellipse
        case let ellipticalGradient as EllipticalGradientComponent: ellipticalGradient
        case let empty as EmptyComponent: empty
        case let areaMark as AreaMarkComponent: UnsupportedChartContentView(componentName: type(of: areaMark).directiveName)
        case let forEach as ForEachComponent: forEach
        case let geometryReader as GeometryReaderComponent: geometryReader
        case let grid as GridComponent: grid
        case let gridRow as GridRowComponent: gridRow
        case let group as GroupComponent: group
        case let hStack as HStackComponent: hStack
        case let image as ImageComponent: image
        case let label as LabelComponent: label
        case let lineMark as LineMarkComponent: UnsupportedChartContentView(componentName: type(of: lineMark).directiveName)
        case let lazyHStack as LazyHStackComponent: lazyHStack
        case let lazyVStack as LazyVStackComponent: lazyVStack
        case let linearGradient as LinearGradientComponent: linearGradient
        case let list as ListComponent: list
        #if os(iOS) || os(visionOS)
        case let map as MapComponent: map
        #endif
        case let material as MaterialComponent: material
        case let menu as MenuComponent: menu
        case let model3D as Model3DComponent: model3D
        case let modified as ModifiedComponent: modified
        case let navigationLink as NavigationLinkComponent: navigationLink
        case let navigationStack as NavigationStackComponent: navigationStack
        case let path as PathComponent: path
        case let picker as PickerComponent: picker
        case let placeholder as PlaceholderComponent: placeholder
        case let pieSliceMark as PieSliceMarkComponent: UnsupportedChartContentView(componentName: type(of: pieSliceMark).directiveName)
        case let pointMark as PointMarkComponent: UnsupportedChartContentView(componentName: type(of: pointMark).directiveName)
        case let progressView as ProgressViewComponent: progressView
        case let radialGradient as RadialGradientComponent: radialGradient
        case let rectangle as RectangleComponent: rectangle
        case let rectangleMark as RectangleMarkComponent: UnsupportedChartContentView(componentName: type(of: rectangleMark).directiveName)
        case let ruleMark as RuleMarkComponent: UnsupportedChartContentView(componentName: type(of: ruleMark).directiveName)
        case let roundedRectangle as RoundedRectangleComponent: roundedRectangle
        case let scrollView as ScrollViewComponent: scrollView
        case let section as SectionComponent: section
        case let secureField as SecureFieldComponent: secureField
        case let spacer as SpacerComponent: spacer
        case let text as TextComponent: text
        case let textEditor as TextEditorComponent: textEditor
        case let textField as TextFieldComponent: textField
        case let toggle as ToggleComponent: toggle
        case let unresolved as UnresolvedComponent: unresolved
        case let viewThatFits as ViewThatFitsComponent: viewThatFits
        case let vStack as VStackComponent: vStack
        case let video as VideoComponent: video
        case let zStack as ZStackComponent: zStack
        default: Text("Unsupported: \(type(of: component).directiveName)")
        }
    }
}

struct ComponentViewModifier: ViewModifier {
    let component: Component

    init(_ component: Component) {
        self.component = component
    }

    public func body(content: Content) -> some View {
        switch component {
        case let m as AccessibilityAddTraitsComponent: content.modifier(m)
        case let m as AccessibilityHiddenComponent: content.modifier(m)
        case let m as AccessibilityHintComponent: content.modifier(m)
        case let m as AccessibilityLabelComponent: content.modifier(m)
        case let m as AccessibilityRemoveTraitsComponent: content.modifier(m)
        case let m as AccessibilityRepresentationComponent: content.modifier(m)
        case let m as AccessibilityValueComponent: content.modifier(m)
        case let m as AllowsHitTestingComponent: content.modifier(m)
        case let m as AllowsTighteningComponent: content.modifier(m)
        case let m as AspectRatioComponent: content.modifier(m)
        case let m as AnnotationComponent: content.modifier(m)
        case let m as AutocorrectionDisabledComponent: content.modifier(m)
        case let m as BackgroundComponent: content.modifier(m)
        case let m as BadgeComponent: content.modifier(m)
        case let m as BlendModeComponent: content.modifier(m)
        case let m as BlurComponent: content.modifier(m)
        case let m as BoldComponent: content.modifier(m)
        case let m as BorderComponent: content.modifier(m)
        case let m as BrightnessComponent: content.modifier(m)
        case let m as ChartXAxisComponent: content.modifier(m)
        case let m as ChartYAxisComponent: content.modifier(m)
        case let m as ChartXScaleComponent: content.modifier(m)
        case let m as ChartYScaleComponent: content.modifier(m)
        case let m as ChartForegroundStyleScaleComponent: content.modifier(m)
        case let m as ChartLegendComponent: content.modifier(m)
        case let m as ChartSymbolScaleComponent: content.modifier(m)
        case let m as ChartXAxisLabelComponent: content.modifier(m)
        case let m as ChartSelectionComponent: content.modifier(m)
        case let m as ChartXSelectionComponent: content.modifier(m)
        case let m as ChartYAxisLabelComponent: content.modifier(m)
        case let m as ChartYSelectionComponent: content.modifier(m)
        case let m as ClipShapeComponent: content.modifier(m)
        case let m as ClippedComponent: content.modifier(m)
        case let m as ColorInvertComponent: content.modifier(m)
        case let m as ColorSchemeComponent: content.modifier(m)
        case let m as ContentShapeComponent: content.modifier(m)
        case let m as ContainerRelativeFrameComponent: content.modifier(m)
        case let m as ContentTransitionComponent: content.modifier(m)
        case let m as ContextMenuComponent: content.modifier(m)
        case let m as ContrastComponent: content.modifier(m)
        case let m as ControlSizeComponent: content.modifier(m)
        case let m as CoordinateSpaceComponent: content.modifier(m)
        case let m as CornerRadiusComponent: content.modifier(m)
        case let m as DisabledComponent: content.modifier(m)
        case let m as DynamicTypeSizeComponent: content.modifier(m)
        case let m as FixedSizeComponent: content.modifier(m)
        case let m as FlexibleFrameComponent: content.modifier(m)
        case let m as FocusedComponent: content.modifier(m)
        case let m as FontComponent: content.modifier(m)
        case let m as FontDesignComponent: content.modifier(m)
        case let m as FontWeightComponent: content.modifier(m)
        case let m as FontWidthComponent: content.modifier(m)
        case let m as ForegroundStyleComponent: content.modifier(m)
        case let m as FrameComponent: content.modifier(m)
        case let m as FullScreenCoverComponent: content.modifier(m)
        #if os(iOS) || os(visionOS)
        case let m as GalleryComponent: content.modifier(m)
        case let m as GalleryItemComponent: content.modifier(m)
        #endif
        case let m as GlassEffectComponent: content.modifier(m)
        case let m as GridCellAnchorComponent: content.modifier(m)
        case let m as GridCellColumnsComponent: content.modifier(m)
        case let m as GridCellUnsizedAxesComponent: content.modifier(m)
        case let m as GridColumnAlignmentComponent: content.modifier(m)
        case let m as GrayscaleComponent: content.modifier(m)
        case let m as HiddenComponent: content.modifier(m)
        case let m as IDComponent: content.modifier(m)
        case let m as IgnoresSafeAreaComponent: content.modifier(m)
        case let m as InterpolationMethodComponent: content.modifier(m)
        case let m as ItalicComponent: content.modifier(m)
        case let m as KeyboardTypeComponent: content.modifier(m)
        case let m as LayoutPriorityComponent: content.modifier(m)
        case let m as ListRowBackgroundComponent: content.modifier(m)
        case let m as ListRowSeparatorComponent: content.modifier(m)
        case let m as ListStyleComponent: content.modifier(m)
        case let m as LineLimitComponent: content.modifier(m)
        case let m as LineSpacingComponent: content.modifier(m)
        case let m as LineStyleComponent: content.modifier(m)
        case let m as MaskComponent: content.modifier(m)
        case let m as MinimumScaleFactorComponent: content.modifier(m)
        case let m as MonospacedComponent: content.modifier(m)
        case let m as MultilineTextAlignmentComponent: content.modifier(m)
        case let m as NavigationBarBackButtonHiddenComponent: content.modifier(m)
        case let m as NavigationBarTitleDisplayModeComponent: content.modifier(m)
        case let m as NavigationDestinationComponent: content.modifier(m)
        case let m as NavigationTitleComponent: content.modifier(m)
        case let m as OffsetComponent: content.modifier(m)
        case let m as OnAppearComponent: content.modifier(m)
        case let m as OnChangeComponent: content.modifier(m)
        case let m as OnDisappearComponent: content.modifier(m)
        case let m as OnDragGestureComponent: content.modifier(m)
        case let m as OnLongPressGestureComponent: content.modifier(m)
        case let m as OnSubmitComponent: content.modifier(m)
        case let m as OnTapGestureComponent: content.modifier(m)
        case let m as OpacityComponent: content.modifier(m)
        case let m as OverlayComponent: content.modifier(m)
        case let m as PaddingComponent: content.modifier(m)
        case let m as PickerStyleComponent: content.modifier(m)
        case let m as PresentationDetentsComponent: content.modifier(m)
        case let m as QuickLookComponent: content.modifier(m)
        case let m as RotationEffectComponent: content.modifier(m)
        case let m as SafeAreaInsetComponent: content.modifier(m)
        case let m as SaturationComponent: content.modifier(m)
        case let m as ScaleEffectComponent: content.modifier(m)
        case let m as ScaledToFillComponent: content.modifier(m)
        case let m as ScaledToFitComponent: content.modifier(m)
        case let m as ScrollContentBackgroundComponent: content.modifier(m)
        case let m as ScrollEdgeEffectHiddenComponent: content.modifier(m)
        case let m as ScrollEdgeEffectStyleComponent: content.modifier(m)
        case let m as ScrollIndicatorsComponent: content.modifier(m)
        case let m as ScrollPositionComponent: content.modifier(m)
        case let m as ScrollTargetBehaviorComponent: content.modifier(m)
        case let m as ScrollTargetLayoutComponent: content.modifier(m)
        case let m as SensoryFeedbackComponent: content.modifier(m)
        case let m as ShadowComponent: content.modifier(m)
        case let m as SheetComponent: content.modifier(m)
        case let m as StrikethroughComponent: content.modifier(m)
        case let m as SymbolComponent: content.modifier(m)
        case let m as SymbolSizeComponent: content.modifier(m)
        case let m as SubmitLabelComponent: content.modifier(m)
        case let m as TagComponent: content.modifier(m)
        case let m as TextCaseComponent: content.modifier(m)
        case let m as TextFieldStyleComponent: content.modifier(m)
        case let m as TextSelectionComponent: content.modifier(m)
        case let m as TintComponent: content.modifier(m)
        case let m as ToolbarComponent: content.modifier(m)
        case let m as ToolbarVisibilityComponent: content.modifier(m)
        case let m as TrackingComponent: content.modifier(m)
        case let m as TransformEffectComponent: content.modifier(m)
        case let m as TransitionComponent: content.modifier(m)
        case let m as UnderlineComponent: content.modifier(m)
        case let m as VisualEffectComponent: content.modifier(m)
        case let m as ZIndexComponent: content.modifier(m)
        default:
            content
        }
    }
}
