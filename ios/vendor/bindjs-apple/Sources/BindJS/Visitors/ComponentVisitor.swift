public protocol ComponentVisitor {
    associatedtype Result
    
    mutating func visit(_ component: any Component) -> Result
    mutating func defaultVisit(_ component: any Component) -> Result
    
    // Views Components
    mutating func visitButton(_ button: ButtonComponent) -> Result
    mutating func visitChart(_ chart: ChartComponent) -> Result
    mutating func visitPieChart(_ pieChart: PieChartComponent) -> Result
    mutating func visitBarMark(_ barMark: BarMarkComponent) -> Result
    mutating func visitLineMark(_ lineMark: LineMarkComponent) -> Result
    mutating func visitAreaMark(_ areaMark: AreaMarkComponent) -> Result
    mutating func visitPointMark(_ pointMark: PointMarkComponent) -> Result
    mutating func visitRuleMark(_ ruleMark: RuleMarkComponent) -> Result
    mutating func visitRectangleMark(_ rectangleMark: RectangleMarkComponent) -> Result
    mutating func visitPieSliceMark(_ pieSliceMark: PieSliceMarkComponent) -> Result
    mutating func visitCall(_ call: ComponentCall) -> Result
    mutating func visitColor(_ color: ColorComponent) -> Result
    mutating func visitContentUnavailableView(_ contentUnavailableView: ContentUnavailableViewComponent) -> Result
    mutating func visitDivider(_ divider: DividerComponent) -> Result
    mutating func visitForEach(_ forEach: ForEachComponent) -> Result
    mutating func visitGeometryReader(_ geometryReader: GeometryReaderComponent) -> Result
    mutating func visitGrid(_ grid: GridComponent) -> Result
    mutating func visitGridRow(_ gridRow: GridRowComponent) -> Result
    mutating func visitGroup(_ group: GroupComponent) -> Result
    mutating func visitHStack(_ hStack: HStackComponent) -> Result
    mutating func visitLazyHStack(_ lazyHStack: LazyHStackComponent) -> Result
    mutating func visitLazyVStack(_ lazyVStack: LazyVStackComponent) -> Result
    mutating func visitLabel(_ label: LabelComponent) -> Result
    mutating func visitImage(_ image: ImageComponent) -> Result
    mutating func visitList(_ list: ListComponent) -> Result
    mutating func visitMenu(_ menu: MenuComponent) -> Result
    mutating func visitMaterial(_ material: MaterialComponent) -> Result
    mutating func visitModel3D(_ model3D: Model3DComponent) -> Result
    mutating func visitModified(_ modified: ModifiedComponent) -> Result
    mutating func visitNavigationLink(_ navigationLink: NavigationLinkComponent) -> Result
    mutating func visitNavigationStack(_ navigationStack: NavigationStackComponent) -> Result
    mutating func visitEmpty(_ empty: EmptyComponent) -> Result
    mutating func visitPicker(_ picker: PickerComponent) -> Result
    mutating func visitPlaceholder(_ placeholder: PlaceholderComponent) -> Result
    mutating func visitProgressView(_ progressView: ProgressViewComponent) -> Result
    mutating func visitScrollView(_ scrollView: ScrollViewComponent) -> Result
    mutating func visitSection(_ section: SectionComponent) -> Result
    mutating func visitSpacer(_ spacer: SpacerComponent) -> Result
    mutating func visitText(_ text: TextComponent) -> Result
    mutating func visitTextEditor(_ textEditor: TextEditorComponent) -> Result
    mutating func visitTextField(_ textField: TextFieldComponent) -> Result
    mutating func visitSecureField(_ secureField: SecureFieldComponent) -> Result
    mutating func visitToggle(_ toggle: ToggleComponent) -> Result
    mutating func visitToolbarItem(_ toolbarItem: ToolbarItemComponent) -> Result
    mutating func visitToolbarItemGroup(_ toolbarItemGroup: ToolbarItemGroupComponent) -> Result
    mutating func visitUnresolved(_ unresolved: UnresolvedComponent) -> Result
    mutating func visitViewThatFits(_ viewThatFits: ViewThatFitsComponent) -> Result
    mutating func visitVStack(_ vStack: VStackComponent) -> Result
    mutating func visitVideo(_ video: VideoComponent) -> Result
    mutating func visitZStack(_ zStack: ZStackComponent) -> Result
    
    // Gradient Components
    mutating func visitLinearGradient(_ linearGradient: LinearGradientComponent) -> Result
    mutating func visitAngularGradient(_ angularGradient: AngularGradientComponent) -> Result
    mutating func visitRadialGradient(_ radialGradient: RadialGradientComponent) -> Result
    mutating func visitEllipticalGradient(_ ellipticalGradient: EllipticalGradientComponent) -> Result
    
    // Shape Components
    mutating func visitCircle(_ circle: CircleComponent) -> Result
    mutating func visitEllipse(_ ellipse: EllipseComponent) -> Result
    mutating func visitRectangle(_ rectangle: RectangleComponent) -> Result
    mutating func visitRoundedRectangle(_ roundedRectangle: RoundedRectangleComponent) -> Result
    mutating func visitCapsule(_ capsule: CapsuleComponent) -> Result
    mutating func visitPath(_ path: PathComponent) -> Result

    // Modifier Components
    mutating func visitAccessibilityHidden(_ accessibilityHidden: AccessibilityHiddenComponent) -> Result
    mutating func visitAccessibilityHint(_ accessibilityHint: AccessibilityHintComponent) -> Result
    mutating func visitAccessibilityLabel(_ accessibilityLabel: AccessibilityLabelComponent) -> Result
    mutating func visitAccessibilityRepresentation(_ accessibilityRepresentation: AccessibilityRepresentationComponent) -> Result
    mutating func visitAccessibilityValue(_ accessibilityValue: AccessibilityValueComponent) -> Result
    mutating func visitAccessibilityAddTraits(_ accessibilityAddTraits: AccessibilityAddTraitsComponent) -> Result
    mutating func visitAccessibilityRemoveTraits(_ accessibilityRemoveTraits: AccessibilityRemoveTraitsComponent) -> Result
    mutating func visitAllowsHitTesting(_ allowsHitTesting: AllowsHitTestingComponent) -> Result
    mutating func visitAllowsTightening(_ allowsTightening: AllowsTighteningComponent) -> Result
    mutating func visitAspectRatio(_ aspectRatio: AspectRatioComponent) -> Result
    mutating func visitAnnotation(_ annotation: AnnotationComponent) -> Result
    mutating func visitBackground(_ background: BackgroundComponent) -> Result
    mutating func visitBadge(_ badge: BadgeComponent) -> Result
    mutating func visitBlendMode(_ blendMode: BlendModeComponent) -> Result
    mutating func visitBlur(_ blur: BlurComponent) -> Result
    mutating func visitBold(_ bold: BoldComponent) -> Result
    mutating func visitBorder(_ border: BorderComponent) -> Result
    mutating func visitBrightness(_ brightness: BrightnessComponent) -> Result
    mutating func visitChartXAxis(_ chartXAxis: ChartXAxisComponent) -> Result
    mutating func visitChartYAxis(_ chartYAxis: ChartYAxisComponent) -> Result
    mutating func visitChartXScale(_ chartXScale: ChartXScaleComponent) -> Result
    mutating func visitChartYScale(_ chartYScale: ChartYScaleComponent) -> Result
    mutating func visitChartForegroundStyleScale(_ chartForegroundStyleScale: ChartForegroundStyleScaleComponent) -> Result
    mutating func visitChartLegend(_ chartLegend: ChartLegendComponent) -> Result
    mutating func visitChartSymbolScale(_ chartSymbolScale: ChartSymbolScaleComponent) -> Result
    mutating func visitChartXAxisLabel(_ chartXAxisLabel: ChartXAxisLabelComponent) -> Result
    mutating func visitChartSelection(_ chartSelection: ChartSelectionComponent) -> Result
    mutating func visitChartXSelection(_ chartXSelection: ChartXSelectionComponent) -> Result
    mutating func visitChartYAxisLabel(_ chartYAxisLabel: ChartYAxisLabelComponent) -> Result
    mutating func visitChartYSelection(_ chartYSelection: ChartYSelectionComponent) -> Result
    mutating func visitClipped(_ clipped: ClippedComponent) -> Result
    mutating func visitClipShape(_ clipShape: ClipShapeComponent) -> Result
    mutating func visitColorInvert(_ colorInvert: ColorInvertComponent) -> Result
    mutating func visitColorScheme(_ colorScheme: ColorSchemeComponent) -> Result
    mutating func visitContentShape(_ contentShape: ContentShapeComponent) -> Result
    mutating func visitContainerRelativeFrame(_ containerRelativeFrame: ContainerRelativeFrameComponent) -> Result
    mutating func visitContentTransition(_ contentTransition: ContentTransitionComponent) -> Result
    mutating func visitContextMenu(_ contextMenu: ContextMenuComponent) -> Result
    mutating func visitContrast(_ contrast: ContrastComponent) -> Result
    mutating func visitControlSize(_ controlSize: ControlSizeComponent) -> Result
    mutating func visitCornerRadius(_ cornerRadius: CornerRadiusComponent) -> Result
    mutating func visitCoordinateSpace(_ coordinateSpace: CoordinateSpaceComponent) -> Result
    mutating func visitDisabled(_ disabled: DisabledComponent) -> Result
    mutating func visitAutocorrectionDisabled(_ autocorrectionDisabled: AutocorrectionDisabledComponent) -> Result
    mutating func visitDynamicTypeSize(_ dynamicTypeSize: DynamicTypeSizeComponent) -> Result
    mutating func visitFixedSize(_ fixedSize: FixedSizeComponent) -> Result
    mutating func visitFlexibleFrame(_ flexibleFrame: FlexibleFrameComponent) -> Result
    mutating func visitFocused(_ focused: FocusedComponent) -> Result
    mutating func visitFont(_ font: FontComponent) -> Result
    mutating func visitCustomFont(_ customFont: CustomFontComponent) -> Result
    mutating func visitFontDesign(_ fontDesign: FontDesignComponent) -> Result
    mutating func visitFontWeight(_ fontWeight: FontWeightComponent) -> Result
    mutating func visitFontWidth(_ fontWidth: FontWidthComponent) -> Result
    mutating func visitForegroundStyle(_ foregroundStyle: ForegroundStyleComponent) -> Result
    mutating func visitFrame(_ frame: FrameComponent) -> Result
    mutating func visitFullScreenCover(_ fullScreenCover: FullScreenCoverComponent) -> Result
    mutating func visitPickerStyle(_ pickerStyle: PickerStyleComponent) -> Result
    #if os(iOS) || os(visionOS)
    mutating func visitGallery(_ gallery: GalleryComponent) -> Result
    mutating func visitGalleryItem(_ galleryItem: GalleryItemComponent) -> Result
    mutating func visitMap(_ map: MapComponent) -> Result
    #endif
    mutating func visitGlassEffect(_ glassEffect: GlassEffectComponent) -> Result
    mutating func visitGridCellAnchor(_ gridCellAnchor: GridCellAnchorComponent) -> Result
    mutating func visitGridCellColumns(_ gridCellColumns: GridCellColumnsComponent) -> Result
    mutating func visitGridCellUnsizedAxes(_ gridCellUnsizedAxes: GridCellUnsizedAxesComponent) -> Result
    mutating func visitGridColumnAlignment(_ gridColumnAlignment: GridColumnAlignmentComponent) -> Result
    mutating func visitGrayscale(_ grayscale: GrayscaleComponent) -> Result
    mutating func visitHidden(_ hidden: HiddenComponent) -> Result
    mutating func visitID(_ id: IDComponent) -> Result
    mutating func visitIgnoresSafeArea(_ ignoresSafeArea: IgnoresSafeAreaComponent) -> Result
    mutating func visitInterpolationMethod(_ interpolationMethod: InterpolationMethodComponent) -> Result
    mutating func visitItalic(_ italic: ItalicComponent) -> Result
    mutating func visitLayoutPriority(_ layoutPriority: LayoutPriorityComponent) -> Result
    mutating func visitListRowBackground(_ listRowBackground: ListRowBackgroundComponent) -> Result
    mutating func visitListRowSeparator(_ listRowSeparator: ListRowSeparatorComponent) -> Result
    mutating func visitListStyle(_ listStyle: ListStyleComponent) -> Result
    mutating func visitLineLimit(_ lineLimit: LineLimitComponent) -> Result
    mutating func visitLineSpacing(_ lineSpacing: LineSpacingComponent) -> Result
    mutating func visitLineStyle(_ lineStyle: LineStyleComponent) -> Result
    mutating func visitMask(_ mask: MaskComponent) -> Result
    mutating func visitMinimumScaleFactor(_ minimumScaleFactor: MinimumScaleFactorComponent) -> Result
    mutating func visitMonospaced(_ monospaced: MonospacedComponent) -> Result
    mutating func visitMultilineTextAlignment(_ multilineTextAlignment: MultilineTextAlignmentComponent) -> Result
    mutating func visitNavigationBarBackButtonHidden(_ navigationBarBackButtonHidden: NavigationBarBackButtonHiddenComponent) -> Result
    mutating func visitNavigationBarTitleDisplayMode(_ navigationBarTitleDisplayMode: NavigationBarTitleDisplayModeComponent) -> Result
    mutating func visitNavigationDestination(_ navigationDestination: NavigationDestinationComponent) -> Result
    mutating func visitNavigationTitle(_ navigationTitle: NavigationTitleComponent) -> Result
    mutating func visitOffset(_ offset: OffsetComponent) -> Result
    mutating func visitOnAppear(_ onAppear: OnAppearComponent) -> Result
    mutating func visitOnChange(_ onChange: OnChangeComponent) -> Result
    mutating func visitOnDisappear(_ onDisappear: OnDisappearComponent) -> Result
    mutating func visitOnDragGesture(_ onDragGesture: OnDragGestureComponent) -> Result
    mutating func visitOnLongPressGesture(_ onLongPressGesture: OnLongPressGestureComponent) -> Result
    mutating func visitOnTapGesture(_ onTapGesture: OnTapGestureComponent) -> Result
    mutating func visitOnSubmit(_ onSubmit: OnSubmitComponent) -> Result
    mutating func visitOpacity(_ opacity: OpacityComponent) -> Result
    mutating func visitOverlay(_ overlay: OverlayComponent) -> Result
    mutating func visitPadding(_ padding: PaddingComponent) -> Result
    mutating func visitPresentationDetents(_ presentationDetents: PresentationDetentsComponent) -> Result
    mutating func visitQuickLookPreview(_ quickLookPreview: QuickLookComponent) -> Result
    mutating func visitRotationEffect(_ rotationEffect: RotationEffectComponent) -> Result
    mutating func visitSaturation(_ saturation: SaturationComponent) -> Result
    mutating func visitScaleEffect(_ scaleEffect: ScaleEffectComponent) -> Result
    mutating func visitScaledToFill(_ scaledToFill: ScaledToFillComponent) -> Result
    mutating func visitScaledToFit(_ scaledToFit: ScaledToFitComponent) -> Result
    mutating func visitShadow(_ shadow: ShadowComponent) -> Result
    mutating func visitSheet(_ sheet: SheetComponent) -> Result
    mutating func visitStrikethrough(_ strikethrough: StrikethroughComponent) -> Result
    mutating func visitSymbol(_ symbol: SymbolComponent) -> Result
    mutating func visitSymbolSize(_ symbolSize: SymbolSizeComponent) -> Result
    mutating func visitTag(_ tag: TagComponent) -> Result
    mutating func visitTextCase(_ textCase: TextCaseComponent) -> Result
    mutating func visitTextSelection(_ textSelection: TextSelectionComponent) -> Result
    mutating func visitTextFieldStyle(_ textFieldStyle: TextFieldStyleComponent) -> Result
    mutating func visitTint(_ tint: TintComponent) -> Result
    mutating func visitToolbar(_ toolbar: ToolbarComponent) -> Result
    mutating func visitToolbarVisibility(_ toolbarVisibility: ToolbarVisibilityComponent) -> Result
    mutating func visitTracking(_ tracking: TrackingComponent) -> Result
    mutating func visitTransformEffect(_ transformEffect: TransformEffectComponent) -> Result
    mutating func visitTransition(_ transition: TransitionComponent) -> Result
    mutating func visitUnderline(_ underline: UnderlineComponent) -> Result
    mutating func visitVisualEffect(_ visualEffect: VisualEffectComponent) -> Result
    mutating func visitKeyboardType(_ keyboardType: KeyboardTypeComponent) -> Result
    mutating func visitSafeAreaInset(_ safeAreaInset: SafeAreaInsetComponent) -> Result
    mutating func visitScrollContentBackground(_ scrollContentBackground: ScrollContentBackgroundComponent) -> Result
    mutating func visitScrollEdgeEffectHidden(_ scrollEdgeEffectHidden: ScrollEdgeEffectHiddenComponent) -> Result
    mutating func visitScrollEdgeEffectStyle(_ scrollEdgeEffectStyle: ScrollEdgeEffectStyleComponent) -> Result
    mutating func visitScrollIndicators(_ scrollIndicators: ScrollIndicatorsComponent) -> Result
    mutating func visitScrollPosition(_ scrollPosition: ScrollPositionComponent) -> Result
    mutating func visitScrollTargetBehavior(_ scrollTargetBehavior: ScrollTargetBehaviorComponent) -> Result
    mutating func visitScrollTargetLayout(_ scrollTargetLayout: ScrollTargetLayoutComponent) -> Result
    mutating func visitSensoryFeedback(_ sensoryFeedback: SensoryFeedbackComponent) -> Result
    mutating func visitSubmitLabel(_ submitLabel: SubmitLabelComponent) -> Result
    mutating func visitZIndex(_ zIndex: ZIndexComponent) -> Result
}

