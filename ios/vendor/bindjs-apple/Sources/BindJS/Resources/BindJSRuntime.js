const AST = {};

AST.Directive = (name, args = {}, children) => {
    var props = { ...args };
    props['children'] = children ?? [];

    return {
        'type': name,
        'props': props
    }
};

AST.ModifiedContent = (modifier, component) => {

    const content = (Array.isArray(component) ? component : [component]);

    return {
        'type': 'ModifiedComponent',
        'props': {
            'modifier': { ...modifier },
            'content': content
        }
    }
};

AST.ForEach = (dataId, functionId, count, environmentId, children) => {
    return {
        'type': 'ForEach',
        'props': {
            'dataId': dataId,
            'functionId': functionId,
            'count': count,
            'environmentId': environmentId,
            'children': children
        }
    }
};

AST.Representable = (functionId, environmentId) => {
    return {
        'type': 'Representable',
        'props': {
            'functionId': functionId,
            'environmentId': environmentId
        }
    }
};

/**
 * Built in component names
 */
const componentNames = [
    "Actions",
    "AlertScene",
    "AngularGradient",
    "Annotation",
    "AnyView",
    "AssistiveAccess",
    "AsyncImage",
    "Body",
    "Chart",
    "PieChart",
    "BarMark",
    "LineMark",
    "AreaMark",
    "PointMark",
    "RuleMark",
    "RectangleMark",
    "PieSliceMark",
    "Button",
    "Canvas",
    "Capsule",
    "Circle",
    "ColorPicker",
    "CommandGroup",
    "CommandMenu",
    "ComposerAdd",
    "ComposerChildren",
    "ComposerGroup",
    "Content",
    "ContentUnavailableView",
    "ContentView",
    "ContextMenu",
    "ControlGroup",
    "CurrentValueLabel",
    "DatePicker",
    "DebugReplaceableView",
    "DefaultButtonLabel",
    "DefaultDateProgressLabel",
    "DefaultDocumentGroupLaunchActions",
    "DefaultSettingsLinkLabel",
    "DefaultShareLinkLabel",
    "DefaultTabLabel",
    "DefaultWindowVisibilityToggleLabel",
    "Description",
    "DisclosureGroup",
    "Divider",
    "DocumentGroup",
    "DocumentGroupLaunchScene",
    "DocumentLaunchView",
    "DOMIdentifable",
    "DrawingCanvas",
    "EditButton",
    "Element",
    "Ellipse",
    "EllipticalGradient",
    "Empty",
    "EmptyModifier",
    "EmptyView",
    "EnvironmentValue",
    "EquatableView",
    "FillShapeView",
    "FilterChildren",
    "CustomFont",
    "FontCustom",
    "ForEach",
    "ForEachSectionCollection",
    "ForEachSubviewCollection",
    "Form",
    "Gauge",
    "GeometryReader",
    "GeometryReader3D",
    "GlassEffectContainer",
    "Grid",
    "GridRow",
    "Group",
    "GroupBox",
    "GroupElementsOfContent",
    "GroupSectionsOfContent",
    "HelpLink",
    "HSplitView",
    "HStack",
    "Image",
    "ImmersiveSpaceViewContent",
    "KeyframeAnimator",
    "Label",
    "LabeledControlGroupContent",
    "LabeledToolbarItemGroupContent",
    "LazyHGrid",
    "LazyHStack",
    "LazyVGrid",
    "LazyVStack",
    "LinearGradient",
    "Link",
    "List",
    "Main",
    "Map",
    "MapCircle",
    "MapPolygon",
    "MapPolyline",
    "Markdown",
    "MarkedValueLabel",
    "Marker",
    "Material",
    "MaximumValueLabel",
    "Menu",
    "MenuBarExtra",
    "MenuButton",
    "MetabindView",
    "MinimumValueLabel",
    "Model3D",
    "MultiDatePicker",
    "NavigationLink",
    "NavigationSplitView",
    "NavigationStack",
    "NavigationView",
    "NewDocumentButton",
    "OutlineSubgroupChildren",
    "PasteButton",
    "Path",
    "PhaseAnimator",
    "Picker",
    "Placeholder",
    "PlaceholderContentView",
    "PresentedWindowContent",
    "ProgressView",
    "RadialGradient",
    "ReactRepresentable",
    "Rectangle",
    "RenameButton",
    "RoundedRectangle",
    "ScrollView",
    "ScrollViewReader",
    "Section",
    "SecureField",
    "Settings",
    "SettingsLink",
    "Shader",
    "Shape",
    "ShareLink",
    "SignInWithAppleButton",
    "Slider",
    "Spacer",
    "Stepper",
    "StrokeBorderShapeView",
    "StrokeShapeView",
    "SubscriptionView",
    "Subview",
    "Table",
    "TableColumn",
    "TableHeaderRowContent",
    "TabView",
    "Text",
    "TextEditor",
    "TextField",
    "TextFieldLink",
    "Toggle",
    "ToolbarItem",
    "ToolbarItemGroup",
    "ToolbarTitleMenu",
    "TouchBar",
    "TupleView",
    "UnevenRoundedRectangle",
    "UtilityWindow",
    "Video",
    "ViewThatFits",
    "VSplitView",
    "VStack",
    "Window",
    "WindowGroup",
    "WindowVisibilityToggle",
    "ZStack",
];

function GenericComponent({ args }) {
    var { props, children } = processComponentArgs(args[0], args[1]);

    // If props isnt a dictionary contain within value
    if (typeof props != 'object' || typeof props == 'function') {
        props = { rawValue: props };
    }

    // Expand functions in props 
    props = this.processProps(props);

    /**
     * Execute children
     */
    const childrenAST = processChildren.bind(this)(children);

    return { props, children: childrenAST }
}

function processChildren(children) {
    if (!children) {
        return [];
    }

    /**
     * Execute children
     */
    const childrenAST = (children ?? []).flatMap((child, index) => {
        this.hookState.childIndex = index;

        let content = typeof child === 'function' ? child() : child;
        if (typeof content === 'function') {
            content = content();
        }
        return content
    });

    // Reset
    this.hookState.childIndex = 0;

    return childrenAST
}

function processComponentArgs(arg1, arg2) {
    // Allow children to be passed as the first argument, including as a single component (function)
    const childrenFirstArg = arg1 != null && arg2 == null && Array.isArray(arg1);
    const singleComponentChild = arg1 != null && arg2 == null && typeof arg1 === 'function' && arg1._component;
    const rawValueFirstArg = typeof arg1 != 'object' && !childrenFirstArg && !singleComponentChild;

    const props =
        rawValueFirstArg ? { rawValue: arg1 }
            : childrenFirstArg ? {}
                : singleComponentChild ? {}
                    : arg1;

    const children =
        childrenFirstArg ? arg1
            : singleComponentChild ? [arg1]
                : arg2;

    return { props, children };
}

function Color({ args }) {

    const [props] = args ?? [];

    let colorProps;
    // If input is null, undefined, or empty object, return black
    if (props == null || (typeof props === 'object' && Object.keys(props).length === 0)) {
        colorProps = { r: 0, g: 0, b: 0, a: 1 };
    } else {
        // Normalize the color input
        colorProps = normalizeColor(props);
    }
    

    return { props: colorProps, children: [] }
}

function isHexColor(value) {
    return typeof value === 'string' && value.startsWith('#');
}

function isNamedColor(value) {
    return typeof value === 'string' && !isHexColor(value)
}

// Utility to parse hex to rgba
function hexToRgba(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    } else if (hex.length === 4) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
    }
    let r = 0, g = 0, b = 0, a = 1;
    if (hex.length === 6) {
        r = parseInt(hex.substring(0,2), 16);
        g = parseInt(hex.substring(2,4), 16);
        b = parseInt(hex.substring(4,6), 16);
    } else if (hex.length === 8) {
        r = parseInt(hex.substring(0,2), 16);
        g = parseInt(hex.substring(2,4), 16);
        b = parseInt(hex.substring(4,6), 16);
        a = parseInt(hex.substring(6,8), 16) / 255;
    }
    return { r, g, b, a };
}

// Utility to convert HSB/HSV to RGB
function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;
    let r1 = 0, g1 = 0, b1 = 0;
    if (h < 60)      { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120){ r1 = x; g1 = c; b1 = 0; }
    else if (h < 180){ r1 = 0; g1 = c; b1 = x; }
    else if (h < 240){ r1 = 0; g1 = x; b1 = c; }
    else if (h < 300){ r1 = x; g1 = 0; b1 = c; }
    else             { r1 = c; g1 = 0; b1 = x; }
    return {
        r: Math.round((r1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        b: Math.round((b1 + m) * 255)
    };
}

// The color normalization logic
function normalizeColor(input) {
    // Handle null/undefined/empty
    if (input == null || (typeof input === 'object' && Object.keys(input).length === 0)) {
        return { r: 0, g: 0, b: 0, a: 1 };
    }
    // Handle number as ARGB integer
    if (typeof input === 'number' && isFinite(input)) {
        // ARGB: 0xAARRGGBB or 0xRRGGBB
        let n = input >>> 0;
        let a, r, g, b;
        if (n > 0xffffff) {
            a = ((n >> 24) & 0xff) / 255;
            r = (n >> 16) & 0xff;
            g = (n >> 8) & 0xff;
            b = n & 0xff;
        } else {
            a = 1;
            r = (n >> 16) & 0xff;
            g = (n >> 8) & 0xff;
            b = n & 0xff;
        }
        return { r, g, b, a };
    }
    // Handle string
    if (typeof input === 'string') {
        if (input === 'clear' || input === 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0 };
        }
        if (isHexColor(input)) {
            return hexToRgba(input);
        }
        // Named/semantic color
        if (isNamedColor(input)) {
            return { rawValue: input };
        }
        // fallback: return as-is
        return { rawValue: input };
    } else if (typeof input === 'object' && input !== null) {
        // Handle both short and long HSB/HSV keys (not HSL)
        // Only process if 'b' or 'brightness' is present, not 'l'
        const hasShortHSB = 'h' in input && 's' in input && 'b' in input;
        const hasLongHSB = 'hue' in input && 'saturation' in input && 'brightness' in input;
        if (hasShortHSB || hasLongHSB) {
            let h = input.h ?? input.hue ?? 0;
            let s = input.s ?? input.saturation ?? 0;
            let v = input.b ?? input.brightness ?? 0;
            let a = input.a ?? input.alpha;
            // s/v in 0-1 or 0-100
            if (s > 1) s = s / 100;
            if (v > 1) v = v / 100;
            const rgb = hsvToRgb(h, s, v);
            return { ...rgb, a: a !== undefined ? a : 1 };
        }
        // Handle both short and long RGB keys, but only if not all of h, s, b are present
        const hasShortRGB = ('r' in input || 'g' in input || 'b' in input) && !(('h' in input) && ('s' in input) && ('b' in input));
        const hasLongRGB = ('red' in input || 'green' in input || 'blue' in input) && !(('hue' in input) && ('saturation' in input) && ('brightness' in input));
        if (hasShortRGB || hasLongRGB) {
            let r = input.r ?? input.red ?? 0;
            let g = input.g ?? input.green ?? 0;
            let b = input.b ?? input.blue ?? 0;
            let a = input.a ?? input.alpha;
            // If r/g/b in 0-1, scale to 0-255
            if (r <= 1 && g <= 1 && b <= 1) {
                r = Math.round(r * 255);
                g = Math.round(g * 255);
                b = Math.round(b * 255);
            }
            return { r, g, b, a: a !== undefined ? a : 1 };
        }
        // Handle { opacity } or { a } as alpha for black
        if (
            (Object.keys(input).length === 1 && ('opacity' in input || 'a' in input)) ||
            (Object.keys(input).length === 2 && 'opacity' in input && 'a' in input)
        ) {
            let alpha = input.opacity ?? input.a;
            return { r: 0, g: 0, b: 0, a: alpha };
        }
    }
    // fallback: return as-is
    return { rawValue: input };
}

