public extension Component {
    var componentChildren: [any Component] {
        var visitor = ComponentChildren()
        return visitor.visit(self)
    }
}

private struct ComponentChildren: ComponentVisitor {
    
    func defaultVisit(_ component: any Component) -> [any Component] {
        []
    }
    
    mutating func visitButton(_ button: ButtonComponent) -> [any Component] {
        [button.label]
    }

    mutating func visitChart(_ chart: ChartComponent) -> [any Component] {
        chart.children
    }

    mutating func visitPieChart(_ pieChart: PieChartComponent) -> [any Component] {
        pieChart.children
    }
    
    mutating func visitCall(_ call: ComponentCall) -> [any Component] {
        call.children
    }

    mutating func visitContentUnavailableView(_ contentUnavailableView: ContentUnavailableViewComponent) -> [any Component] {
        var children: [any Component] = []
        if let label = contentUnavailableView.label { children.append(label) }
        if let title = contentUnavailableView.title { children.append(title) }
        if let description = contentUnavailableView.description { children.append(description) }
        children.append(contentsOf: contentUnavailableView.actions)
        return children
    }
    
    mutating func visitGrid(_ grid: GridComponent) -> [any Component] {
        grid.children
    }

    mutating func visitGridRow(_ gridRow: GridRowComponent) -> [any Component] {
        gridRow.children
    }

    mutating func visitGroup(_ group: GroupComponent) -> [any Component] {
        group.content
    }

    mutating func visitHStack(_ hStack: HStackComponent) -> [any Component] {
        hStack.children
    }
    
    mutating func visitModified(_ modified: ModifiedComponent) -> [any Component] {
        modified.content + [modified.modifier]
    }
    
    mutating func visitPicker(_ picker: PickerComponent) -> [any Component] {
        picker.children
    }
    
    mutating func visitScrollView(_ scrollView: ScrollViewComponent) -> [any Component] {
        scrollView.content
    }
    
    mutating func visitSection(_ section: SectionComponent) -> [any Component] {
        var children = section.content
        if let header = section.header {
            children.append(header)
        }
        if let footer = section.footer {
            children.append(footer)
        }
        return children
    }
    
    mutating func visitUnresolved(_ unresolved: UnresolvedComponent) -> [any Component] {
        unresolved.children
    }
    
    mutating func visitViewThatFits(_ viewThatFits: ViewThatFitsComponent) -> [any Component] {
        viewThatFits.children
    }

    mutating func visitVStack(_ vStack: VStackComponent) -> [any Component] {
        vStack.children
    }
    
    mutating func visitZStack(_ zStack: ZStackComponent) -> [any Component] {
        zStack.children
    }
    
    mutating func visitCircle(_ circle: CircleComponent) -> [any Component] {
        switch circle.style {
        case .fill(let component):
            return [component]
        case .stroke(let component, _):
            return [component]
        case .none:
            return []
        }
    }
    
    mutating func visitEllipse(_ ellipse: EllipseComponent) -> [any Component] {
        switch ellipse.style {
        case .fill(let component):
            return [component]
        case .stroke(let component, _):
            return [component]
        case .none:
            return []
        }
    }
    
    mutating func visitRectangle(_ rectangle: RectangleComponent) -> [any Component] {
        switch rectangle.style {
        case .fill(let component):
            return [component]
        case .stroke(let component, _):
            return [component]
        case .none:
            return []
        }
    }
    
    mutating func visitRoundedRectangle(_ roundedRectangle: RoundedRectangleComponent) -> [any Component] {
        switch roundedRectangle.style {
        case .fill(let component):
            return [component]
        case .stroke(let component, _):
            return [component]
        case .none:
            return []
        }
    }
    
    mutating func visitCapsule(_ capsule: CapsuleComponent) -> [any Component] {
        switch capsule.style {
        case .fill(let component):
            return [component]
        case .stroke(let component, _):
            return [component]
        case .none:
            return []
        }
    }

    mutating func visitPath(_ path: PathComponent) -> [any Component] {
        switch path.style {
        case .fill(let component):
            return [component]
        case .stroke(let component, _):
            return [component]
        case .none:
            return []
        }
    }
    
    mutating func visitAccessibilityRepresentation(_ accessibilityRepresentation: AccessibilityRepresentationComponent) -> [any Component] {
        [accessibilityRepresentation.representation]
    }
    
    mutating func visitBackground(_ background: BackgroundComponent) -> [any Component] {
        [background.content]
    }

    mutating func visitListRowBackground(_ listRowBackground: ListRowBackgroundComponent) -> [any Component] {
        [listRowBackground.content]
    }
    
    mutating func visitBorder(_ border: BorderComponent) -> [any Component] {
        [border.style]
    }
    
    mutating func visitForegroundStyle(_ foregroundStyle: ForegroundStyleComponent) -> [any Component] {
        [foregroundStyle.style]
    }
    
    mutating func visitOverlay(_ overlay: OverlayComponent) -> [any Component] {
        [overlay.content]
    }

    mutating func visitSafeAreaInset(_ safeAreaInset: SafeAreaInsetComponent) -> [any Component] {
        [safeAreaInset.content]
    }

    mutating func visitNavigationStack(_ navigationStack: NavigationStackComponent) -> [any Component] {
        navigationStack.children
    }

    mutating func visitLazyVStack(_ lazyVStack: LazyVStackComponent) -> [any Component] {
        lazyVStack.children
    }

    mutating func visitLazyHStack(_ lazyHStack: LazyHStackComponent) -> [any Component] {
        lazyHStack.children
    }

    mutating func visitList(_ list: ListComponent) -> [any Component] {
        list.children
    }

    mutating func visitMenu(_ menu: MenuComponent) -> [any Component] {
        [menu.label] + menu.children
    }

    mutating func visitLabel(_ label: LabelComponent) -> [any Component] {
        var children: [any Component] = []
        if let title = label.title { children.append(title) }
        if let icon = label.icon { children.append(icon) }
        return children
    }

    mutating func visitNavigationLink(_ navigationLink: NavigationLinkComponent) -> [any Component] {
        [navigationLink.label]
    }

    mutating func visitToolbarItem(_ toolbarItem: ToolbarItemComponent) -> [any Component] {
        [toolbarItem.content]
    }

    mutating func visitToolbarItemGroup(_ toolbarItemGroup: ToolbarItemGroupComponent) -> [any Component] {
        toolbarItemGroup.children
    }

    mutating func visitToolbar(_ toolbar: ToolbarComponent) -> [any Component] {
        toolbar.items
    }

    mutating func visitContextMenu(_ contextMenu: ContextMenuComponent) -> [any Component] {
        [contextMenu.content]
    }

    mutating func visitMask(_ mask: MaskComponent) -> [any Component] {
        if let maskContent = mask.maskContent { return [maskContent] }
        return []
    }
}