public extension ComponentVisitor {
    // Default visit is left out of the extension so that the compiler forces implementation of it in concrete conformances
    
    mutating func visit(_ component: any Component) -> Result {
        return component.accept(visitor: &self)
    }
    
    // Views Components Default Implementations
    mutating func visitButton(_ button: ButtonComponent) -> Result {
        return defaultVisit(button)
    }

    mutating func visitChart(_ chart: ChartComponent) -> Result {
        return defaultVisit(chart)
    }

    mutating func visitPieChart(_ pieChart: PieChartComponent) -> Result {
        return defaultVisit(pieChart)
    }

    mutating func visitBarMark(_ barMark: BarMarkComponent) -> Result {
        return defaultVisit(barMark)
    }

    mutating func visitLineMark(_ lineMark: LineMarkComponent) -> Result {
        return defaultVisit(lineMark)
    }

    mutating func visitAreaMark(_ areaMark: AreaMarkComponent) -> Result {
        return defaultVisit(areaMark)
    }

    mutating func visitPointMark(_ pointMark: PointMarkComponent) -> Result {
        return defaultVisit(pointMark)
    }

    mutating func visitRuleMark(_ ruleMark: RuleMarkComponent) -> Result {
        return defaultVisit(ruleMark)
    }

    mutating func visitRectangleMark(_ rectangleMark: RectangleMarkComponent) -> Result {
        return defaultVisit(rectangleMark)
    }