function Button({ args }) {
    const [arg1, arg2] = args;

    // Normalize into { action, label }
    // If a single arg is passed and it's an object, use it as { action, label }
    // If two args are passed, use the first as label and the second as action
    var { action, label } = typeof arg1 === 'object' && Object.keys(arg1).length > 0
        ? arg1
        : { label: arg1, action: arg2 };

    if (!label) {
        throw new Error("Button requires a label")
    }

    if (!action || typeof action !== 'function') {
        throw new Error("Button requires an action function")
    }


    // Support label to be a raw string, convert to Text component
    if (typeof label == 'string') {
        label = AST.Directive('Text', { rawValue: label });
    }

    // Store the action, get the handlerId to be provided in the AST props.
    const path = this.currentPathId();
    const handlerId = this.storeFunction(action, path);
    const environmentId = this.storeEnvironment(path);

    // Process label
    const { label: finalLabel } = this.processProps({ label });

    return {
        props: { handlerId, label: finalLabel, environmentId },
        children: []
    }

}

function Picker({ args }) {
    const [label, selection, children] = args;

    const setFunction = selection[1] ?? (() => { });

    const id = this.currentPathId('Picker');    
    const environmentId = this.storeEnvironment(id);
    const setFunctionId = this.storeFunction(setFunction, id);
    const dataId = this.storeData(selection[0], id);

    const childrenAST = processChildren.bind(this)(children ?? []);

    return { 
        props: { label, selection, currentValueId: dataId, setterId: setFunctionId, environmentId }, 
        children: childrenAST
    }
    
}

function AnimationComponent({ args, name }) {
    const typeMap = {
        'Spring': 'spring',
        'EaseIn': 'easeIn',
        'EaseOut': 'easeOut',
        'EaseInOut': 'easeInOut',
        'Linear': 'linear',
        'Bouncy': 'bouncy',
        'Snappy': 'snappy',
        'InterpolatingSpring': 'interpolatingSpring',
    };

    const props = {
        type: typeMap[name] ?? 'unknown',
        ...(args[0] ?? {})
    };

    return { props }
}

const propertyNameMap = {
    'PropertyString'  : 'string',
    'PropertyNumber'  : 'number',
    'PropertyInteger' : 'integer',
    'PropertyBoolean' : 'boolean',
    'PropertyEnum'    : 'enum',
    'PropertyDate'    : 'date',
    'PropertyArray'   : 'array',
    'PropertyAsset'   : 'asset',
    'PropertyGroup'   : 'group',
    'PropertyContent' : 'content',
    'PropertyComponent': 'component',
    'PropertyComponentList': 'componentList',
    'PropertyChildren' : 'children',
};

function PropertyComponent({ args, name }) {
    const props = args?.[0] || {};

    const result = {
        type: propertyNameMap[name] || 'unknown',
        ...props,
    };
    
    return result;
}

function ComposerGroup({ args, name }) {
    const props = { };

    const env = this.environment;
    var children = null;

    if (args) {
        if (args[0] && args[1] || (typeof args[0] === 'object' && !Array.isArray(args[0])) || typeof args[0] === 'string') {
            // If the first argument is an object, treat it as props
            if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
                Object.assign(props, args[0]);

            } else if (typeof args[0] === 'string') {
                // Otherwise, treat the first argument as a raw value
                props.rawValue = args[0];
            }

            if (args[1]) {
                children = args[1];
            }

        } else if (args[0]) {
            // If the first argument is an array, treat it as children
            children = args[0] ?? [];
        }
    }

    if (!children) {
        let propName = props.property || props.rawValue || props.group;
        if (propName == 'children') {
            children = env?.content?.children || [];   
        } else {
            children = env?.content?.layoutProps?.[props.rawValue ?? props.property] || [];
        }
    }

    const childrenAST = processChildren.bind(this)(children).filter(child => {
        return true
        // const groupName = props.group || props.rawValue;

        // const childGroupName = child?.props?.group;

        // if (!groupName && !childGroupName) {
        //     return true
        // }

        // return (childGroupName === groupName) 
    });   

    
    const result = {
        props: this.processProps(props),
        children: childrenAST
    };
    
    return result;
}

function ForEach({ args }) {

    const [data, callback] = args;

    const expand = this.options.expandForEach;
    const count = Array.isArray(data) ? data.length : 0;

    var ast = null;  

    if (expand) {
        const children = data.map((element, index) => {
            this.setForEachElementId(index);
            let result = callback(element, index);
            while (result && result._component) {
                result = result();
            }
            return result
        });
        ast = AST.ForEach(null, null, count, null, children);
    } else {
        const id = this.currentPathId('ForEach');    
        const environmentId = this.storeEnvironment(id);
        const functionId = this.storeFunction(callback, id);
        const dataId = this.storeData(data, id);

        ast = AST.ForEach(dataId, functionId, count, environmentId);
    }

    return { ast }
}

function Content({ args }) {

    const id = this.currentPathId('Content');    
    const environmentId = this.storeEnvironment(id);

    const contentId = typeof args[0] === 'object' ? args[0]?._content : args[0];

    const props = { 
        environmentId,
        id: contentId
    };
    return { props } 
}

function CallbackComponent({ args, name }) {
    const callback = args[0];

    if (!callback || typeof callback !== 'function') {
        return { props: { handlerId: null } };
    }

    // Wrap the callback to unwrap component functions
    const handler = (geometry) => this.unwrapComponentAST(callback(geometry));

    const id = this.currentPathId('CallbackComponent_' + name);
    const handlerId = this.storeFunction(handler, id);
    const environmentId = this.storeEnvironment(id);

    return { props: { handlerId, environmentId } };
}

function NavigationLink({ args }) {
    const [arg1, arg2] = args;

    // Normalize into { destination, label }
    // If a single arg is passed and it's an object, use it as { destination, label }
    // If two args are passed, use the first as label and the second as destination
    var { destination, label } = typeof arg1 === 'object' && Object.keys(arg1).length > 0
        ? arg1
        : { label: arg1, destination: arg2 };

    // Support label as a raw string, convert to Text component
    if (typeof label === 'string') {
        label = AST.Directive('Text', { rawValue: label });
    }

    // Store the destination handler
    const path = this.currentPathId();
    const environmentId = this.storeEnvironment(path);

    // Create destination handler that returns AST when called
    const destinationHandler = destination ? () => {
        return destination()();
    } : () => null;

    const destinationHandlerId = this.storeFunction(destinationHandler, this.currentPathId('NavigationLink_destination'));

    // Process label
    const { label: finalLabel } = this.processProps({ label });

    return {
        props: { destinationHandlerId, label: finalLabel, environmentId },
        children: []
    };
}

function PathComponent({ args }) {
    const callback = args[0];
    const elements = [];

    const pathBuilder = {
        move(x, y) { elements.push({ op: "move", x, y }); },
        line(x, y) { elements.push({ op: "line", x, y }); },
        quadCurve(x, y, controlX, controlY) {
            elements.push({ op: "quadCurve", x, y, controlX, controlY });
        },
        curve(x, y, control1X, control1Y, control2X, control2Y) {
            elements.push({ op: "curve", x, y, control1X, control1Y, control2X, control2Y });
        },
        arc(props) { elements.push({ op: "arc", ...props }); },
        addRect(x, y, width, height) {
            elements.push({ op: "rect", x, y, width, height });
        },
        addRoundedRect(props) {
            elements.push({ op: "roundedRect", ...props });
        },
        addEllipse(x, y, width, height) {
            elements.push({ op: "ellipse", x, y, width, height });
        },
        addLines(points) {
            elements.push({ op: "lines", points });
        },
        close() { elements.push({ op: "close" }); }
    };

    if (typeof callback === 'function') {
        callback(pathBuilder);
    }

    return { props: { elements } };
}

var modifierDefaults = {
    'disabled': true
};


// Add all environment value modifiers that need to be accessible in the environment
var modifiersToAddToEnvironment = [
    // Existing modifiers
    'padding',
    'textSelection',
    'font',
    'foregroundStyle',
    'accentColor',
    'controlSize',
    'multilineTextAlignment',
    'lineSpacing',
    'textCase',
    'lineLimit',
    'imageScale',
    'colorScheme',
    'environment',
    
    // EnvironmentValues from Environment.tsx
    'displayScale',
    'dynamicTypeSize',
    'locale',
    'layoutDirection',
    'screen',
    'platform'
];

function GenericModifier({ args, name }) {

    var props = args[0] == null ? modifierDefaults[name] : args[0];

    // Handle passing single value
    if (Array.isArray(props) || typeof props != 'object' || (typeof props == 'object' && props.type != null)) { 
        if (typeof props == 'function') {
            props = props();
        }
        props = { rawValue: props };
    }

    // Scale modifiers take a { value: style } map. Record the key order so the
    // renderers can build the scale domain in authoring order.
    if ((name == 'chartForegroundStyleScale' || name == 'chartSymbolScale') && props && typeof props == 'object') {
        props = { ...props, __bindjsScaleDomain: Object.keys(props) };
    }

    return { props }
}

GenericModifier.environmentValue = (name, args) => {
    if (!modifiersToAddToEnvironment.includes(name)) {
        return null
    }
    return { key: name, value: args[0] }
};

// SwiftUI default padding value in points
const DEFAULT_LENGTH = 8;

function Padding({ args }) {
    const standardizedPadding = normalizePaddingArgs(args);
    return { props: standardizedPadding };
}

Padding.environmentValue = (name, args) => {
    const standardizedPadding = normalizePaddingArgs(args);
    return { key: name, value: standardizedPadding }
};

// Normalize args to {top, leading, bottom, trailing} number type
function normalizePaddingArgs(args) {
    let padding = { top: 0, leading: 0, bottom: 0, trailing: 0 };

    if (args.length === 0) {
        // .padding() - all sides default
        padding = { top: DEFAULT_LENGTH, leading: DEFAULT_LENGTH, bottom: DEFAULT_LENGTH, trailing: DEFAULT_LENGTH };
    } else if (args.length === 1) {
        const arg = args[0];
        if (typeof arg === 'number' && isFinite(arg)) {
            // .padding(length)
            padding = { top: arg, leading: arg, bottom: arg, trailing: arg };
        } else if (typeof arg === 'string') {
            // .padding(edge)
            applyEdges([arg], DEFAULT_LENGTH, padding);
        } else if (Array.isArray(arg)) {
            // .padding(edgeArray)
            applyEdges(arg, DEFAULT_LENGTH, padding);
        } else if (typeof arg === "object" && arg !== null) {
            // .padding({ horizontal, vertical, ... })
            let matched = false;
            if (typeof arg.horizontal === "number" && isFinite(arg.horizontal)) {
                padding.leading = arg.horizontal;
                padding.trailing = arg.horizontal;
                matched = true;
            }
            if (typeof arg.vertical === "number" && isFinite(arg.vertical)) {
                padding.top = arg.vertical;
                padding.bottom = arg.vertical;
                matched = true;
            }
            // If explicit edges supplied, use (overrides horizontal/vertical)
            for (const key of ["top", "leading", "bottom", "trailing"]) {
                if (typeof arg[key] === "number" && isFinite(arg[key])) {
                    padding[key] = arg[key];
                    matched = true;
                }
            }
            // If nothing matched, fallback to all-DEFAULT_LENGTH
            if (!matched) {
                padding = { top: DEFAULT_LENGTH, leading: DEFAULT_LENGTH, bottom: DEFAULT_LENGTH, trailing: DEFAULT_LENGTH };
            }
        } else {
            // fallback
            padding = { top: DEFAULT_LENGTH, leading: DEFAULT_LENGTH, bottom: DEFAULT_LENGTH, trailing: DEFAULT_LENGTH };
        }
    } else if (args.length === 2) {
        // .padding(edges, length)
        let edges = args[0];
        let length = args[1];
        if (!(typeof length === 'number' && isFinite(length))) length = DEFAULT_LENGTH;
        if (typeof edges === "string" || Array.isArray(edges)) {
            applyEdges(edges, length, padding);
        }
    }

    // Cleanup & sanitization: NaN/undefined to 0
    for (const key of ["top", "leading", "bottom", "trailing"]) {
        if (typeof padding[key] !== "number" || !isFinite(padding[key])) padding[key] = 0;
    }

    return padding;
}

