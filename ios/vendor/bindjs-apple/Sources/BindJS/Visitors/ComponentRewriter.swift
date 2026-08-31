public protocol ComponentRewriter: ComponentVisitor where Result == Component {
    
}

public extension ComponentRewriter {
    
    mutating func defaultVisit(_ component: any Component) -> Result {
        component
    }
    
    mutating func visitButton(_ button: ButtonComponent) -> Result {
        var copy = button
        copy.label = button.label.accept(visitor: &self)
        return copy
    }

    mutating func visitChart(_ chart: ChartComponent) -> Result {
        var copy = chart
        copy.children = chart.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitPieChart(_ pieChart: PieChartComponent) -> Result {
        var copy = pieChart
        copy.children = pieChart.children.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitCall(_ call: ComponentCall) -> Result {
        var copy = call
        copy.children = call.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitContentUnavailableView(_ contentUnavailableView: ContentUnavailableViewComponent) -> Result {
        var copy = contentUnavailableView
        if let label = contentUnavailableView.label {
            copy.label = label.accept(visitor: &self)
        }
        if let title = contentUnavailableView.title {
            copy.title = title.accept(visitor: &self)
        }
        if let description = contentUnavailableView.description {
            copy.description = description.accept(visitor: &self)
        }
        copy.actions = contentUnavailableView.actions.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitGrid(_ grid: GridComponent) -> Result {
        var copy = grid
        copy.children = grid.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitGridRow(_ gridRow: GridRowComponent) -> Result {
        var copy = gridRow
        copy.children = gridRow.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitGroup(_ group: GroupComponent) -> Result {
        var copy = group
        copy.content = group.content.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitHStack(_ hStack: HStackComponent) -> Result {
        var copy = hStack
        copy.children = hStack.children.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitModified(_ modified: ModifiedComponent) -> Result {
        var copy = modified
        copy.content = modified.content.map { $0.accept(visitor: &self) }
        copy.modifier = modified.modifier.accept(visitor: &self)
        return copy
    }
    
    mutating func visitPicker(_ picker: PickerComponent) -> Result {
        var copy = picker
        copy.children = picker.children.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitScrollView(_ scrollView: ScrollViewComponent) -> Result {
        var copy = scrollView
        copy.content = scrollView.content.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitSection(_ section: SectionComponent) -> Result {
        var copy = section
        copy.content = section.content.map { $0.accept(visitor: &self) }
        if let header = section.header {
            copy.header = header.accept(visitor: &self)
        }
        if let footer = section.footer {
            copy.footer = footer.accept(visitor: &self)
        }
        return copy
    }
    
    mutating func visitUnresolved(_ unresolved: UnresolvedComponent) -> Result {
        var copy = unresolved
        copy.children = unresolved.children.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitViewThatFits(_ viewThatFits: ViewThatFitsComponent) -> Result {
        var copy = viewThatFits
        copy.children = viewThatFits.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitVStack(_ vStack: VStackComponent) -> Result {
        var copy = vStack
        copy.children = vStack.children.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitZStack(_ zStack: ZStackComponent) -> Result {
        var copy = zStack
        copy.children = zStack.children.map { $0.accept(visitor: &self) }
        return copy
    }
    
    mutating func visitCircle(_ circle: CircleComponent) -> Result {
        var copy = circle
        switch circle.style {
        case .fill(let component):
            copy.style = .fill(component.accept(visitor: &self))
        case .stroke(let component, let lineWidth):
            copy.style = .stroke(component.accept(visitor: &self), lineWidth: lineWidth)
        case .none:
            copy.style = nil
        }
        return copy
    }
    
    mutating func visitEllipse(_ ellipse: EllipseComponent) -> Result {
        var copy = ellipse
        switch ellipse.style {
        case .fill(let component):
            copy.style = .fill(component.accept(visitor: &self))
        case .stroke(let component, let lineWidth):
            copy.style = .stroke(component.accept(visitor: &self), lineWidth: lineWidth)
        case .none:
            copy.style = nil
        }
        return copy
    }
    
    mutating func visitRectangle(_ rectangle: RectangleComponent) -> Result {
        var copy = rectangle
        switch rectangle.style {
        case .fill(let component):
            copy.style = .fill(component.accept(visitor: &self))
        case .stroke(let component, let lineWidth):
            copy.style = .stroke(component.accept(visitor: &self), lineWidth: lineWidth)
        case .none:
            copy.style = nil
        }
        return copy
    }
    
    mutating func visitRoundedRectangle(_ roundedRectangle: RoundedRectangleComponent) -> Result {
        var copy = roundedRectangle
        switch roundedRectangle.style {
        case .fill(let component):
            copy.style = .fill(component.accept(visitor: &self))
        case .stroke(let component, let lineWidth):
            copy.style = .stroke(component.accept(visitor: &self), lineWidth: lineWidth)
        case .none:
            copy.style = nil
        }
        return copy
    }
    
    mutating func visitCapsule(_ capsule: CapsuleComponent) -> Result {
        var copy = capsule
        switch capsule.style {
        case .fill(let component):
            copy.style = .fill(component.accept(visitor: &self))
        case .stroke(let component, let lineWidth):
            copy.style = .stroke(component.accept(visitor: &self), lineWidth: lineWidth)
        case .none:
            copy.style = nil
        }
        return copy
    }

    mutating func visitPath(_ path: PathComponent) -> Result {
        var copy = path
        switch path.style {
        case .fill(let component):
            copy.style = .fill(component.accept(visitor: &self))
        case .stroke(let component, let lineWidth):
            copy.style = .stroke(component.accept(visitor: &self), lineWidth: lineWidth)
        case .none:
            copy.style = nil
        }
        return copy
    }
    
    mutating func visitAccessibilityRepresentation(_ accessibilityRepresentation: AccessibilityRepresentationComponent) -> Result {
        var copy = accessibilityRepresentation
        copy.representation = accessibilityRepresentation.representation.accept(visitor: &self)
        return copy
    }
    
    mutating func visitBackground(_ background: BackgroundComponent) -> Result {
        var copy = background
        copy.content = background.content.accept(visitor: &self)
        return copy
    }

    mutating func visitListRowBackground(_ listRowBackground: ListRowBackgroundComponent) -> Result {
        var copy = listRowBackground
        copy.content = listRowBackground.content.accept(visitor: &self)
        return copy
    }
    
    mutating func visitBorder(_ border: BorderComponent) -> Result {
        var copy = border
        copy.style = border.style.accept(visitor: &self)
        return copy
    }
    
    mutating func visitForegroundStyle(_ foregroundStyle: ForegroundStyleComponent) -> Result {
        var copy = foregroundStyle
        copy.style = foregroundStyle.style.accept(visitor: &self)
        return copy
    }
    
    mutating func visitOverlay(_ overlay: OverlayComponent) -> Result {
        var copy = overlay
        copy.content = overlay.content.accept(visitor: &self)
        return copy
    }

    mutating func visitSafeAreaInset(_ safeAreaInset: SafeAreaInsetComponent) -> Result {
        var copy = safeAreaInset
        copy.content = safeAreaInset.content.accept(visitor: &self)
        return copy
    }

    mutating func visitNavigationStack(_ navigationStack: NavigationStackComponent) -> Result {
        var copy = navigationStack
        copy.children = navigationStack.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitLazyVStack(_ lazyVStack: LazyVStackComponent) -> Result {
        var copy = lazyVStack
        copy.children = lazyVStack.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitLazyHStack(_ lazyHStack: LazyHStackComponent) -> Result {
        var copy = lazyHStack
        copy.children = lazyHStack.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitList(_ list: ListComponent) -> Result {
        var copy = list
        copy.children = list.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitMenu(_ menu: MenuComponent) -> Result {
        var copy = menu
        copy.label = menu.label.accept(visitor: &self)
        copy.children = menu.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitLabel(_ label: LabelComponent) -> Result {
        var copy = label
        if let title = label.title {
            copy.title = title.accept(visitor: &self)
        }
        if let icon = label.icon {
            copy.icon = icon.accept(visitor: &self)
        }
        return copy
    }

    mutating func visitNavigationLink(_ navigationLink: NavigationLinkComponent) -> Result {
        var copy = navigationLink
        copy.label = navigationLink.label.accept(visitor: &self)
        return copy
    }

    mutating func visitToolbarItem(_ toolbarItem: ToolbarItemComponent) -> Result {
        var copy = toolbarItem
        copy.content = toolbarItem.content.accept(visitor: &self)
        return copy
    }

    mutating func visitToolbarItemGroup(_ toolbarItemGroup: ToolbarItemGroupComponent) -> Result {
        var copy = toolbarItemGroup
        copy.children = toolbarItemGroup.children.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitToolbar(_ toolbar: ToolbarComponent) -> Result {
        var copy = toolbar
        copy.items = toolbar.items.map { $0.accept(visitor: &self) }
        return copy
    }

    mutating func visitContextMenu(_ contextMenu: ContextMenuComponent) -> Result {
        var copy = contextMenu
        copy.content = contextMenu.content.accept(visitor: &self)
        return copy
    }

    mutating func visitMask(_ mask: MaskComponent) -> Result {
        var copy = mask
        if let maskContent = mask.maskContent {
            copy.maskContent = maskContent.accept(visitor: &self)
        }
        return copy
    }
}