    mutating func visitPieSliceMark(_ pieSliceMark: PieSliceMarkComponent) -> Result {
        return defaultVisit(pieSliceMark)
    }
    
    mutating func visitCall(_ call: ComponentCall) -> Result {
        return defaultVisit(call)
    }
    
    mutating func visitColor(_ color: ColorComponent) -> Result {
        return defaultVisit(color)
    }

    mutating func visitContentUnavailableView(_ contentUnavailableView: ContentUnavailableViewComponent) -> Result {
        return defaultVisit(contentUnavailableView)
    }

    mutating func visitDivider(_ divider: DividerComponent) -> Result {
        return defaultVisit(divider)
    }
    
    mutating func visitForEach(_ forEach: ForEachComponent) -> Result {
        return defaultVisit(forEach)
    }

    mutating func visitGeometryReader(_ geometryReader: GeometryReaderComponent) -> Result {
        return defaultVisit(geometryReader)
    }

    mutating func visitGrid(_ grid: GridComponent) -> Result {
        return defaultVisit(grid)
    }

    mutating func visitGridRow(_ gridRow: GridRowComponent) -> Result {
        return defaultVisit(gridRow)
    }

    mutating func visitGroup(_ group: GroupComponent) -> Result {
        return defaultVisit(group)
    }