// Map edge masks, including expansion for composite cases
function applyEdges(mask, length, target) {
    // Mask can be array or string
    if (typeof mask === "string")
        mask = [mask];
    if (!Array.isArray(mask)) return;

    // If "all" is present anywhere, set ALL edges first
    if (mask.includes("all")) {
        target.top = length;
        target.bottom = length;
        target.leading = length;
        target.trailing = length;
        // Don't early-return; individual keys below should override if desired
    }
    for (let edge of mask) {
        switch (edge) {
            case "top":
                target.top = length;
                break;
            case "bottom":
                target.bottom = length;
                break;
            case "leading":
                target.leading = length;
                break;
            case "trailing":
                target.trailing = length;
                break;
            case "horizontal":
                target.leading = length;
                target.trailing = length;
                break;
            case "vertical":
                target.top = length;
                target.bottom = length;
                break;
            // If "all", handled above
        }
    }
}

function Resizable({ args, content }) {

    const resizable = args[0];

    if (content && content.type === 'Image') {

        // If the content is a Image component, we need to modify its prop directly
        const imageProps = content.props;
        imageProps.resizable = resizable == false ? false : true ;

        // Return the Image directly
        return { ast: content }

    } else {
        return { 
            props: { rawValue: resizable },
            children: content
        }
    }
}

function Opacity({ args, content }) {

    const opacity = args[0];

    if (content && content.type === 'Color') {

        // If the content is a Color component, we need to modify its opacity
        const colorProps = content.props;
        if (colorProps && colorProps.a !== undefined) {
            // If the color already has an alpha value, we can just multiply it
            colorProps.a *= opacity;
        } else {
            // Otherwise, we set the alpha value to the first argument
            colorProps.opacity = colorProps.opacity ? colorProps.opacity * opacity : opacity;
        }

        // Return the Color directly
        return { ast: content }

    } else if (content && content.type === 'ModifiedComponent' && content.props?.modifier?.type === 'opacity') {

        // Collapse opacity modifiers
        content.props.modifier.props.rawValue *= opacity;
        return { ast: content }

    } else {

        // If the content is not a Color component, we just return it as is
        // but we can still apply the opacity to the parent element
        return {
            props: { rawValue: opacity },
            children: content
        }
    }
}

function OnHandler({ args, name }) {

    // If arg is a function, store it and return handler id
    // If arg is props, process them and return props
    const processArg = (arg) => {
        if (arg == null) {
            return {}
        }

        // Arg is a handler function
        if (typeof arg === 'function') {

            return { handlerId: this.storeFunction(arg, this.currentPathId(name)) }

            // Arg is a dictionary of props
        } else if (typeof arg === 'object' && !Array.isArray(arg)) {

            return arg

        } else {
            return { value: arg }
        }

    };

    // An 'on' handler can take either one or two arguments.
    // First or second may be a function or an object.
    // Second argument is optional but would be a function if present.
    return {
        props: {
            ...processArg(args[0]),
            ...processArg(args[1])
        },
    }
}

function AnimationModifier({ args,  name, content }) {

    const value = args[0];
    
    // Add the value directly to the props of the content
    const props = content.props;
    props[name] = value;
    
    // Return the AnimationComponent directly to squash the modifier.
    return { ast: content }
}

// Helper: Recursively checks if a node or its children matches the given type
function getComponentAST(node, typeName) {
    var ast = node;

    // Unwrap component function if it is a component
    while (typeof ast === 'function' && ast._component) {
        ast = ast();
    }

    if (typeof ast === 'object' && ast !== null && typeName != null) {
        if (ast?.type === typeName && typeof ast.props === 'object') {
            return ast
        }

        // Recurse into children if they exist
        const astChildren = ast?.props?.children;
        if (astChildren) {
            const children = Array.isArray(astChildren) ? astChildren : [astChildren];
            for (const child of children) {
                const result = getComponentAST(child, typeName);
                if (result) return result;
            }
        }
    }
    return null;
}

function FontModifier({ args, content }) {
    const [arg] = args;

    // FontCustom currently for backward compatiblity.
    let customFont = getComponentAST(arg, 'CustomFont') || getComponentAST(arg, 'FontCustom');
    if (customFont) {
        customFont.type = 'CustomFont';
    }

    let options = {};
    if (customFont) {
        options = { custom: customFont.props, rawValue: customFont };
    } else {
        options = { rawValue: arg };
    }

    return {
        props: options,
        children: content,
    };
}

function EnvironmentValue({ args }) {
    const props = { environmentKey: args[0], value: args[1] };
    return { props }
}

EnvironmentValue.environmentValue = (name, args) => {
    return { key: args[0], value: args[1] } 
};

// Normalise .fill modifier and pass into to the component it's applied to as a prop
// fill: { style: ShapeStyle }
function Fill({ args, content }) {

    const style = args[0];

    // If the content is a Color component, we need to modify its opacity
    const shapeProps = content.props;

    // If passing { style: Color('red') } etc , then pass dictionary directly
    if (typeof style === 'object' && style.style != null) {
        shapeProps.fill = this.processProps({ ...style });

    // Otherwise if the value is the style itself e.g. Color('red') or 'red', then setup the fill property
    } else if (typeof style === 'function') {
        shapeProps.fill = this.processProps({ style: style });
    }

    // Return the Color directly
    return { ast: content }
}

// Normalise .stroke modifier and pass into to the component it's applied to as a prop
// stroke: { style: ShapeStyle, lineWidth: number }
function Stroke({ args, content }) {

    const style = args[0];

    // If the content is a Color component, we need to modify its opacity
    const shapeProps = content.props;

    // If passing { style: Color('red') } etc , then pass dictionary directly
    if (typeof style === 'object' && style.style != null) {
        shapeProps.stroke = this.processProps({ ...style });

    // Otherwise if the value is the style itself e.g. Color('red') or 'red', then setup the fill property
    } else if (typeof style === 'function') {
        shapeProps.stroke = this.processProps({ style: style });
    } else if (typeof style === 'number') {
        shapeProps.stroke = { lineWidth: style };
    }
    
    // Return the Color directly
    return { ast: content }
}

function ButtonStyle({ args, name }) {

    // If arg is a function, store it and return handler id
    // If arg is props, process them and return props
    const processArg = (arg) => {
        if (arg == null) {
            return {}
        }

        // Arg is a handler function
        if (arg._buttonStyle) {
            let unwrapped = arg();
            return { props: unwrapped.buttonStyleProps, handlerId: unwrapped.handlerId, environmentId: unwrapped.environmentId }
        } else {
            return {}
        }

    };

    // An 'on' handler can take either one or two arguments.
    // First or second may be a function or an object.
    // Second argument is optional but would be a function if present.
    let props = {
        props: {
            ...processArg(args[0])
        },
    };

    return props
}

/**
 * Modifier that supports content as a first or second argument.
 * If two arguments are provided, the first is treated as props and the second as content.
 * 
 * Used for modifiers like background and overlay.
 */
function ContentModifier({ args, content }) {

    var modifierContent = null;
    var props = {};

    if (args.length == 2) {
        modifierContent = args[1];
        props = args[0];
    } else if (args.length == 1) {
        modifierContent = args[0];
    }

    // Single component
    if (typeof modifierContent == 'function') {
        modifierContent = this.unwrapComponentAST(modifierContent);

        // Convert array of components to Group
    } else if (Array.isArray(modifierContent)) {
        const items = modifierContent.map((item) => {
            if (typeof item == 'function') {
                return this.unwrapComponentAST(item);
            } else {
                return item;
            }
        });
        modifierContent = AST.Directive('Group', {}, items);
    }

    return {
        props: { ...props, content: modifierContent },
    }
}

class VisualEffectBuilder {
    constructor() {
        this.result = {};
    }

    blur(radius) {
        this.result.blur = radius;
        return this;
    }

    opacity(amount) {
        this.result.opacity = amount;
        return this;
    }

    offset({ x, y }) {
        this.result.offset = { x, y };
        return this;
    }

    // supports both scale({x,y,anchor}) and scale(value)
    scale(value) {
        if (typeof value === "object" && value !== null) {
            this.result.scale = value;
        } else {
            this.result.scale = { x: value, y: value };
        }
        return this;
    }

    rotation(value) {
        if (typeof value === "object" && value !== null) {
            let degrees = value.degrees ? value.degrees : value.radians * (180 / Math.PI);
            this.result.rotation = degrees;
            return this;
        } else {
            this.result.rotation = value;
        }
        return this;
    }

    transform(matrix) {
        // Only include keys that are defined (so we don't send undefined values to Swift)
        const { m11, m12, m21, m22, tx, ty } = matrix || {};

        // Build transform object only if there's something meaningful to send
        const hasTransform =
            m11 !== undefined || m12 !== undefined ||
            m21 !== undefined || m22 !== undefined ||
            tx  !== undefined || ty  !== undefined;

        if (hasTransform) {
            this.result.transform = {
                m11: m11 ?? 1,
                m12: m12 ?? 0,
                m21: m21 ?? 0,
                m22: m22 ?? 1,
                tx:  tx  ?? 0,
                ty:  ty  ?? 0,
            };
        }

        return this;
    }

    reset() {
        this.result = {};
        return this;
    }

    build() {
        return { ...this.result };
    }

}

function VisualEffectModifier({ args, name }) {

    // Handler function 
    var handler = (geometry) => {
        let builder = new VisualEffectBuilder();
        return args[0](builder, geometry).build();
    };

    if (handler == null) {
        return {
            props: {
                handlerId: null
            }
        }
    } else {
        return {
            props: {
                handlerId: this.storeFunction(handler, this.currentPathId(name))
            }
        }
    }
}

function SheetModifier({ args, name }) {

    // Assume args[0] contains the props
    const props = args[0] ?? { isPresented: false };

    // processProps has already stored the set…/on… callbacks under their …Id
    // names (setIsPresentedId, onDismissId); map them to the …HandlerId names
    // the renderers read.
    const content = props.content;

    // Return AST representation when content handler is called.
    const contentHandler = content ? () => {
        // Execute handler, then AST function.
        return content()();
    } : () => {
        return null;
    };

    return {
        props: {
            isPresented: props.isPresented,
            setIsPresentedHandlerId: props.setIsPresentedId ?? null,
            dismissHandlerId: props.onDismissId ?? null,
            contentHandlerId: this.storeFunction(contentHandler, this.currentPathId(name + '_content')),
        }
    }
}

function ScrollPositionModifier({ args, name }) {
    const props = args[0] ?? {};
    const path = this.currentPathId(name);
    const environmentId = this.storeEnvironment(path);

    const result = { scrolledID: props.id ?? null, environmentId };

    if (typeof props.setId === 'function') {
        result.setScrolledIDHandlerId = this.storeFunction(props.setId, path);
    } else if (props.setIdId) {
        result.setScrolledIDHandlerId = props.setIdId;
    }

    return { props: result };
}

function GalleryModifier({ args, name }) {
    let detailCallback;
    let zoomEnabled = true;

    if (typeof args[0] === 'function') {
        detailCallback = args[0];
    } else if (args[0] && typeof args[0] === 'object') {
        zoomEnabled = args[0].zoomEnabled !== false;
        detailCallback = args[1];
    }

    if (!detailCallback || typeof detailCallback !== 'function') {
        return { props: { detailHandlerId: null, zoomEnabled } };
    }

    const detailHandler = (id) => {
        let result = detailCallback(id);
        return this.unwrapComponentAST(result);
    };

    return {
        props: {
            detailHandlerId: this.storeFunction(detailHandler, this.currentPathId(name + '_detail')),
            zoomEnabled
        }
    }
}

function NavigationDestinationModifier({ args, name }) {

    // Assume args[0] contains the props
    const props = args[0] ?? { isPresented: false };

    // Extract isPresented value
    const isPresented = props.isPresented;

    // setIsPresented is already processed by processProps into setIsPresentedId
    const setIsPresentedHandlerId = props.setIsPresentedId ?? null;

    const destination = props.destination;

    // Return AST representation when destination handler is called.
    const destinationHandler = destination ? () => {
        // Execute handler, then AST function.
        return destination()();
    } : () => {
        return null;
    };

    return {
        props: {
            isPresented: isPresented,
            setIsPresentedHandlerId: setIsPresentedHandlerId,
            destinationHandlerId: this.storeFunction(destinationHandler, this.currentPathId(name + '_destination')),
        }
    }
}