    mutating func visitHStack(_ hStack: HStackComponent) -> Result {
        return defaultVisit(hStack)
    }

    mutating func visitLazyHStack(_ lazyHStack: LazyHStackComponent) -> Result {
        return defaultVisit(lazyHStack)
    }

    mutating func visitLazyVStack(_ lazyVStack: LazyVStackComponent) -> Result {
        return defaultVisit(lazyVStack)
    }
    
    mutating func visitLabel(_ label: LabelComponent) -> Result {
        return defaultVisit(label)
    }

    mutating func visitImage(_ image: ImageComponent) -> Result {
        return defaultVisit(image)
    }

    mutating func visitList(_ list: ListComponent) -> Result {
        return defaultVisit(list)
    }
    
    mutating func visitMenu(_ menu: MenuComponent) -> Result {
        return defaultVisit(menu)
    }

    mutating func visitMaterial(_ material: MaterialComponent) -> Result {
        return defaultVisit(material)
    }
    
    mutating func visitModel3D(_ model3D: Model3DComponent) -> Result {
        return defaultVisit(model3D)
    }
    
    mutating func visitModified(_ modified: ModifiedComponent) -> Result {
        return defaultVisit(modified)
    }
    
    mutating func visitNavigationLink(_ navigationLink: NavigationLinkComponent) -> Result {
        return defaultVisit(navigationLink)
    }

    mutating func visitNavigationStack(_ navigationStack: NavigationStackComponent) -> Result {
        return defaultVisit(navigationStack)
    }
    
    mutating func visitEmpty(_ empty: EmptyComponent) -> Result {
        return defaultVisit(empty)
    }
    
    mutating func visitPicker(_ picker: PickerComponent) -> Result {
        return defaultVisit(picker)
    }
    
    mutating func visitPlaceholder(_ placeholder: PlaceholderComponent) -> Result {
        return defaultVisit(placeholder)
    }
    
    mutating func visitProgressView(_ progressView: ProgressViewComponent) -> Result {
        return defaultVisit(progressView)
    }
    
    mutating func visitScrollView(_ scrollView: ScrollViewComponent) -> Result {
        return defaultVisit(scrollView)
    }
    
    mutating func visitSection(_ section: SectionComponent) -> Result {
        return defaultVisit(section)
    }
    
    mutating func visitSpacer(_ spacer: SpacerComponent) -> Result {
        return defaultVisit(spacer)
    }
    
    mutating func visitText(_ text: TextComponent) -> Result {
        return defaultVisit(text)
    }
    
    mutating func visitTextEditor(_ textEditor: TextEditorComponent) -> Result {
        return defaultVisit(textEditor)
    }

    mutating func visitTextField(_ textField: TextFieldComponent) -> Result {
        return defaultVisit(textField)
    }

    mutating func visitSecureField(_ secureField: SecureFieldComponent) -> Result {
        return defaultVisit(secureField)
    }

    mutating func visitToggle(_ toggle: ToggleComponent) -> Result {
        return defaultVisit(toggle)
    }
    
    mutating func visitToolbarItem(_ toolbarItem: ToolbarItemComponent) -> Result {
        return defaultVisit(toolbarItem)
    }
    
    mutating func visitToolbarItemGroup(_ toolbarItemGroup: ToolbarItemGroupComponent) -> Result {
        return defaultVisit(toolbarItemGroup)
    }

    mutating func visitUnresolved(_ unresolved: UnresolvedComponent) -> Result {
        return defaultVisit(unresolved)
    }

    mutating func visitViewThatFits(_ viewThatFits: ViewThatFitsComponent) -> Result {
        return defaultVisit(viewThatFits)
    }

    mutating func visitVStack(_ vStack: VStackComponent) -> Result {
        return defaultVisit(vStack)
    }
    
    mutating func visitVideo(_ video: VideoComponent) -> Result {
        return defaultVisit(video)
    }
    
    mutating func visitZStack(_ zStack: ZStackComponent) -> Result {
        return defaultVisit(zStack)
    }
    
    // Gradient Components Default Implementations
    mutating func visitLinearGradient(_ linearGradient: LinearGradientComponent) -> Result {
        return defaultVisit(linearGradient)
    }
    
    mutating func visitAngularGradient(_ angularGradient: AngularGradientComponent) -> Result {
        return defaultVisit(angularGradient)
    }
    
    mutating func visitRadialGradient(_ radialGradient: RadialGradientComponent) -> Result {
        return defaultVisit(radialGradient)
    }
    
    mutating func visitEllipticalGradient(_ ellipticalGradient: EllipticalGradientComponent) -> Result {
        return defaultVisit(ellipticalGradient)
    }
    
    // Shape Components Default Implementations
    mutating func visitCircle(_ circle: CircleComponent) -> Result {
        return defaultVisit(circle)
    }
    
    mutating func visitEllipse(_ ellipse: EllipseComponent) -> Result {
        return defaultVisit(ellipse)
    }
    
    mutating func visitRectangle(_ rectangle: RectangleComponent) -> Result {
        return defaultVisit(rectangle)
    }
    
    mutating func visitRoundedRectangle(_ roundedRectangle: RoundedRectangleComponent) -> Result {
        return defaultVisit(roundedRectangle)
    }
    
    mutating func visitCapsule(_ capsule: CapsuleComponent) -> Result {
        return defaultVisit(capsule)
    }

    mutating func visitPath(_ path: PathComponent) -> Result {
        return defaultVisit(path)
    }

    // Modifier Components Default Implementations
    mutating func visitAccessibilityHidden(_ accessibilityHidden: AccessibilityHiddenComponent) -> Result {
        return defaultVisit(accessibilityHidden)
    }
    
    mutating func visitAccessibilityHint(_ accessibilityHint: AccessibilityHintComponent) -> Result {
        return defaultVisit(accessibilityHint)
    }
    
    mutating func visitAccessibilityLabel(_ accessibilityLabel: AccessibilityLabelComponent) -> Result {
        return defaultVisit(accessibilityLabel)
    }
    
    mutating func visitAccessibilityRepresentation(_ accessibilityRepresentation: AccessibilityRepresentationComponent) -> Result {
        return defaultVisit(accessibilityRepresentation)
    }
    
    mutating func visitAccessibilityValue(_ accessibilityValue: AccessibilityValueComponent) -> Result {
        return defaultVisit(accessibilityValue)
    }
    
    mutating func visitAccessibilityAddTraits(_ accessibilityAddTraits: AccessibilityAddTraitsComponent) -> Result {
        return defaultVisit(accessibilityAddTraits)
    }
    
    mutating func visitAccessibilityRemoveTraits(_ accessibilityRemoveTraits: AccessibilityRemoveTraitsComponent) -> Result {
        return defaultVisit(accessibilityRemoveTraits)
    }
    
    mutating func visitAllowsHitTesting(_ allowsHitTesting: AllowsHitTestingComponent) -> Result {
        return defaultVisit(allowsHitTesting)
    }
    
    mutating func visitAllowsTightening(_ allowsTightening: AllowsTighteningComponent) -> Result {
        return defaultVisit(allowsTightening)
    }
    
    mutating func visitAspectRatio(_ aspectRatio: AspectRatioComponent) -> Result {
        return defaultVisit(aspectRatio)
    }

    mutating func visitAnnotation(_ annotation: AnnotationComponent) -> Result {
        return defaultVisit(annotation)
    }
    
    mutating func visitBackground(_ background: BackgroundComponent) -> Result {
        return defaultVisit(background)
    }

    mutating func visitBadge(_ badge: BadgeComponent) -> Result {
        return defaultVisit(badge)
    }

    mutating func visitBlendMode(_ blendMode: BlendModeComponent) -> Result {
        return defaultVisit(blendMode)
    }
    
    mutating func visitBlur(_ blur: BlurComponent) -> Result {
        return defaultVisit(blur)
    }
    
    mutating func visitBold(_ bold: BoldComponent) -> Result {
        return defaultVisit(bold)
    }
    
    mutating func visitBorder(_ border: BorderComponent) -> Result {
        return defaultVisit(border)
    }
    