function AnimationViewModifier({ args, name }) {
    var { animation: animArg, value } = args[0] ?? {};

    var animation = null;
    if (typeof animArg === 'function' && animArg._component) {
        var ast = animArg();
        animation = { type: ast.type, ...ast.props };
        delete animation.children;
    } else if (animArg && typeof animArg === 'object') {
        animation = animArg;
    }

    return {
        props: {
            animation: animation ? JSON.stringify(animation) : null,
            value: value != null ? String(value) : null
        }
    }
}

function LayoutGroup({ args, name }) {
    const props = args?.[0] || {};

    const result = {
        ...props,
    };
    
    return result;
}

const Detent = {
    medium: { detentType: 'medium' },
    large: { detentType: 'large' },
    fraction: (value) => ({ detentType: 'fraction', value }),
    height: (value) => ({ detentType: 'height', value }),
};

const getComponentData = (child) => {
    let ast = child();
    let data = findComponentDataInAST(ast);
    return data ?? { name: null, props: {}  }
};

const findComponentDataInAST = (node) => {
    if (!node) return null;

    // Base case: If this node is not one of the excluded types, return its type/name
    if (node.type !== "ModifiedComponent" && node.type !== "DOMIdentifable") {
        // For ComponentCall nodes, prefer props.name (since "type" would just be "ComponentCall")
        if (node.type === "ComponentCall") {
            return {
                name: node.name ?? node.props?.name ?? null,
                props: node.props?.props ?? {}
            }
        } else {
            return {
                name: node.type,
                props: node.props ?? {}
            }
        }
    }

    // Otherwise, explore its children or content recursively
    const children =
        node.props?.children ??
        node.content ??
        node.props?.content ?? // current iOS implementation.
        (node.modifier?.props?.children ?? []);

    if (Array.isArray(children)) {
        for (const child of children) {
            const result = findComponentDataInAST(child);
            if (result) return result;
        }
    } else if (children) {
        return findComponentDataInAST(children);
    }

    // Also look into modifier content if present
    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            const result = findComponentDataInAST(child);
            if (result) return result;
        }
    }

    return null;
};

function useState(initialValue) {
    
    // Sanity check
    if (this.hookState.currentComponent == null) {
        return [initialValue, () => {}]
    }

    // Get current state
    var hooks = this.hookState.currentComponent.hookStorage ?? [];
    const hookIndex = this.hookState.currentComponent.hookIndex;

    //console.log(`useState index ${currentHook} value ${hooks[currentHook]} initialValue ${initialValue}`);
    
    // Initialise hook with initialValue if needed
    hooks[hookIndex] = hooks[hookIndex] == null ? initialValue : hooks[hookIndex];

    const rerenderCallback = this.needsRerender;
    const rendererId = this.rendererId;

    // Create setState callback
    let callback = (value) => {

        //console.log(`useState callback value [${value}]`)

        // Update state
        hooks[hookIndex] = value;                

        // Trigger a re-render is required due to state changing
        rerenderCallback(rendererId);
        return value                
    };

    return [hooks[this.hookState.currentComponent.hookIndex++], callback]    
}

function useRef(initialValue) {

    // Sanity check
    if (this.hookState.currentComponent == null) {
        return { current: initialValue }
    }

    // Get current state
    var hooks = this.hookState.currentComponent.hookStorage ?? [];
    const hookIndex = this.hookState.currentComponent.hookIndex;

    // Initialise the ref object once. Subsequent renders return the same object reference,
    // so mutations to `.current` persist without triggering re-renders.
    if (hooks[hookIndex] == null) {
        hooks[hookIndex] = { current: initialValue };
    }

    return hooks[this.hookState.currentComponent.hookIndex++]
}

function useStore(key, defaultValue, scope) {
    if (defaultValue === null || typeof defaultValue !== "object") {
        throw new Error(
            `useStore("${key}") defaultValue must be an object (Zustand-style).`
        );
    }

    const fullKey = scope ? `${scope}:${key}` : key;

    const rerenderCallback = this.needsRerender;
    const rendererId = this.rendererId;

    // Read or fallback to default
    const stateObj = this.appState[fullKey] ?? defaultValue;

    // Zustand-style setter
    const set = (value) => {
        const next =
            typeof value === "function"
                ? value(stateObj)
                : value;

        if (!next || typeof next !== "object") {
            throw new Error(
                `useStore("${key}") set() must return an object`
            );
        }

        this.updatedAppState(
            fullKey,
            next,
            (prevState) => {
                const prev = prevState[fullKey] ?? defaultValue;
                if (prev !== next) {
                    return { ...prevState, [fullKey]: next };
                }
                return prevState; // unchanged
            },
            () => rerenderCallback(rendererId)
        );
    };

    // Flattened store object
    const store = {
        set
    };

    // Add state fields directly onto the store object
    for (const field of Object.keys(stateObj)) {
        store[field] = stateObj[field];

        const cap =
            field.charAt(0).toUpperCase() + field.slice(1);
        const setterName = `set${cap}`;

        store[setterName] = (val) => {
            set((prev) => ({
                ...prev,
                [field]:
                    typeof val === "function"
                        ? val(prev[field])
                        : val
            }));
        };
    }

    return store;
}

function useAppState(key, defaultValue) {
    const rerenderCallback = this.needsRerender;
    const rendererId = this.rendererId;

    const set = (newValue) => {

        // Update the app state with the new value
        this.updatedAppState(key, newValue, (prevState) => {
            // Check if the value has changed
            if (prevState[key] !== newValue) {
                return { ...prevState, [key]: newValue };
            }
            return prevState;  // No change, return previous state
        }, () => {
            // Trigger a re-render if the state has changed
            rerenderCallback(rendererId);
        });
    };

    return [this.appState[key] ?? defaultValue, set];
}

function useNavigate() {
    return this.navigateCallback
}

function useAction() {
    return this.actionCallback
}

function makeComponent (component) {

    // Pass body directly or in dictionary
    let body = component.body ? component.body : component;

    // As the name isnt passed in, generate one from the call order
    const componentIndex = this.hookState.makeComponentIndex++;

    //console.log('registerCallback - makeComponent ', component, componentIndex)

    // Create body function
    let f = (props, children) =>   
        this.makeComponent((props, children) => body(props, children), props, children, componentIndex);  
    
    f._component = true;

    return f
}

async function getContent(content) {
    // Assumes content prop is passed.
    let contentId = content?._content;

    if (this.getContent == null || contentId == null) {  
        return null

    // Call the getContent property assigned to the runtime with the contentId.
    } else {
        return await this.getContent(contentId)
    }
}

/**
 * convertComponentProps
 * ---------------------
 * Recursively traverses a props object and replaces any "component-like" objects
 * (objects with a `componentId` and `name` field) with the result of calling that component.
 *
 * A "component-like" object is expected to look like:
 * {
 *   componentId: string,
 *   name: string,
 *   props: object
 * }
 *
 * The function assumes `this.call(name, 'body', props)` is available for resolving components.
 * 
 * Efficiency:
 * - Arrays and objects are only cloned if any of their children change.
 * - Component calls are only made when matching shape is detected.
 * - Fast return for primitive types and unchanged structures.
 *
 * @param props - The input props object to convert.
 * @returns A new props object with all components resolved, or the original if unchanged.
 */
function convertComponentProps(props) {
    if (props == null || typeof props !== 'object') return props;

    const makeComponent = this.makeComponent?.bind(this);
    const getExport = this.getComponentExport?.bind(this);

    function process(item) {

        // Fast-path array
        if (Array.isArray(item)) {
            let changed = false;
            const len = item.length;
            const result = new Array(len);
            for (let i = 0; i < len; i++) {
                const [val, didChange] = process(item[i]);
                if (didChange) changed = true;
                result[i] = val;
            }
            return [changed ? result : item, changed];
        }

        // Fast-path component call
        if (item && typeof item === 'object') {

            // Detect a (possibly partial) component-like shape: anything with a string `_type`
            // that looks like the prefix of "ComponentInstance". Streaming MCP tool calls can
            // deliver partial objects (e.g. {_type: "ComponentInsta"} or a complete _type with
            // no _component yet); without this guard the raw object leaks into React children
            // and triggers "Objects are not valid as a React child".
            if (typeof item._type === 'string' && 'ComponentInstance'.startsWith(item._type)) {

                // Partial — not yet a fully-formed ComponentInstance. Render nothing for now.
                if (item._type !== 'ComponentInstance' || item._component == null || !getExport) {
                    return [null, true];
                }

                // Wrap in makeComponent, so the function is called at runtime (rather than parsing of props time)
                // So environment works correctly.
                const result = makeComponent(() => {
                    let body = getExport(item._component, 'body');

                    // Component name didn't resolve (e.g. streamed-in name not yet a known component).
                    if (typeof body !== 'function') {
                        return null
                    }

                    // Remove the special fields from the item before passing to the component, and process the props to catch any child components.
                    const { _component, _type, _id, ...itemProps } = item;
                    const processedProps = process(itemProps)[0];

                    return body(processedProps)
                });

                return [result, true];
            }

            // Check for component-like structure
            if (item.id != null && item.type && item.props && getExport) {
                let bodyFunc = getExport(item.type, 'body');
                const result = bodyFunc(item.type, item.props);
                //const result = callFn(item.type, item.props);
                return [result, true];
            }

            // Traverse object
            let changed = false;
            let result = null;
            for (const key in item) {
                if (!Object.hasOwn(item, key)) continue;
                const val = item[key];
                const [processed, didChange] = process(val);
                if (didChange) {
                    if (!changed) {
                        changed = true;
                        result = { ...item };  // Lazy copy only when the first change occurs
                    }
                    result[key] = processed;  // Apply the changed value
                }
            }
            return [changed ? result : item, changed];
        }

        // Primitive
        return [item, false];
    }

    return process(props)[0];
}

function withAnimation(arg1, arg2) {
    let [component, callback] = (arg1 != null && arg2 != null) ? [arg1, arg2] : [{}, arg1];

    let options = {};
    if (typeof component === 'function' && component._component) {
        let componentAST = component();
        options = {
            type: componentAST.type,
            ...componentAST.props
        };
        delete options.children;
    } else if (typeof component === 'object') {
        options = component;
    }

    let handlerId = this.storeFunction(callback, this.currentPathId('withAnimation'));
    if (this.withAnimation) {
        this.withAnimation(handlerId, options);
    } else {
        console.warn('withAnimation is not supported in this environment');
    }
}

/**
 * Returns the MCP host interface, or null if not running in an MCP context.
 * The host provides methods for tool calls, messaging, context updates, etc.
 *
 * The host object is set by the renderer via `runtime.mcpHost = { ... }`.
 */
function useMCPHost() {
    return this.mcpHost ?? null
}

/**
 * Creates an action that intercepts and handles URL opening requests.
 * 
 * This function mimics SwiftUI's OpenURLAction, allowing you to intercept links
 * and choose how they are handled: by your custom logic, by the system, or discarded.
 * 
 * @param {Function} urlCallback - A callback function that receives the URL to be opened.
 * @returns {Function} A handler function bound to the runtime context.
 * 
 * @example
 * ```javascript
 * // Handle the URL yourself
 * OpenURLAction((url) => {
 *   console.log(" intercepted:", url);
 *   return { handled: true };
 * })
 * 
 * // Let the system handle it (default behavior)
 * OpenURLAction((url) => {
 *   return { systemAction: true };
 * })
 * 
 * // Modify the URL before letting the system handle it
 * OpenURLAction((url) => {
 *   return { systemAction: { url: url + "?ref=app" } };
 * })
 * 
 * // Open in the same window
 * OpenURLAction((url) => {
 *   return { systemAction: { url: url, preferInApp: true } };
 * })
 * ```
 */
function OpenURLAction(urlCallback) {
    return (url, resultCallback) => {
        const result = urlCallback(url);

        if (result?.systemAction) {
            if (this?.openURL) {
                // Handle both boolean true and object forms of systemAction
                const systemAction = result.systemAction === true ? {} : result.systemAction;
                const targetUrl = systemAction.url ?? url;
                const preferInApp = systemAction.preferInApp ?? false;

                this.openURL(targetUrl, resultCallback, { preferInApp });
            }
        } else if (resultCallback) {
            resultCallback(result);
        }
    }
}