    mutating func visitBrightness(_ brightness: BrightnessComponent) -> Result {
        return defaultVisit(brightness)
    }

    mutating func visitChartXAxis(_ chartXAxis: ChartXAxisComponent) -> Result {
        return defaultVisit(chartXAxis)
    }

    mutating func visitChartYAxis(_ chartYAxis: ChartYAxisComponent) -> Result {
        return defaultVisit(chartYAxis)
    }

    mutating func visitChartXScale(_ chartXScale: ChartXScaleComponent) -> Result {
        return defaultVisit(chartXScale)
    }

    mutating func visitChartYScale(_ chartYScale: ChartYScaleComponent) -> Result {
        return defaultVisit(chartYScale)
    }

    mutating func visitChartForegroundStyleScale(_ chartForegroundStyleScale: ChartForegroundStyleScaleComponent) -> Result {
        return defaultVisit(chartForegroundStyleScale)
    }

    mutating func visitChartLegend(_ chartLegend: ChartLegendComponent) -> Result {
        return defaultVisit(chartLegend)
    }

    mutating func visitChartSymbolScale(_ chartSymbolScale: ChartSymbolScaleComponent) -> Result {
        return defaultVisit(chartSymbolScale)
    }

    mutating func visitChartXAxisLabel(_ chartXAxisLabel: ChartXAxisLabelComponent) -> Result {
        return defaultVisit(chartXAxisLabel)
    }

    mutating func visitChartSelection(_ chartSelection: ChartSelectionComponent) -> Result {
        return defaultVisit(chartSelection)
    }

    mutating func visitChartXSelection(_ chartXSelection: ChartXSelectionComponent) -> Result {
        return defaultVisit(chartXSelection)
    }

    mutating func visitChartYAxisLabel(_ chartYAxisLabel: ChartYAxisLabelComponent) -> Result {
        return defaultVisit(chartYAxisLabel)
    }

    mutating func visitChartYSelection(_ chartYSelection: ChartYSelectionComponent) -> Result {
        return defaultVisit(chartYSelection)
    }
    
    mutating func visitClipped(_ clipped: ClippedComponent) -> Result {
        return defaultVisit(clipped)
    }
    
    mutating func visitClipShape(_ clipShape: ClipShapeComponent) -> Result {
        return defaultVisit(clipShape)
    }
    
    mutating func visitColorInvert(_ colorInvert: ColorInvertComponent) -> Result {
        return defaultVisit(colorInvert)
    }
    
    mutating func visitColorScheme(_ colorScheme: ColorSchemeComponent) -> Result {
        return defaultVisit(colorScheme)
    }
    
    mutating func visitContentShape(_ contentShape: ContentShapeComponent) -> Result {
        return defaultVisit(contentShape)
    }

    mutating func visitContainerRelativeFrame(_ containerRelativeFrame: ContainerRelativeFrameComponent) -> Result {
        return defaultVisit(containerRelativeFrame)
    }

    mutating func visitContentTransition(_ contentTransition: ContentTransitionComponent) -> Result {
        return defaultVisit(contentTransition)
    }

    mutating func visitContextMenu(_ contextMenu: ContextMenuComponent) -> Result {
        return defaultVisit(contextMenu)
    }

    mutating func visitContrast(_ contrast: ContrastComponent) -> Result {
        return defaultVisit(contrast)
    }
    
    mutating func visitControlSize(_ controlSize: ControlSizeComponent) -> Result {
        return defaultVisit(controlSize)
    }
    
    mutating func visitCornerRadius(_ cornerRadius: CornerRadiusComponent) -> Result {
        return defaultVisit(cornerRadius)
    }
    
    mutating func visitCoordinateSpace(_ coordinateSpace: CoordinateSpaceComponent) -> Result {
        return defaultVisit(coordinateSpace)
    }
    
    mutating func visitDisabled(_ disabled: DisabledComponent) -> Result {
        return defaultVisit(disabled)
    }
    
    mutating func visitAutocorrectionDisabled(_ autocorrectionDisabled: AutocorrectionDisabledComponent) -> Result {
        return defaultVisit(autocorrectionDisabled)
    }
    
    mutating func visitDynamicTypeSize(_ dynamicTypeSize: DynamicTypeSizeComponent) -> Result {
        return defaultVisit(dynamicTypeSize)
    }
    
    mutating func visitFixedSize(_ fixedSize: FixedSizeComponent) -> Result {
        return defaultVisit(fixedSize)
    }
    
    mutating func visitFlexibleFrame(_ flexibleFrame: FlexibleFrameComponent) -> Result {
        return defaultVisit(flexibleFrame)
    }
    
    mutating func visitFocused(_ focused: FocusedComponent) -> Result {
        return defaultVisit(focused)
    }
    
    mutating func visitFont(_ font: FontComponent) -> Result {
        return defaultVisit(font)
    }
    
    mutating func visitCustomFont(_ customFont: CustomFontComponent) -> Result {
        return defaultVisit(customFont)
    }
    
    mutating func visitFontDesign(_ fontDesign: FontDesignComponent) -> Result {
        return defaultVisit(fontDesign)
    }
    
    mutating func visitFontWeight(_ fontWeight: FontWeightComponent) -> Result {
        return defaultVisit(fontWeight)
    }
    
    mutating func visitFontWidth(_ fontWidth: FontWidthComponent) -> Result {
        return defaultVisit(fontWidth)
    }
    
    mutating func visitForegroundStyle(_ foregroundStyle: ForegroundStyleComponent) -> Result {
        return defaultVisit(foregroundStyle)
    }
    
    mutating func visitFrame(_ frame: FrameComponent) -> Result {
        return defaultVisit(frame)
    }
    
    mutating func visitPickerStyle(_ pickerStyle: PickerStyleComponent) -> Result {
        return defaultVisit(pickerStyle)
    }

    #if os(iOS) || os(visionOS)
    mutating func visitGallery(_ gallery: GalleryComponent) -> Result {
        return defaultVisit(gallery)
    }

    mutating func visitGalleryItem(_ galleryItem: GalleryItemComponent) -> Result {
        return defaultVisit(galleryItem)
    }

    mutating func visitMap(_ map: MapComponent) -> Result {
        return defaultVisit(map)
    }
    #endif

    mutating func visitGlassEffect(_ glassEffect: GlassEffectComponent) -> Result {
        return defaultVisit(glassEffect)
    }

    mutating func visitGridCellAnchor(_ gridCellAnchor: GridCellAnchorComponent) -> Result {
        return defaultVisit(gridCellAnchor)
    }

    mutating func visitGridCellColumns(_ gridCellColumns: GridCellColumnsComponent) -> Result {
        return defaultVisit(gridCellColumns)
    }

    mutating func visitGridCellUnsizedAxes(_ gridCellUnsizedAxes: GridCellUnsizedAxesComponent) -> Result {
        return defaultVisit(gridCellUnsizedAxes)
    }

    mutating func visitGridColumnAlignment(_ gridColumnAlignment: GridColumnAlignmentComponent) -> Result {
        return defaultVisit(gridColumnAlignment)
    }

    mutating func visitGrayscale(_ grayscale: GrayscaleComponent) -> Result {
        return defaultVisit(grayscale)
    }
    
    mutating func visitHidden(_ hidden: HiddenComponent) -> Result {
        return defaultVisit(hidden)
    }
    
    mutating func visitID(_ id: IDComponent) -> Result {
        return defaultVisit(id)
    }
    
    mutating func visitIgnoresSafeArea(_ ignoresSafeArea: IgnoresSafeAreaComponent) -> Result {
        return defaultVisit(ignoresSafeArea)
    }

    mutating func visitInterpolationMethod(_ interpolationMethod: InterpolationMethodComponent) -> Result {
        return defaultVisit(interpolationMethod)
    }
    
    mutating func visitItalic(_ italic: ItalicComponent) -> Result {
        return defaultVisit(italic)
    }
    
    mutating func visitLayoutPriority(_ layoutPriority: LayoutPriorityComponent) -> Result {
        return defaultVisit(layoutPriority)
    }

    mutating func visitListRowBackground(_ listRowBackground: ListRowBackgroundComponent) -> Result {
        return defaultVisit(listRowBackground)
    }

    mutating func visitListRowSeparator(_ listRowSeparator: ListRowSeparatorComponent) -> Result {
        return defaultVisit(listRowSeparator)
    }

    mutating func visitListStyle(_ listStyle: ListStyleComponent) -> Result {
        return defaultVisit(listStyle)
    }

    mutating func visitLineLimit(_ lineLimit: LineLimitComponent) -> Result {
        return defaultVisit(lineLimit)
    }
    
    mutating func visitLineSpacing(_ lineSpacing: LineSpacingComponent) -> Result {
        return defaultVisit(lineSpacing)
    }

    mutating func visitLineStyle(_ lineStyle: LineStyleComponent) -> Result {
        return defaultVisit(lineStyle)
    }

    mutating func visitMask(_ mask: MaskComponent) -> Result {
        return defaultVisit(mask)
    }

    mutating func visitMinimumScaleFactor(_ minimumScaleFactor: MinimumScaleFactorComponent) -> Result {
        return defaultVisit(minimumScaleFactor)
    }
    
    mutating func visitMonospaced(_ monospaced: MonospacedComponent) -> Result {
        return defaultVisit(monospaced)
    }
    
    mutating func visitMultilineTextAlignment(_ multilineTextAlignment: MultilineTextAlignmentComponent) -> Result {
        return defaultVisit(multilineTextAlignment)
    }

    mutating func visitNavigationBarBackButtonHidden(_ navigationBarBackButtonHidden: NavigationBarBackButtonHiddenComponent) -> Result {
        return defaultVisit(navigationBarBackButtonHidden)
    }

    mutating func visitNavigationBarTitleDisplayMode(_ navigationBarTitleDisplayMode: NavigationBarTitleDisplayModeComponent) -> Result {
        return defaultVisit(navigationBarTitleDisplayMode)
    }

    mutating func visitNavigationDestination(_ navigationDestination: NavigationDestinationComponent) -> Result {
        return defaultVisit(navigationDestination)
    }

    mutating func visitNavigationTitle(_ navigationTitle: NavigationTitleComponent) -> Result {
        return defaultVisit(navigationTitle)
    }
    
    mutating func visitOffset(_ offset: OffsetComponent) -> Result {
        return defaultVisit(offset)
    }
    
    mutating func visitOnAppear(_ onAppear: OnAppearComponent) -> Result {
        return defaultVisit(onAppear)
    }

    mutating func visitOnChange(_ onChange: OnChangeComponent) -> Result {
        return defaultVisit(onChange)
    }

    mutating func visitOnDisappear(_ onDisappear: OnDisappearComponent) -> Result {
        return defaultVisit(onDisappear)
    }
    
    mutating func visitOnDragGesture(_ onDragGesture: OnDragGestureComponent) -> Result {
        return defaultVisit(onDragGesture)
    }
    
    mutating func visitOnLongPressGesture(_ onLongPressGesture: OnLongPressGestureComponent) -> Result {
        return defaultVisit(onLongPressGesture)
    }
    
    mutating func visitOnTapGesture(_ onTapGesture: OnTapGestureComponent) -> Result {
        return defaultVisit(onTapGesture)
    }
    
    mutating func visitOnSubmit(_ onSubmit: OnSubmitComponent) -> Result {
        return defaultVisit(onSubmit)
    }
    
    mutating func visitOpacity(_ opacity: OpacityComponent) -> Result {
        return defaultVisit(opacity)
    }
    