let funcs = {};
funcs.capitalize = (s) => {
    return s.charAt(0).toUpperCase() + s.slice(1)
};
funcs.reverse = (s) => s.split('').reverse().join('');
funcs.contains = (s, substr) => s.includes(substr);
funcs.titleCase = (input) => {
    if (input == undefined) {
        return undefined
    }
    const smallWords = new Set([
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor',
        'of', 'on', 'or', 'the', 'to', 'up', 'yet'
    ]);

    const words = input.trim().split(/\s+/);

    return words
        .map((word, i) => {
            const lower = word.toLowerCase();

            // Always capitalize first and last word
            if (i === 0 || i === words.length - 1) {
                return funcs.capitalize(word)
            }

            // Keep small words lowercase
            if (smallWords.has(lower)) {
                return lower
            }

            return funcs.capitalize(word)
        })
        .join(' ')
};

const code = `
const body = (props, children) => {
    return (
        SizeToFitScreen({ width: 512, height: 512 }, children)
    )
}
`;

const body$1 = `
const body = (props, children) => {
    let env = useEnvironment()
    const bg = env.systemColorScheme == 'dark' ? Color('#1a1a1a') : Color('#fafafa')

    const platformSizes = {
        'mobile': { width: 350, height: 750 },
        'tablet': { width: 1194, height: 834 },
        'desktop': { width: 1208, height: 832 }
    }
    
    const size = platformSizes[props.defaultPlatform ?? 'mobile']
    
    return (
        SizeToFitScreen({ width: size.width, height: size.height, padding: env.screen.height * 0.1 }, [
            VStack(children)
                .background(Color('background'))
                .shadow()
                .cornerRadius(40)
        ])
        .frame({ maxWidth: Infinity, maxHeight: Infinity })
    )
}
`;

const body = `
const body = (props, children) => {
    const env = useEnvironment()

    const padding = (props.padding ?? 0) * 2
    const contentSize = { width: props.width, height: props.height }
    const cmsSafeArea = env.safeArea ?? { top: 0, bottom: 0, left: 0, right: 0 }
    
    const aspect = contentSize.width / contentSize.height
    
    const width = contentSize.height ? Math.floor((contentSize.height * aspect) ) : contentSize.width
    const height = Math.floor(contentSize.height )

    const safeAreaVertical = cmsSafeArea.top + cmsSafeArea.bottom;

    // Screen Scale
    const hscale = Math.min(( (env.screen?.height ?? 800) - padding - safeAreaVertical) / (height ), 1.0);
    const wscale = Math.min(( (env.screen?.width ?? 400) - padding - cmsSafeArea.left - cmsSafeArea.right) / (width ), 1.0);
    const scale = Math.min(wscale,hscale);

    return (
        ZStack(children)
            .environment('screen', contentSize)
            .offset({ y: 0 })
            .isScaledToFit(scale != 1.0)
            .scaleEffect(scale) 
            .frame({ width: contentSize.width, height: contentSize.height })
    )
}
`;

// Core


/**
 * Optional logger injected by the runtime owner. Any subset of console-style
 * methods; missing methods fall back to the default console. Use to downgrade
 * routine compile/runtime noise (e.g. mid-edit syntax errors in Composer) so
 * it doesn't reach console.error.
 *
 * @typedef {Object} BindJSLogger
 * @property {(...args: unknown[]) => void} [log]
 * @property {(...args: unknown[]) => void} [info]
 * @property {(...args: unknown[]) => void} [warn]
 * @property {(...args: unknown[]) => void} [error]
 * @property {(...args: unknown[]) => void} [debug]
 */

/**
 * @typedef {Object} BindJSRuntimeOptions
 * @property {boolean} [expandForEach]
 * @property {BindJSLogger} [logger]
 */

function resolveLogger(logger) {
    if (!logger) return console
    return {
        log: logger.log ?? console.log,
        info: logger.info ?? logger.log ?? console.info,
        warn: logger.warn ?? console.warn,
        error: logger.error ?? console.error,
        debug: logger.debug ?? logger.log ?? console.debug,
    }
}

class BindJSRuntime {
    /** @param {BindJSRuntimeOptions} [options] */
    constructor(options) {
        this.options = options ?? { expandForEach: false };
        this.logger = resolveLogger(options?.logger);
        this.reset();
    }

    reset() {
        this.context = {
            'Self': () => { }
        };

        this.components = {};

        this.functionCache = {};
        this.modifierFunctions = {};
        this.callStack = [];
        this.environment = {};
        this.storedEnvironments = {};
        this.storedFunctions = {};
        this.storedData = {};
        this.storedHookStates = {};
        this.hookState = {};
        this.modifierRegistry = { GenericModifier };
        this.componentRegistry = { GenericComponent };

        // Current component being registered
        this._currentComponentName = undefined;

        // Default app state that can be managed by the renderer. Can be overridden by the renderer.
        this.appState = {};

        this.resetState();
        this.registerBuiltInCallbacks();
        this.registerBuiltInComponents();

        this.needsRerender = () => {
            this.logger.log('Needs rerender not implemented');
        };

        // Default open url implementation. Can be overriden
        this.onOpenURL = (url, resultCallback, options = { preferInApp: false }) => {
            this.logger.log('onOpenURL', url, options);
            if (options?.preferInApp) {
                window.open(url, '_self');
            } else {
                window.open(url, '_blank');
            }

            if (resultCallback) {
                resultCallback(true);
            }
        };

        // Callback to update the app state.
        // Renderers will want to override this to know when the app state has changed
        // and to update the appropriate storage.
        this.onUpdateAppState = (key, value, state) => {
            // Default implementation.
            this.appState[key] = value;
        };

        this.navigateCallback = ({ to, props }) => {
            this.logger.log('Navigate not implemented', to, props);
        };

        this.actionCallback = ({ name, props }) => {
            this.logger.log('Action not implemented', name, props);
        };

        this.withAnimation = (handlerId) => {
            this.logger.log('With animation not implemented', handlerId);
            // Provide default implementation.
            //
            // this.withAnimation should be overridden by the renderer to wrap the animation in a context
            // that will cause the state change to animate
            let animationBlock = this.restoreFunction(handlerId);
            if (animationBlock) {
                animationBlock();
            }
        };

        // MCP host interface. Set by the renderer to provide tool calls,
        // messaging, context updates, etc. Null when not in an MCP context.
        this.mcpHost = null;
    }

    willRender() {
        this.hookState.path = [];
        this.hookState.makeComponentIndex = 0;
        this.hookState.childIndex = 0;
        this.hookState.modifierId = null;
        this.hookState.forEachElementId = null;
    }

    resetState() {

        // Hook state needs to keep track of two things
        // - Component path. A unique path for the current component that's consistent across renders.
        // - Component hook storage. Storage for the hooks based on the component path.
        // - Component hook index. The current index of the hook that is being called
        this.hookState = {
            // Current component path
            path: [],

            // Current index in an array of children. Used to create the path if no id 
            childIndex: 0,

            // Current id set by a modifier. Used to create the path if set.
            modifierId: null,

            // Current id in a ForEach loop. Used to create the path if set.
            forEachElementId: null,

            // Index of the number of calls to makeComponent. Used to generate a unique id for a component if a name isnt available (if called from code)
            makeComponentIndex: 0,

            // Stores the hooks for each component, keyed by path.
            componentHookStore: {},

            // State of the individual for current component
            currentComponent: {
                hookStorage: [],
                hookIndex: 0
            }
        };
    }

    resetStorage() {
        this.storedEnvironments = {};
        //this.storedFunctions = {}
        this.storedData = {};
        this.storedHookStates = {};
    }

    /**
     * Clear stored data/environments/hook states for one renderer only.
     *
     * Storage keys are produced by `currentPathId`, which always starts with the
     * renderer id (`${rendererId},...`). Filtering by that prefix lets one
     * renderer reset its own state without wiping siblings (e.g. a component
     * editor mounting must not clear a still-visible thumbnail's chart data).
     */
    resetRendererStorage(rendererId) {
        if (rendererId == null || rendererId === 0) return
        const prefix = `${rendererId},`;
        const filter = (dict) => {
            if (!dict) return
            for (const key of Object.keys(dict)) {
                if (key.startsWith(prefix)) delete dict[key];
            }
        };
        filter(this.storedEnvironments);
        filter(this.storedData);
        filter(this.storedHookStates);
    }

    resetCache(componentName) {
        this.functionCache[componentName] = {};
    }

    registerASTComponents(componentNames) {
        // Construct AST functions for inbuilt components.
        for (const componentName of componentNames) {
            this.#registerBuiltInComponent(componentName);
        }
    }

    registerBuiltInComponents() {

        this.registerASTComponents(componentNames);

        // Register specific handlers for inbuilt components
        this.#registerBuiltInComponent('Color', Color);
        this.#registerBuiltInComponent('Button', Button);
        this.#registerBuiltInComponent('ForEach', ForEach);
        this.#registerBuiltInComponent('Content', Content);
        this.#registerBuiltInComponent('Picker', Picker);
        this.#registerBuiltInComponent('NavigationLink', NavigationLink);
        this.#registerBuiltInComponent('Path', PathComponent);

        this.registerComponentName('ThumbnailComponent');
        this.registerComponentName('ThumbnailContent');
        this.registerComponentName('SizeToFitScreen');

        // Register default components. These are components initalised with bindjs body string.
        this.#registerDefaultComponent('ThumbnailComponent', code);
        this.#registerDefaultComponent('ThumbnailContent', body$1);
        this.#registerDefaultComponent('SizeToFitScreen', body);

        // Register specific handlers for inbuilt modifiers
        this.#registerBuiltInModifier('padding', Padding);
        this.#registerBuiltInModifier('opacity', Opacity);
        this.#registerBuiltInModifier('font', FontModifier);
        this.#registerBuiltInModifier('fill', Fill);
        this.#registerBuiltInModifier('stroke', Stroke);
        this.#registerBuiltInModifier('buttonStyle', ButtonStyle);
        this.#registerBuiltInModifier('resizable', Resizable);

        this.#registerBuiltInModifier('background', ContentModifier);
        this.#registerBuiltInModifier('listRowBackground', ContentModifier);
        this.#registerBuiltInModifier('overlay', ContentModifier);
        this.#registerBuiltInModifier('safeAreaInset', ContentModifier);
        this.#registerBuiltInModifier('contextMenu', ContentModifier);
        this.#registerBuiltInModifier('toolbar', ContentModifier);
        this.#registerBuiltInModifier('visualEffect', VisualEffectModifier);
        this.#registerBuiltInModifier('sheet', SheetModifier);
        this.#registerBuiltInModifier('fullScreenCover', SheetModifier);
        this.#registerBuiltInModifier('scrollPosition', ScrollPositionModifier);
        this.#registerBuiltInModifier('gallery', GalleryModifier);
        this.#registerBuiltInModifier('navigationDestination', NavigationDestinationModifier);
        this.#registerBuiltInModifier('animation', AnimationViewModifier);

        // Register event handlers
        ['onTapGesture', 'onDragGesture', 'onLongPressGesture', 'onHover', 'onAppear', 'onDisappear', 'onSubmit', 'onChange'].map(name => this.#registerBuiltInModifier(name, OnHandler));

        // Register animation components
        ['Spring', 'Linear', 'EaseIn', 'EaseOut', 'EaseInOut', 'Bouncy', 'Snappy', 'InterpolatingSpring'].map(name => this.#registerBuiltInComponent(name, AnimationComponent));

        // Register animation modifiers
        ['delay', 'speed', 'repeatCount', 'repeatForever'].map(name => this.#registerBuiltInModifier(name, AnimationModifier));

        ['PropertyString', 'PropertyNumber', 'PropertyInteger', 'PropertyEnum', 'PropertyBoolean', 'PropertyArray', 'PropertyAsset', 'PropertyContent', 'PropertyComponent', 'PropertyDate', 'PropertyGroup', 'PropertyChildren', 'PropertyComponentList'].map(name => {
            this.#registerHelperComponent(name, PropertyComponent);
        });

        // Register components that use callbacks
        ['GeometryReader'].map(name => this.#registerBuiltInComponent(name, CallbackComponent));

        this.#registerBuiltInComponent('ComposerGroup', ComposerGroup);
        this.#registerBuiltInComponent('ComposerChildren', ComposerGroup);

        // Register layout group
        this.#registerHelperComponent('LayoutGroup', LayoutGroup);

        // Detent is a plain value namespace (Detent.medium, Detent.fraction(...)),
        // not a component, so expose it in the context directly.
        this.context['Detent'] = Detent;

        // Regster environment value modiifer
        this.#registerBuiltInModifier('environment', EnvironmentValue);
    }

    /**
     * Register built in callbacks available to components
     * @param {*} environment 
     */
    registerBuiltInCallbacks() {

        this.registerCallback('useEnvironment', () => {
            return this.environment
        });

        // Standard library functions
        for (const key in funcs) {
            this.registerCallback(key, funcs[key]);
        }

        this.registerCallback('OpenURLAction', OpenURLAction.bind(this));

        // useState
        this.registerCallback('useState', useState.bind(this));

        // useRef
        this.registerCallback('useRef', useRef.bind(this));

        // useAppState (deprecated)
        this.registerCallback('useAppState', useAppState.bind(this));

        // useStore
        this.registerCallback('useStore', useStore.bind(this));

        // useNavigate
        this.registerCallback('useNavigate', useNavigate.bind(this));
        this.registerCallback('useAction', useAction.bind(this));

        // DEPRECATED: makeComponent
        this.registerCallback('makeComponent', makeComponent.bind(this));

        // Define
        this.registerCallback('defineComponent', this.defineComponent.bind(this));
        this.registerCallback('defineButtonStyle', this.defineButtonStyle.bind(this));

        // getContent
        this.registerCallback('getContent', getContent.bind(this));

        // getComponentData
        this.registerCallback('getComponentData', getComponentData.bind(this));

        // Prevent top in browser from being interpreted as a function
        this.registerCallback('top', () => { });

        // With animation callback
        this.registerCallback('withAnimation', withAnimation.bind(this));

        // MCP host
        this.registerCallback('useMCPHost', useMCPHost.bind(this));
    }

    /**
     * Creates a built in component.
     * A callback can be passed to generate the component, or left empty to use the generic handler.
     */
    #registerBuiltInComponent(name, callback) {
        if (callback) {
            this.componentRegistry[name] = callback;
        }

        this.context[name] = (...args) => {
            return this.#makeInBuiltComponent(name, args)
        };
    }

    #registerDefaultComponent(name, bodyCode) {
        const code = bodyCode += `
        exports.default = defineComponent({ body })
        `;
        this.registerComponentName(name);
        this.registerComponent(name, code);
    }

    /**
     * Registers a built in modifier using a callback
     */
    #registerBuiltInModifier(name, callback) {
        this.modifierRegistry[name] = callback;
    }

    #registerHelperComponent(name, callback) {
        this.context[name] = (...args) => callback({ name, args: args });
    }