    mutating func visitOverlay(_ overlay: OverlayComponent) -> Result {
        return defaultVisit(overlay)
    }
    
    mutating func visitPadding(_ padding: PaddingComponent) -> Result {
        return defaultVisit(padding)
    }
    
    mutating func visitPresentationDetents(_ presentationDetents: PresentationDetentsComponent) -> Result {
        return defaultVisit(presentationDetents)
    }
    
    mutating func visitQuickLookPreview(_ quickLookPreview: QuickLookComponent) -> Result {
        return defaultVisit(quickLookPreview)
    }
    
    mutating func visitRotationEffect(_ rotationEffect: RotationEffectComponent) -> Result {
        return defaultVisit(rotationEffect)
    }
    
    mutating func visitSaturation(_ saturation: SaturationComponent) -> Result {
        return defaultVisit(saturation)
    }
    
    mutating func visitScaleEffect(_ scaleEffect: ScaleEffectComponent) -> Result {
        return defaultVisit(scaleEffect)
    }
    
    mutating func visitScaledToFill(_ scaledToFill: ScaledToFillComponent) -> Result {
        return defaultVisit(scaledToFill)
    }
    
    mutating func visitScaledToFit(_ scaledToFit: ScaledToFitComponent) -> Result {
        return defaultVisit(scaledToFit)
    }
    
    mutating func visitShadow(_ shadow: ShadowComponent) -> Result {
        return defaultVisit(shadow)
    }

    mutating func visitFullScreenCover(_ fullScreenCover: FullScreenCoverComponent) -> Result {
        return defaultVisit(fullScreenCover)
    }

    mutating func visitSheet(_ sheet: SheetComponent) -> Result {
        return defaultVisit(sheet)
    }
    
    mutating func visitStrikethrough(_ strikethrough: StrikethroughComponent) -> Result {
        return defaultVisit(strikethrough)
    }

    mutating func visitSymbol(_ symbol: SymbolComponent) -> Result {
        return defaultVisit(symbol)
    }

    mutating func visitSymbolSize(_ symbolSize: SymbolSizeComponent) -> Result {
        return defaultVisit(symbolSize)
    }
    
    mutating func visitTag(_ tag: TagComponent) -> Result {
        return defaultVisit(tag)
    }
    
    mutating func visitTextCase(_ textCase: TextCaseComponent) -> Result {
        return defaultVisit(textCase)
    }
    
    mutating func visitTextSelection(_ textSelection: TextSelectionComponent) -> Result {
        return defaultVisit(textSelection)
    }
    
    mutating func visitTextFieldStyle(_ textFieldStyle: TextFieldStyleComponent) -> Result {
        return defaultVisit(textFieldStyle)
    }
    
    mutating func visitTint(_ tint: TintComponent) -> Result {
        return defaultVisit(tint)
    }

    mutating func visitToolbar(_ toolbar: ToolbarComponent) -> Result {
        return defaultVisit(toolbar)
    }

    mutating func visitToolbarVisibility(_ toolbarVisibility: ToolbarVisibilityComponent) -> Result {
        return defaultVisit(toolbarVisibility)
    }

    mutating func visitTracking(_ tracking: TrackingComponent) -> Result {
        return defaultVisit(tracking)
    }
    
    mutating func visitTransformEffect(_ transformEffect: TransformEffectComponent) -> Result {
        return defaultVisit(transformEffect)
    }

    mutating func visitTransition(_ transition: TransitionComponent) -> Result {
        return defaultVisit(transition)
    }

    mutating func visitUnderline(_ underline: UnderlineComponent) -> Result {
        return defaultVisit(underline)
    }
    
    mutating func visitVisualEffect(_ visualEffect: VisualEffectComponent) -> Result {
        return defaultVisit(visualEffect)
    }
    
    mutating func visitKeyboardType(_ keyboardType: KeyboardTypeComponent) -> Result {
        return defaultVisit(keyboardType)
    }
    
    mutating func visitSafeAreaInset(_ safeAreaInset: SafeAreaInsetComponent) -> Result {
        return defaultVisit(safeAreaInset)
    }

    mutating func visitScrollContentBackground(_ scrollContentBackground: ScrollContentBackgroundComponent) -> Result {
        return defaultVisit(scrollContentBackground)
    }

    mutating func visitScrollEdgeEffectHidden(_ scrollEdgeEffectHidden: ScrollEdgeEffectHiddenComponent) -> Result {
        return defaultVisit(scrollEdgeEffectHidden)
    }
    
    mutating func visitScrollEdgeEffectStyle(_ scrollEdgeEffectStyle: ScrollEdgeEffectStyleComponent) -> Result {
        return defaultVisit(scrollEdgeEffectStyle)
    }

    mutating func visitScrollIndicators(_ scrollIndicators: ScrollIndicatorsComponent) -> Result {
        return defaultVisit(scrollIndicators)
    }

    mutating func visitScrollPosition(_ scrollPosition: ScrollPositionComponent) -> Result {
        return defaultVisit(scrollPosition)
    }

    mutating func visitScrollTargetBehavior(_ scrollTargetBehavior: ScrollTargetBehaviorComponent) -> Result {
        return defaultVisit(scrollTargetBehavior)
    }

    mutating func visitScrollTargetLayout(_ scrollTargetLayout: ScrollTargetLayoutComponent) -> Result {
        return defaultVisit(scrollTargetLayout)
    }

    mutating func visitSensoryFeedback(_ sensoryFeedback: SensoryFeedbackComponent) -> Result {
        return defaultVisit(sensoryFeedback)
    }

    mutating func visitSubmitLabel(_ submitLabel: SubmitLabelComponent) -> Result {
        return defaultVisit(submitLabel)
    }
    
    mutating func visitZIndex(_ zIndex: ZIndexComponent) -> Result {
        return defaultVisit(zIndex)
    }
}