    /**
     * Register the JS of one or more components
     * @param {*} components 
     */
    registerComponents(components, entryPoint = 'body') {
        for (const componentName of Object.keys(components)) {
            this.registerComponent(componentName, components[componentName], entryPoint);
        }
    }

    aliasComponent(componentName, aliasName) {
        this.components[aliasName] = this.components[componentName];
        this.context[aliasName] = this.context[componentName];
    }

    registerComponentName(componentName) {
        const name = this.sanitizeName(componentName);
        this.context[name] = this.makeComponent(() => {
            return AST.Directive('Text', { rawValue: "Placeholder" })
        });
    }

    sanitizeName = (componentName) => {
        // Remove all characters that are NOT (letters, digits, $, _)
        let name = componentName.replace(/[^a-zA-Z0-9$_]/g, '');

        // If the name starts with a digit, prefix with an underscore
        if (/^[0-9]/.test(name)) {
            name = '_' + name;
        }

        return name;
    };

    /**
     * Checks if content has an explicit export statement (ignoring comments)
     * @private
     */
    #hasExplicitExport(content) {
        // Match exports.default = at the start of a line, ignoring leading whitespace
        // but not if it's in a comment
        const regex = /^(?!\s*\/\/)(?!\s*\/\*)\s*exports\.default\s*=/m;
        return regex.test(content);
    }

    /**
     * Checks if content has a const declaration with the given name
     * @private
     */
    #hasConst(content, name) {
        const regex = new RegExp(`(^|[^\\w/])const\\s+${name}\\s*=`, "m");
        return regex.test(content);
    }

    /**
     * Wraps legacy component code in a defineComponent export
     * @private
     */
    #wrapInDefineComponent(content) {
        const componentParts = {
            body: this.#hasConst(content, 'body') ? 'body' : '() => null',
            metadata: this.#hasConst(content, 'metadata') ? 'metadata' : '{}',
            properties: this.#hasConst(content, 'properties') ? 'properties' : '{}',
            previews: this.#hasConst(content, 'previews') ? 'previews' : 'null',
            thumbnail: this.#hasConst(content, 'thumbnail') ? 'thumbnail' : 'null',
            icon: this.#hasConst(content, 'icon') ? 'icon' : 'null'
        };

        const exportStatement = `
exports.default = defineComponent({
    body: ${componentParts.body},
    metadata: ${componentParts.metadata},
    properties: ${componentParts.properties},
    previews: ${componentParts.previews},
    thumbnail: ${componentParts.thumbnail},
    icon: ${componentParts.icon}
});`;

        return content + exportStatement;
    }


    // Registers the content of a component into the runtime.
    // Content is the JS of the component.
    // Entry point is the export to use. i.e. exports.default 
    registerComponent(componentName, content, entryPoint = 'default') {
        const name = this.sanitizeName(componentName);

        this.callStack = [];
        this.functionCache[name] = {};

        this._currentComponentName = name;

        /**
         * Backward compatibility: Auto-wrap legacy component code in defineComponent
         * TODO: Migration removal - remove once all components use explicit exports
         */
        if ((entryPoint === 'default' || entryPoint === 'body') && !this.#hasExplicitExport(content)) {
            content = this.#wrapInDefineComponent(content);
        }

        this.components[name] = content;

        // Create the function
        // This will defer the compiling of the component until it is called.
        this.context[name] = (arg1, arg2, ...otherArgs) => {
            const { props, children } = processComponentArgs(arg1, arg2);

            return this.#makeComponent((props, children) => {
                this._currentComponentName = name;

                // Get the export and the body content to run.
                try {
                    let exportComponent = this.getComponentExport(name);
                    if (typeof exportComponent?._body == 'boolean' && exportComponent?._body == true) {
                        return exportComponent?._bodyContent(props, children, ...otherArgs);
                    } else {
                        return exportComponent;
                    }
                } catch (error) {
                    this.logger.error('Error running component', name, error);
                    return null;
                }

            }, props, children, name)
        };

    }

    // Gets default export from a registered component.
    // 
    // If property is passed will return that property from the default export.
    // Each property is executed and cached individually so that the function list is correctly resolved.
    // Meaning , trys to avoid issue of if say metadata is accessed before all functions have been registered , it'll only be the metadata funciton that will have the incomplete list.
    getComponentExport(componentName, property, cache = true) {
        const componentKeys = Object.keys(this.context);
        const functionList = componentKeys.join(', ');
        //console.log('getComponetnExport ', componentName, componentKeys);
        let func = null;

        if (cache && this.functionCache[componentName] && this.functionCache[componentName]['export_' + property]) {
            func = this.functionCache[componentName]['export_' + property];
        } else {
            this.aliasComponent(componentName, 'Self');

            const returnStatement = property ? `return exports.default?.${property}; ` : "return exports.default;";

            try {
                func = new Function(`{ ${functionList} } `, `var exports = {}; ${this.components[componentName]}; ${returnStatement} `)(this.context);
            } catch (error) {
                this.logger.error('Error running component', componentName, error);
                return null;
            }

            if (cache && func) {
                this.functionCache[componentName]['export_' + property] = func;
            }
        }

        return func
    }

    getComponentType(componentName) {
        let exportComponent = this.getComponentExport(componentName);
        if (!exportComponent) {
            return null;
        }
        if (exportComponent._component) {
            return "Component"
        } else if (exportComponent._buttonStyle) {
            return "ButtonStyleComponent"
        } else {
            return null;
        }
    }

    defineProperties(definitionProps) {
        return definitionProps
    }

    /**
     * Defines a component with its body, metadata, properties, previews, and thumbnail.
     * 
     * This is the primary method used within component code to export a complete component
     * definition. It packages all aspects of a component into a single callable function
     * that can be used throughout the runtime.
     * 
     * The component definition includes:
     * - **body**: The main rendering function that returns the component's UI structure
     * - **metadata**: Descriptive information (title, description, category, visibility)
     * - **properties**: Property definitions for configurable inputs
     * - **previews**: Array of pre-configured component instances for documentation
     * - **thumbnail**: Visual representation (SVG string or function) for galleries
     * - **icon**: Optional icon name string for menus and context menus
     * 
     * This method is typically called at the end of a component file as:
     * `exports.default = defineComponent({ body, metadata, properties, previews, thumbnail })`
     * 
     * @param {Object} definitionProps - The component definition object
     * @param {Function} definitionProps.body - The component's body function (props, children) => Component
     * @param {Object|Function} [definitionProps.metadata] - Component metadata (title, description, etc.)
     * @param {Object|Function} [definitionProps.properties] - Property definitions for the component
     * @param {Array|Function} [definitionProps.previews] - Array of preview component instances
     * @param {string|Function} [definitionProps.thumbnail] - Thumbnail representation (SVG or function)
     * @param {string} [definitionProps.icon] - Icon name string for lightweight identification in menus
     * @returns {Function} A callable component function with attached metadata, properties, previews, and thumbnail
     * 
     * @example
     * // Basic component definition
     * const body = (props, children) => {
     *   return Text(props.label)
     * }
     * 
     * const metadata = {
     *   title: 'My Button',
     *   description: 'A simple button component',
     *   category: 'Controls'
     * }
     * 
     * const properties = {
     *   label: { type: 'string', defaultValue: 'Click me' }
     * }
     * 
     * exports.default = defineComponent({ body, metadata, properties })
     */
    defineComponent(definitionProps) {
        const { metadata, properties, body, previews, thumbnail, icon } = definitionProps;

        var componentName = this._currentComponentName;
        if (!componentName) {
            // If it isn't passed in, generate one from the call order
            const componentIndex = this.hookState.makeComponentIndex++;
            componentName = `Component_${componentIndex} `;
        }

        // Body content of the component.
        const bodyContent = (props, children, ...otherArgs) => {

            const convertedProps = this.convertComponentProps(props);

            // Call the body of our registered component
            const componentFunction = body(convertedProps, children, ...otherArgs);

            // It's assumed a component returns an inbuilt component.
            // Run the returned function to generate the ast
            let ast = componentFunction && typeof componentFunction === 'function' ? componentFunction() : null;

            if (ast && ast._component) {
                ast = ast();
            }

            // Wrap the component in a directive so the renderer knows what component generated that part of the AST
            const componentAst = AST.Directive('ComponentCall', { name: componentName, props: props }, [ast]);

            // Return
            return componentAst
        };

        // This body is executed when the return from defineComponent is called directly.
        // So by components that are defined inline using defineComponent().
        // Execution of the body uses the bodyContent function when called from a registered component.
        const bodyDefinition = (arg1, arg2, ...otherArgs) => {
            const { props, children } = processComponentArgs(arg1 ?? {}, arg2 ?? []);
            return this.#makeComponent(bodyContent, props, children, componentName)
        };

        // Flag this definition function as being a component but also that it's a body function.
        bodyDefinition._component = true;
        bodyDefinition._body = true;
        bodyDefinition._bodyContent = bodyContent;

        bodyDefinition.metadata = metadata;
        bodyDefinition.properties = properties;
        bodyDefinition.thumbnail = thumbnail;
        bodyDefinition.icon = icon;
        bodyDefinition.previews = previews;
        bodyDefinition.body = body;

        // Return the definition
        return bodyDefinition
    }


    defineButtonStyle(buttonStyleDefinition) {
        const { body } = buttonStyleDefinition;

        const bodyContent = (props, children) => {
            // Store handle to the body function for the buttonStyle modifier
            const path = this.currentPathId('buttonStyle');
            let handlerId = this.storeFunction(body, path);
            let environmentId = this.storeEnvironment(path, { restoreHookStateStorage: true });

            // When called as a component, render using the body
            let renderAsComponentAST = AST.Directive('Text', { rawValue: 'Button Style' });
            let ast = body({ label: this.makeComponent(() => renderAsComponentAST) }, props);
            ast = this.unwrapComponentAST(ast);

            // Return with both ast and the handlerId.
            return { buttonStyleProps: (props ?? {}), handlerId, environmentId, ...ast }
        };

        const bodyDefinition = (props) => {
            return this.makeComponent(bodyContent, props)
        };

        bodyDefinition._buttonStyle = true;
        bodyDefinition._body = true;
        bodyDefinition._bodyContent = bodyContent;
        bodyDefinition.body = bodyDefinition;
        return bodyDefinition
    }

    /**
    * Register callback to be made available to the runtime
    * @param {*} callbackName
    * @param {*} callback 
    */
    registerCallback(callbackName, callback) {
        this.context[callbackName] = callback;
    }

    /**
     * Open URL handling
     * @param {*} url 
     */
    openURL(url, resultCallback, options = { preferInApp: false }) {
        if (this.onOpenURL) {
            this.onOpenURL(url, resultCallback, options);
        } else if (resultCallback) {
            resultCallback(false);
        }
    }

    /**
     * Register initial environment
     * @param {*} environment 
     */
    registerEnvironment(environment = {}) {
        this.environment = { openURL: this.openURL.bind(this), ...environment };
    }

    /**
     * AppState
     */
    registerAppState(state) {
        this.appState = state;
    }

    updatedAppState(key, value, newState, completionCallback) {
        // Execute the callback to let the renderer know the app state has changed
        this.onUpdateAppState(key, value, newState(this.appState));

        // If the app state has changed, trigger a re-render
        if (completionCallback) {
            completionCallback();
        }
    }

    /**
     * Restores an environment by id
     * @param {*} environmentId 
     */
    restoreEnvironment(environmentId) {
        let env = this.storedEnvironments[environmentId];

        if (env) {
            this.environment = env;
        }

        let hookState = this.storedHookStates[environmentId];
        if (hookState) {

            // Restore hook state path
            this.hookState.path = [...hookState.path];

            // Restore storage for current function.
            if (hookState.restoreHookStateStorage) {
                this.restoreHookStateStorage();
            }
        }
    }

    restoreHookStateStorage() {
        // Setup currentComponent content.
        // This is needed if when restoring a function that would be accessing state.
        let { path, componentHookStore, currentComponent } = this.hookState;

        // Create path key. This is a unique key consistent across renders
        let hookKey = path.join('.');

        // Get hook storage for this component
        let hookStorage = componentHookStore[hookKey] ?? (componentHookStore[hookKey] = []);

        // Setup component hook state for the component we're about to call
        currentComponent.hookStorage = hookStorage;
        currentComponent.hookIndex = 0;
    }

    getEnvironment(environmentId) {
        return this.storedEnvironments[environmentId]
    }

    debugEnvironment() {
        this.logger.log('Envionment:');
        this.logger.log(' - Current:', this.environment);
        this.logger.log(' - Stored: ', this.storedEnvironments);
    }

    /**
     * Unregister a component
     * @param {*} componentName
     * @returns
     */
    unregisterComponent(componentName) {
        delete this.components[componentName];
        delete this.functionCache[componentName];
        delete this.context[componentName];
    }

    setRendererId(id) {
        this.rendererId = id;
    }

    /**
     * Calls the body of registered component and returns its body as an AST.
     * 
     * This is the primary method for executing a component that has been registered
     * via registerComponent(). It looks up the component by name in the context,
     * calls it with the provided parameters, and unwraps any component functions
     * to return the final AST representation.
     * 
     * @param {string} componentName - The name of the registered component to call
     * @param {Object} params - Props/parameters to pass to the component
     * @param {Array} children - Child components to pass to the component
     * @param {boolean} unwrap - Whether to unwrap the component AST or just return the body function. Useful if wanting to wrap the output in the children another element to be called.
     * @param {...any} args - Additional arguments to pass to the component
     * @returns {Object|null} The component's AST, or null if the component doesn't exist
     * 
     * @example
     * const ast = runtime.callComponent('MyComponent', { color: 'blue' }, []);
     */
    callComponent(componentName, params, children, unwrap = true, ...args) {
        componentName = this.sanitizeName(componentName);

        this.aliasComponent(componentName, 'Self');

        let body = this.context[componentName];
        if (body) {
            let b = body(params, children, ...args);
            return unwrap ? this.invokeComponent(b) : b
        }
        return null
    }

    /**
     * Invokes a component function and returns its AST.
     */
    invokeComponent(element) {
        return this.unwrapComponentAST(element)
    }

    /**
     * Calls a specific preview variant of a registered component and returns its AST.
     * 
     * This method retrieves and executes a preview from the component's previews array.
     * Previews are alternative representations of a component, typically used for
     * documentation, galleries, or showcasing different states/configurations.
     * 
     * If the requested preview doesn't exist or the component has no previews defined,
     * this method falls back to calling the component's main body.
     * 
     * @param {string} componentName - The name of the registered component
     * @param {number} previewIndex - The index of the preview to render (0-based)
     * @param {Object} params - Props/parameters to pass to the preview or body
     * @param {Array} children - Child components to pass to the preview or body
     * @param {...any} args - Additional arguments to pass
     * @returns {Object|null} The preview's AST, or the body's AST if no preview exists
     * 
     * @example
     * // Render the first preview of a Button component
     * const ast = runtime.callComponentPreview('Button', 0, { label: 'Click me' }, []);
     */
    callComponentPreview(componentName, previewIndex, params, children, unwrap = true, ...args) {
        componentName = this.sanitizeName(componentName);

        this.aliasComponent(componentName, 'Self');

        let previews = this.getComponentPreviews(componentName);
        if (previews && Array.isArray(previews) && previews.length > 0) {
            let b = previews[previewIndex];
            if (b) {
                return unwrap ? this.unwrapComponentAST(b) : b
            }
        }

        // Fallback to body
        return this.callComponent(componentName, params, children, unwrap, ...args)
    }

    /**
     * Renders a component as a thumbnail with optional framing.
     * 
     * This method generates a thumbnail representation of a component, which is useful
     * for component galleries, content previews, or visual catalogs. The thumbnail can be:
     * 1. A custom thumbnail defined by the component (string SVG or function)
     * 2. The component's first preview (fallback)
     * 3. Optionally wrapped in a frame component for consistent presentation
     * 
     * The thumbnail can be framed in two ways:
     * - 'component': Wraps in ThumbnailComponent (for component library thumbnails)
     * - 'content': Wraps in ThumbnailContent (for content/page thumbnails with platform sizing)
     * 
     * @param {string} componentName - The name of the registered component
     * @param {Object} thumbnailOptions - Configuration for thumbnail rendering
     * @param {string} thumbnailOptions.type - Frame type: 'component', 'content', or undefined for no frame
     * @param {string} [thumbnailOptions.defaultPlatform] - Platform size for 'content' type (mobile/tablet/desktop)
     * @param {number} [thumbnailOptions.padding] - Padding for the thumbnail frame
     * @param {Object} params - Props/parameters to pass to the component
     * @param {Array} children - Child components to pass
     * @param {...any} args - Additional arguments
     * @returns {Object} The thumbnail's AST, optionally wrapped in a frame component
     * 
     * @example
     * // Render a component thumbnail with component frame
     * const ast = runtime.callComponentThumbnail('MyButton', { type: 'component' }, {}, []);
     * 
     * @example
     * // Render a content thumbnail with mobile sizing
     * const ast = runtime.callComponentThumbnail('HomePage', 
     *   { type: 'content', defaultPlatform: 'mobile', padding: 20 }, 
     *   {}, []
     * );
     */
    callComponentThumbnail(componentName, thumbnailOptions = {}, params, children, unwrap = true, ...args) {
        componentName = this.sanitizeName(componentName);

        // First determine if the component specifies a custom thumbnail.
        let thumbnail = this.getComponentThumbnail(componentName);
        if (typeof thumbnail == 'string') {
            thumbnail = AST.Directive('Image', { svg: thumbnail });
        } else if (typeof thumbnail == 'function') {
            thumbnail = thumbnail(params, children);
        }

        var thumbnailContent = thumbnail;

        // Fallback to preview when no thumbnail is defined
        if (!thumbnail) {
            thumbnailContent = this.callComponentPreview(componentName, 0, params, children, unwrap, ...args);
        }

        // Apply the built in thumbnail component views.
        // These will be applied when thumbnailOptions is passed with type component | content.
        // Otherwise if not passed then the thumbnail content is returned as is.
        if (thumbnailOptions.type == 'component') {
            return this.callComponent('ThumbnailComponent', thumbnailOptions, [thumbnailContent], unwrap, ...args)
        } else if (thumbnailOptions.type == 'content') {
            return this.callComponent('ThumbnailContent', thumbnailOptions, [thumbnailContent], unwrap, ...args)
        } else {
            return thumbnailContent
        }

    }

    /**
     * Retrieves the metadata for a registered component.
     * 
     * Metadata provides descriptive information about a component, such as its title,
     * description, category, and visibility settings. This is commonly used for:
     * - Component documentation and catalogs
     * - IDE autocomplete and tooltips
     * - Component organization and filtering
     * 
     * If the metadata is defined as a function, it will be executed and the result returned.
     * If no metadata is defined, an empty object is returned.
     * 
     * @param {string} componentName - The name of the registered component
     * @returns {Object} The component's metadata object (always returns an object, never null)
     * 
     * @example
     * const metadata = runtime.getComponentMetadata('Button');
     * // Returns: { title: 'Button', description: 'A clickable button', category: 'Controls' }
     */
    getComponentMetadata(componentName) {
        let metadata = this.getComponentExport(componentName, 'metadata');
        metadata = typeof metadata === 'function' ? metadata() : metadata ?? {};
        return metadata
    }

    /**
     * Retrieves the property definitions for a registered component.
     * 
     * Properties define the configurable inputs (props) that a component accepts,
     * including their types, default values, validation rules, and inspector UI settings.
     * This information is used for:
     * - Visual property editors and inspectors
     * - Type checking and validation
     * - Auto-generating component documentation
     * - IDE autocomplete for component props
     * 
     * If the properties are defined as a function, it will be executed and the result returned.
     * If no properties are defined, an empty object is returned.
     * 
     * @param {string} componentName - The name of the registered component
     * @returns {Object} The component's property definitions (always returns an object, never null)
     * 
     * @example
     * const properties = runtime.getComponentProperties('Button');
     * // Returns: { label: { type: 'string', defaultValue: 'Click me' }, ... }
     */
    getComponentProperties(componentName) {
        let properties = this.getComponentExport(componentName, 'properties');
        properties = typeof properties === 'function' ? properties() : properties ?? {};
        return properties
    }

    /**
     * Retrieves the preview variants for a registered component.
     * 
     * Previews are pre-configured instances of a component that showcase different
     * states, configurations, or use cases. They are commonly used for:
     * - Component documentation and galleries
     * - Visual regression testing
     * - Design system showcases
     * - Quick component exploration
     * 
     * If the previews are defined as a function, it will be executed and the result returned.
     * Previews should be an array of component instances or null/undefined if none are defined.
     * 
     * @param {string} componentName - The name of the registered component
     * @returns {Array|null|undefined} Array of preview component instances, or null/undefined if none defined
     * 
     * @example
     * const previews = runtime.getComponentPreviews('Button');
     * // Returns: [Button({ label: 'Primary' }), Button({ label: 'Secondary', variant: 'outline' })]
     */
    getComponentPreviews(componentName) {
        let previews = this.getComponentExport(componentName, 'previews');
        if (previews && typeof previews == 'function') {
            previews = previews();
        }
        if (!Array.isArray(previews)) {
            previews = [];
        }
        return previews
    }

    /**
     * Retrieves component previews with extracted metadata (id, title, component).
     * 
     * This method processes previews to extract custom names from the previewName modifier.
     * If a preview uses .previewName('Custom Name'), that name will be used as the title.
     * Otherwise, it defaults to "Preview N" where N is the 1-based index.
     * 
     * @param {string} componentName - The name of the registered component
     * @returns {Array<{id: string, title: string, component: any}>} Array of preview metadata objects
     * 
     * @example
     * const previews = runtime.getComponentPreviewsWithMetadata('Button');
     * // Returns: [
     * //   { id: '0', title: 'Default', component: [preview AST] },
     * //   { id: '1', title: 'Preview 2', component: [preview AST] }
     * // ]
     */
    getComponentPreviewsWithMetadata(componentName) {
        let previews = this.getComponentPreviews(componentName);
        return previews.map((preview, index) => {
            let previewAST = preview();
            let title = null;

            // Extract preview name if available from the previewName modifier
            if (previewAST?.type === "ModifiedComponent" && previewAST.props?.modifier?.type === "previewName") {
                title = previewAST.props?.modifier?.props?.rawValue;
            }

            return {
                id: String(index),
                title: title ?? `Preview ${index + 1} `,
                component: preview
            };
        });
    }

    /**
     * Retrieves the thumbnail representation for a registered component.
     * 
     * A thumbnail is a visual representation of a component used in galleries, catalogs,
     * or selection interfaces. The thumbnail can be defined as:
     * - A string containing SVG markup for a static icon/image
     * - A function that returns a component instance for dynamic thumbnails
     * - null/undefined if no custom thumbnail is defined (will fallback to preview)
     * 
     * Thumbnails are typically smaller, simplified versions of components optimized
     * for quick visual identification in component libraries or content browsers.
     * 
     * @param {string} componentName - The name of the registered component
     * @returns {string|Function|null|undefined} SVG string, thumbnail function, or null/undefined
     * 
     * @example
     * const thumbnail = runtime.getComponentThumbnail('Button');
     * // Returns: '<svg>...</svg>' or a function that generates the thumbnail
     */
    getComponentThumbnail(componentName) {
        return this.getComponentExport(componentName, 'thumbnail')
    }

    /**
     * Retrieves the icon name for a registered component.
     *
     * An icon is an optional string identifier (e.g. a Lucide icon name) that can be
     * used in component selection menus and context menus as a lightweight alternative
     * to full thumbnail rendering.
     *
     * @param {string} componentName - The name of the registered component
     * @returns {string|null|undefined} Icon name string, or null/undefined if not defined
     *
     * @example
     * const icon = runtime.getComponentIcon('Button');
     * // Returns: 'mouse-pointer-click' or null
     */
    getComponentIcon(componentName) {
        return this.getComponentExport(componentName, 'icon')
    }

    /**
     * Unwraps a component function and returns the AST by calling it.
     */
    unwrapComponentAST(callback) {
        // Unwrap component functions (_component marker)
        while (callback && callback._component) {
            callback = callback();
        }
        return callback
    }


    convertComponentProps(props) {
        return convertComponentProps.bind(this)(props)
    }

    /**
     * DEPRECATED
     * Calls a function within a registered component
     * @param {*} componentName 
     * @param {*} componentEntryPoint 
     * @returns 
     */
    call(componentName, componentEntryPoint = 'body', params, children, ...args) {
        const componentKeys = Object.keys(this.context);
        const functionList = componentKeys.join(', ');

        //console.log('call deprecated: ', componentName, componentEntryPoint);

        let func = null;
        if (this.functionCache[componentName] && this.functionCache[componentName][componentEntryPoint]) {
            //console.log(`[cache hit ${ componentName }.${ componentEntryPoint }]`)
            func = this.functionCache[componentName][componentEntryPoint];
        } else {
            //console.log(`[constructing ${ componentName }.${ componentEntryPoint }]`)
            func = new Function(`{ ${functionList} } `, `var exports = {}; ${this.components[componentName]}; return ${componentEntryPoint} `)(this.context);
            this.functionCache[componentName][componentEntryPoint] = func;
        }

        // Backward compatibility. Migrating props and metadata just to objects.
        if (typeof func === 'object') {
            return func
        }

        return func(params, children, ...args)
    }


    /**
     * Process the props for a component or a modifier ,expanding functions in arrays or values
     * @param {*} props 
     * @returns 
     */
    processProps(props) {
        if (props == null || typeof props != 'object') {
            return props
        }

        var newProps = { ...props };
        Object.keys(newProps).forEach(key => {
            let value = newProps[key];

            // Expand functions in arrays
            if (Array.isArray(value)) {
                newProps[key] = value.map(v =>
                    (typeof v === 'function' && v._component) ? v() : v
                );

                // If the value is an object, process its properties recursively
            } else if (typeof value === 'object' && value !== null) {
                newProps[key] = this.processProps(value);

                // Expand functions if value of key 
            } else if (typeof value === 'function' && value._component) {
                newProps[key] = newProps[key]();

                // Store any other setter functions
            } else if (typeof value === 'function' && (key.startsWith('set') || key.startsWith('on'))) {
                // Update from setWhateverKey to setWhateverKeyId;
                let setKey = key + 'Id';
                newProps[setKey] = this.storeFunction(value, this.currentPathId(key));
                delete newProps[key];
            }
        });
        return newProps
    }

    /**
     * Generate a unique identifier for the current hook path.
     *
     * @param {string|number} [name] - Optional segment to include in the path ID.
     * @returns {string} A comma-separated identifier
     */
    currentPathId(name) {
        const { path, childIndex } = this.hookState;
        let id = [this.rendererId ?? 0, ...path, name, childIndex].join(',');
        return id
    }

    /**
     * Creates a modifier function
     */
    #makeModifier(name, f) {

        const makeModifier = this.#makeModifier.bind(this);

        return (...args) => {

            const modifierContent = () => {

                const executeModifiedContent = (args) => {

                    // Capture the hook state so it can be maintained once the content is executed
                    const capturedHookState = { ...this.hookState };

                    // If this modifier is an id, store the name into the hook state so it can be used 
                    // for the hook path
                    if (name == 'id') {
                        this.hookState.modifierId = args[0];
                    }

                    // Will be a function to an inbuilt when modifying a custom component
                    let content = f();
                    if (typeof content === 'function') {
                        content = content();
                    }

                    // Reset hook state id
                    this.hookState.modifierId = null;

                    // Restore state
                    this.hookState = { ...capturedHookState };

                    return content
                };

                /**
                 * Find modifier that handles the content for this modifier.
                 * GenericModifier is the default if no specific modifier is found.
                 */
                const modifierFunction = this.modifierRegistry[name] ?? this.modifierRegistry['GenericModifier'];
                if (!modifierFunction) {
                    this.logger.warn(`Modifier ${name} not found`);
                    return {}
                }

                // Process args
                const processedArgs = args.map(arg => {
                    if (typeof arg === 'object' && !Array.isArray(arg)) {
                        return this.processProps(arg)
                    } else {
                        return arg
                    }
                });

                // Execute environment function provided by the modifier function if available
                var capturedEnvironment = null;
                if (modifierFunction.environmentValue) {
                    const result = modifierFunction.environmentValue(name, processedArgs, this.environment);

                    // If the modifier function returns a value, store it in the environment. 
                    if (result) {
                        capturedEnvironment = { ...this.environment };
                        const { key, value } = result;
                        this.environment[key] = value;
                    }
                }

                // Execute content
                const content = executeModifiedContent(processedArgs);

                // Restore environment if needed
                if (capturedEnvironment) {
                    this.environment = capturedEnvironment;
                }

                // Execute modifier function
                const { props: modifierProps, ast: modifierAst } = modifierFunction.bind(this)({ args: processedArgs, content: content, name: name });

                /**
                 * Modifier function can return either an AST or a new set of props. 
                 */

                // If the modifier function returns an AST, use it directly
                if (modifierAst) {

                    return modifierAst

                    // Otherwise, use the props to create a new modifier    
                } else {
                    return AST.ModifiedContent(AST.Directive(name, modifierProps, []), content)
                }

            };

            return new Proxy(modifierContent, {
                get: function (target, prop, receiver) {
                    if (prop == 'toJSON' || prop == 'type' || prop == 'children' || prop == 'props') {
                        return target[prop]
                    } else {
                        let modifierName = prop;

                        return makeModifier(modifierName, modifierContent, ...arguments)
                    }
                }
            })
        }
    }

    makeComponent(body, props, children) {
        //console.log('Make component', body, props, children)
        return this.#makeComponent(body, props, children)
    }

    /**
     * Creates a component
     */
    #makeComponent(body, props, children, componentName) {

        const f = () => {

            let { path, modifierId, childIndex, componentHookStore, currentComponent, forEachElementId } = this.hookState;

            // Push on to hook state path
            // Use id if specified otherwise use child index + component name to create a deterministct path to that item.
            var id = null;
            if (modifierId) {
                id = modifierId + componentName + '_' + childIndex;
            } else if (forEachElementId) {
                id = forEachElementId;
            } else {
                id = componentName + '_' + childIndex;
            }

            path.push(id);

            // Create path key. This is a unique key consistent across renders
            let hookKey = path.join('.');

            // Get hook storage for this component
            let hookStorage = componentHookStore[hookKey] ?? (componentHookStore[hookKey] = []);

            // Setup component hook state for the component we're about to call
            currentComponent.hookStorage = hookStorage;
            currentComponent.hookIndex = 0;

            // Call the content function
            let r = body(props, children);

            // Reset
            currentComponent.hookStorage = null;
            path.pop();

            return r
        };

        f._component = true;

        const makeModifier = this.#makeModifier.bind(this);

        return new Proxy(f, {
            get: function (target, prop, receiver) {
                if (prop == 'toJSON' || prop == 'type' || prop == 'children' || prop == 'props') {
                    return target[prop]
                }
                return makeModifier(prop, f, ...arguments)
            }
        })
    }

    #generateUniqueID() {
        return Math.random().toString(36).substring(7)
    }

    storeEnvironment(environmentId, options = {}) {
        const id = environmentId ?? this.#generateUniqueID();
        if (this.environment) {
            this.storedEnvironments[id] = { ...this.environment };
        }
        if (this.hookState) {
            this.storedHookStates[id] = { path: [...this.hookState.path], restoreHookStateStorage: options?.restoreHookStateStorage };
        }
        return id
    }

    restoreFunction(functionId) {
        return this.storedFunctions[functionId]
    }

    storeFunction(f, functionId) {
        const id = functionId ?? this.#generateUniqueID();
        this.storedFunctions[id] = f;
        return id
    }

    restoreData(dataId) {
        return this.storedData[dataId]
    }

    storeData(data, dataId) {
        const id = dataId ?? this.#generateUniqueID();
        this.storedData[id] = data;
        return id
    }

    setForEachElementId(id) {
        this.hookState.forEachElementId = id;
    }

    /**
    * Creates a built in component
    */
    #makeInBuiltComponent(type, args) {

        return this.#makeComponent((...componentArgs) => {

            const handler = this.componentRegistry[type] ?? this.componentRegistry['GenericComponent'];
            const { props, children, ast } = handler.bind(this)({ args: args, name: type });

            /**
             * Component AST
             */
            if (ast) {
                return ast
            } else {
                return AST.Directive(type, { ...props }, children ?? [])
            }

        }, args[0], args[1], type)
    }

    /**
     * 
     * Calls the contents of a ForEach function with a specific element and index.
     * 
     * @param {string} functionId 
     * @param {string?} environmentId 
     * @param {any} element 
     * @param {number} index 
     * @returns 
     */
    callForEachFunction(functionId, element, index) {
        let f = this.restoreFunction(functionId);
        let result = f(element, index);
        while (result && result._component) {
            result = result();
        }
        return result
    }

    /**
     * Gets a component from the context
     */
    getComponent(name) {
        return this.context[name]
    }
}

