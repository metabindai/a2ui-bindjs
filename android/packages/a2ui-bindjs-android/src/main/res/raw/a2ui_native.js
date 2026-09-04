"use strict";
var A2UI = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // src/native/global.ts
  var global_exports = {};
  __export(global_exports, {
    bridge: () => bridge
  });

  // src/engine/basicCatalog.generated.ts
  var BASIC_CATALOG_COMPONENTS = [
    "AudioPlayer",
    "Button",
    "Card",
    "CheckBox",
    "ChoicePicker",
    "Column",
    "DateTimeInput",
    "Divider",
    "Icon",
    "Image",
    "List",
    "Modal",
    "Row",
    "Slider",
    "Tabs",
    "Text",
    "TextField",
    "Video"
  ];
  var BASIC_CATALOG_SLOTS = {
    Button: [
      {
        prop: "child",
        kind: "single"
      }
    ],
    Card: [
      {
        prop: "child",
        kind: "single"
      }
    ],
    Column: [
      {
        prop: "children",
        kind: "list"
      }
    ],
    List: [
      {
        prop: "children",
        kind: "list"
      }
    ],
    Modal: [
      {
        prop: "trigger",
        kind: "single"
      },
      {
        prop: "content",
        kind: "single"
      }
    ],
    Row: [
      {
        prop: "children",
        kind: "list"
      }
    ],
    Tabs: [
      {
        prop: "tabs",
        kind: "objectList",
        childKey: "child"
      }
    ]
  };

  // src/engine/catalog.ts
  var BASIC_CATALOG_ID = "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json";
  var BASIC_CATALOG_ID_V0_9 = "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json";
  var BASIC_CATALOG_ID_V0_9_FLAT = "https://a2ui.org/specification/v0_9/basic_catalog.json";
  var BASIC_CATALOG_IDS = [BASIC_CATALOG_ID, BASIC_CATALOG_ID_V0_9, BASIC_CATALOG_ID_V0_9_FLAT];
  var STATEFUL_TYPES = /* @__PURE__ */ new Set(["ChoicePicker", "Modal", "Tabs"]);
  var BASIC_CATALOG = Object.fromEntries(
    BASIC_CATALOG_COMPONENTS.map((type) => [
      type,
      {
        component: `A2UI${type}`,
        slots: BASIC_CATALOG_SLOTS[type] ?? [],
        stateful: STATEFUL_TYPES.has(type)
      }
    ])
  );

  // src/catalog/basic/sources.generated.ts
  var BASIC_CATALOG_SOURCES = {
    "A2UIAudioPlayer": `// A2UI Basic Catalog \u2192 BindJS: \`AudioPlayer\`
//
// A2UI props: url (required), description.
// Interim implementation over the video built-in, kept short so it reads as a control
// strip rather than a video frame, pending a native audio builder.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface \u2014 bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

exports.default = defineComponent({
    metadata: {
        title: "A2UIAudioPlayer",
        description: "A2UI AudioPlayer primitive \u2014 interim implementation over the video built-in.",
        category: "A2UI",
    },

    properties: {
        url: { type: "string", required: true, defaultValue: "" },
        description: { type: "string", defaultValue: "" },
    },

    body: (props) => {
        const player = Video({ url: asText(props.url) }).frame({ maxWidth: Infinity, height: 64 }).cornerRadius(8)

        if (!props.description) {
            return player
        }

        return VStack({ spacing: 4, alignment: "leading" }, [
            Text(asText(props.description)).font("caption").foregroundStyle(Color("secondary")),
            player,
        ]).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [Self({ url: "https://example.com/track.mp3", description: "Episode 12" }).previewName("Default")],
});
`,
    "A2UIButton": '// A2UI Basic Catalog \u2192 BindJS: `Button`\n//\n// A2UI props: child (required label), variant, checks, plus an `action` on the node.\n//\n// The engine resolves the A2UI action \u2014 event name, resolved context, any local\n// functionCall \u2014 into a single `props.action` callback, so nothing about the wire\n// protocol reaches this component. Dispatch is the engine\'s job; this file is only\n// about how a button looks and that it is tappable.\n//\n// `checks` is how an agent gates a submit on the form being valid: each rule\'s\n// `condition` is resolved by the engine to a boolean, and a failing rule disables the\n// button rather than showing a message \u2014 the message belongs to the input it is about.\n\n/**\n * A rule\'s `condition` arrives one of two ways: a boolean, when it was a binding or a logic\n * function, or a `{ valid, message }` result from a validation function such as\n * `required` or `email`. Either spelling of failure counts, and the rule\'s own message\n * wins over the function\'s.\n */\nconst isFailure = (condition) =>\n    condition === false || (condition !== null && typeof condition === "object" && condition.valid === false)\n\nconst failedChecks = (checks) =>\n    (Array.isArray(checks) ? checks : [])\n        .filter((rule) => rule && typeof rule === "object" && isFailure(rule.condition))\n        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? "Invalid" }))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIButton",\n        description: "A2UI Button primitive \u2014 variant styling over an engine-supplied action.",\n        category: "A2UI",\n    },\n\n    properties: {\n        variant: { type: "enum", options: ["default", "primary", "borderless"], defaultValue: "default" },\n        enabled: { type: "boolean", defaultValue: true },\n    },\n\n    body: (props, children) => {\n        // `properties.defaultValue` is inspector metadata and is NOT applied at runtime,\n        // so an omitted `enabled` arrives as undefined \u2014 compare against false, because\n        // `!undefined` would disable every button that never set the prop.\n        const enabled = props.enabled !== false && failedChecks(props.checks).length === 0\n        const action = typeof props.action === "function" ? props.action : () => {}\n        const label = children && children.length > 0 ? HStack({ spacing: 6 }, children) : Text("Button")\n\n        let styled\n\n        if (props.variant === "primary") {\n            styled = label\n                .padding({ horizontal: 16, vertical: 10 })\n                .background(Color("accent"))\n                .foregroundStyle(Color("white"))\n                .cornerRadius(10)\n        } else if (props.variant === "borderless") {\n            styled = label.padding({ horizontal: 4, vertical: 4 }).foregroundStyle(Color("accent"))\n        } else {\n            styled = label\n                .padding({ horizontal: 16, vertical: 10 })\n                .background(Color("quaternary"))\n                .cornerRadius(10)\n        }\n\n        const button = Button(styled, action)\n\n        return enabled ? button : button.disabled(true).opacity(0.5)\n    },\n\n    previews: [\n        Self({ variant: "primary" }, [Text("Add to cart")]).previewName("Primary"),\n        Self({}, [Text("Cancel")]).previewName("Default"),\n        Self({ variant: "borderless" }, [Text("Learn more")]).previewName("Borderless"),\n        Self({ variant: "primary", enabled: false }, [Text("Unavailable")]).previewName("Disabled"),\n        Self({ variant: "primary", checks: [{ condition: false, message: "Fill in the form first" }] }, [Text("Submit")]).previewName(\n            "Gated by a check"\n        ),\n    ],\n});\n',
    "A2UICard": '// A2UI Basic Catalog \u2192 BindJS: `Card`\n//\n// A2UI props: child (required).\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UICard",\n        description: "A2UI Card primitive \u2014 elevated container for a single child.",\n        category: "A2UI",\n    },\n\n    properties: {},\n\n    body: (props, children) => {\n        return VStack({ spacing: 0, alignment: "leading" }, children ?? [])\n            .padding(16)\n            .frame({ maxWidth: Infinity, alignment: "leading" })\n            .background(Color("background"))\n            .cornerRadius(12)\n            .shadow()\n    },\n\n    previews: [Self({}, [Text("Card contents")]).previewName("Default")],\n});\n',
    "A2UICheckBox": '// A2UI Basic Catalog \u2192 BindJS: `CheckBox`\n//\n// A2UI props: label, value (two-way bound boolean), checks.\n// Stateless for the same reason as A2UITextField \u2014 the data model owns the value.\n// The first failing check is shown under the control in red.\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface - bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? "" : String(value))\n\n/**\n * A rule\'s `condition` arrives one of two ways: a boolean, when it was a binding or a logic\n * function, or a `{ valid, message }` result from a validation function such as\n * `required` or `email`. Either spelling of failure counts, and the rule\'s own message\n * wins over the function\'s.\n */\nconst isFailure = (condition) =>\n    condition === false || (condition !== null && typeof condition === "object" && condition.valid === false)\n\nconst failedChecks = (checks) =>\n    (Array.isArray(checks) ? checks : [])\n        .filter((rule) => rule && typeof rule === "object" && isFailure(rule.condition))\n        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? "Invalid" }))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UICheckBox",\n        description: "A2UI CheckBox primitive \u2014 controlled boolean toggle.",\n        category: "A2UI",\n    },\n\n    properties: {\n        label: { type: "string", defaultValue: "" },\n        value: { type: "boolean", defaultValue: false },\n    },\n\n    body: (props) => {\n        const setIsOn = typeof props.setValue === "function" ? props.setValue : () => {}\n        const failed = failedChecks(props.checks)\n\n        const toggle = Toggle({ label: asText(props.label), isOn: props.value === true, setIsOn }).frame({ maxWidth: Infinity })\n\n        if (failed.length === 0) {\n            return toggle\n        }\n\n        return VStack({ spacing: 4, alignment: "leading" }, [\n            toggle,\n            Text(asText(failed[0].message)).font("caption").foregroundStyle(Color("red")),\n        ]).frame({ maxWidth: Infinity, alignment: "leading" })\n    },\n\n    previews: [\n        Self({ label: "Subscribe to updates", value: true }).previewName("Checked"),\n        Self({ label: "Subscribe to updates", value: false }).previewName("Unchecked"),\n        Self({\n            label: "I accept the terms",\n            value: false,\n            checks: [{ condition: false, message: "You need to accept the terms to continue" }],\n        }).previewName("Failing a check"),\n    ],\n});\n',
    "A2UIChoicePicker": "// A2UI Basic Catalog \u2192 BindJS: `ChoicePicker`\n//\n// A2UI props: label, options (array of { label, value }), value, variant, displayStyle,\n// filterable, checks.\n//\n// Two things here are easy to get wrong, and were:\n//\n//   - Selection mode comes from `variant` \u2014 \"mutuallyExclusive\" (the default) or\n//     \"multipleSelection\". There is no boolean.\n//   - `value` is a DynamicStringList: it is *always* an array, even when only one option\n//     may be selected. Writing a bare value back would not round-trip.\n//\n// Single selection is a `Picker`, so each platform draws its own control: a segmented\n// control on iOS, a `<select>` on the web. `displayStyle` is a hint, and the platform's\n// native single-select control answers it better than either of the styles it names \u2014 so\n// it only chooses between chips and checkbox rows for multiple selection.\n//\n// Beyond a handful of options a segmented control is unreadable, so the style drops to\n// `automatic` (a menu natively, the same `<select>` on the web).\n//\n// `filterable` adds a search field above the options. The filter text is renderer state \u2014\n// A2UI has nowhere in the data model to put it \u2014 which is why this component is listed\n// in `STATEFUL_TYPES`: its output changes without any A2UI input changing.\n\n/**\n * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? '' : String(value))\n\n/**\n * A rule's `condition` arrives one of two ways: a boolean, when it was a binding or a logic\n * function, or a `{ valid, message }` result from a validation function such as\n * `required` or `email`. Either spelling of failure counts, and the rule's own message\n * wins over the function's.\n */\nconst isFailure = (condition) =>\n    condition === false || (condition !== null && typeof condition === 'object' && condition.valid === false)\n\nconst failedChecks = (checks) =>\n    (Array.isArray(checks) ? checks : [])\n        .filter((rule) => rule && typeof rule === 'object' && isFailure(rule.condition))\n        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? 'Invalid' }))\n\n/** More than this in a segmented control and the labels stop being readable. */\nconst SEGMENTED_LIMIT = 5\n\nconst optionValue = (option) => (option && typeof option === 'object' ? option.value : option)\nconst optionLabel = (option) => asText(option && typeof option === 'object' ? (option.label ?? option.value) : option)\n\nconst matchesFilter = (option, filter) => optionLabel(option).toLowerCase().indexOf(filter.toLowerCase()) >= 0\n\nexports.default = defineComponent({\n    metadata: {\n        title: 'A2UIChoicePicker',\n        description: 'A2UI ChoicePicker primitive \u2014 chips or checkbox rows, single or multiple selection.',\n        category: 'A2UI',\n    },\n\n    properties: {\n        label: { type: 'string', defaultValue: '' },\n        variant: { type: 'enum', options: ['mutuallyExclusive', 'multipleSelection'], defaultValue: 'mutuallyExclusive' },\n        displayStyle: { type: 'enum', options: ['chips', 'checkbox'], defaultValue: 'checkbox' },\n        filterable: { type: 'boolean', defaultValue: false },\n    },\n\n    body: (props) => {\n        // Called unconditionally: hook state is keyed by call order within the component.\n        const [filter, setFilter] = useState('')\n\n        const allOptions = Array.isArray(props.options) ? props.options : []\n        const filterable = props.filterable === true\n        const options = filterable && filter ? allOptions.filter((option) => matchesFilter(option, filter)) : allOptions\n        const selected = Array.isArray(props.value) ? props.value : props.value === undefined ? [] : [props.value]\n        const setValue = typeof props.setValue === 'function' ? props.setValue : () => {}\n        const failed = failedChecks(props.checks)\n\n        const multiple = props.variant === 'multipleSelection'\n\n        // Only the multiple-selection branches reach this; single selection is a Picker,\n        // which reports the new value rather than a change to the old one.\n        const toggle = (value) => {\n            const isOn = selected.indexOf(value) >= 0\n\n            return setValue(isOn ? selected.filter((entry) => entry !== value) : selected.concat([value]))\n        }\n\n        // Built as arrays so the props-form of a layout gets a literal `Component[]`,\n        // which `metabind validate` checks for statically.\n        const caption = props.label\n            ? [Text(asText(props.label)).font('caption').foregroundStyle(Color(failed.length > 0 ? 'red' : 'secondary'))]\n            : []\n\n        const search = filterable\n            ? [\n                  TextField({ placeholder: 'Search options', text: filter, setText: setFilter })\n                      .padding(8)\n                      .background(Color('quaternary'))\n                      .cornerRadius(8),\n              ]\n            : []\n\n        const error = failed.length > 0 ? [Text(asText(failed[0].message)).font('caption').foregroundStyle(Color('red'))] : []\n\n        const wrap = (control) =>\n            VStack({ spacing: 8, alignment: 'leading' }, [...caption, ...search, ...control, ...error]).frame({\n                maxWidth: Infinity,\n                alignment: 'leading',\n            })\n\n        // One choice: the platform's own control, which is the whole point of naming a\n        // component rather than describing a layout.\n        if (!multiple) {\n            const items = options.map((option) => Text(optionLabel(option)).tag(asText(optionValue(option))))\n\n            // The label is empty because the caption above already carries it \u2014 a segmented\n            // control does not show one, but a menu would, and it would read twice.\n            const picker = Picker('', [asText(selected[0]), (value) => setValue([value])], items).pickerStyle(\n                options.length > SEGMENTED_LIMIT ? 'automatic' : 'segmented'\n            )\n\n            return wrap([picker])\n        }\n\n        if (props.displayStyle === 'chips') {\n            const chips = options.map((option) => {\n                const value = optionValue(option)\n                const isOn = selected.indexOf(value) >= 0\n\n                const chip = Text(optionLabel(option))\n                    .font('subheadline')\n                    .padding({ horizontal: 14, vertical: 8 })\n                    .background(Color(isOn ? 'accent' : 'clear'))\n                    .foregroundStyle(Color(isOn ? 'white' : 'primary'))\n                    .cornerRadius(999)\n                    .id(optionLabel(option + (isOn ? '1' : '0')))\n\n                return Button(chip, () => toggle(value)).id(optionLabel(option + (isOn ? '1' : '0')))\n            })\n\n            return wrap([HStack({ spacing: 8 }, chips)])\n        }\n\n        const rows = options.map((option) => {\n            const value = optionValue(option)\n\n            return Toggle({\n                label: optionLabel(option),\n                isOn: selected.indexOf(value) >= 0,\n                setIsOn: () => toggle(value),\n            })\n        })\n\n        return wrap(rows)\n    },\n\n    previews: [\n        Self({\n            label: 'Cooking style',\n            variant: 'mutuallyExclusive',\n            displayStyle: 'chips',\n            value: ['Grilled'],\n            options: [\n                { label: 'Grilled', value: 'Grilled' },\n                { label: 'Baked', value: 'Baked' },\n            ],\n        }).previewName('Segmented, single'),\n\n        Self({\n            label: 'Portion',\n            variant: 'mutuallyExclusive',\n            value: ['4'],\n            options: ['1', '2', '3', '4', '6', '8', '12'].map((size) => ({ label: size, value: size })),\n        }).previewName('Too many for segments'),\n\n        Self({\n            label: 'Toppings',\n            variant: 'multipleSelection',\n            displayStyle: 'checkbox',\n            value: ['cheese'],\n            options: [\n                { label: 'Cheese', value: 'cheese' },\n                { label: 'Basil', value: 'basil' },\n            ],\n        }).previewName('Checkboxes, multiple'),\n\n        Self({\n            label: 'Country',\n            variant: 'mutuallyExclusive',\n            filterable: true,\n            value: [],\n            options: ['Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'Denmark'].map((name) => ({\n                label: name,\n                value: name,\n            })),\n        }).previewName('Filterable'),\n\n        Self({\n            label: 'Size',\n            variant: 'mutuallyExclusive',\n            value: [],\n            options: [\n                { label: 'Small', value: 's' },\n                { label: 'Large', value: 'l' },\n            ],\n            checks: [{ condition: false, message: 'Pick a size' }],\n        }).previewName('Failing a check'),\n    ],\n})\n",
    "A2UIColumn": '// A2UI Basic Catalog \u2192 BindJS: `Column`\n//\n// A2UI props: children (required), justify, align.\n// The vertical twin of A2UIRow \u2014 see that file for the Spacer-based justify notes.\n\nconst ALIGNMENT = { start: "leading", center: "center", end: "trailing", stretch: "leading" }\n\n// The stack sizes to its widest child, so its own placement inside the full-width frame\n// has to follow `align` too \u2014 pinned leading, a centred stack of short children sits on\n// the left of the card with its children centred on each other, which reads as nothing.\nconst FRAME_ALIGNMENT = { start: "leading", center: "center", end: "trailing", stretch: "leading" }\n\nconst interleave = (items) => items.flatMap((child, index) => (index === 0 ? [child] : [Spacer(), child]))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIColumn",\n        description: "A2UI Column primitive \u2014 vertical container with justify / align distribution.",\n        category: "A2UI",\n    },\n\n    properties: {\n        justify: {\n            type: "enum",\n            options: ["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly", "stretch"],\n            defaultValue: "start",\n        },\n        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "stretch" },\n        spacing: { type: "number", defaultValue: 12 },\n    },\n\n    body: (props, children) => {\n        const justify = props.justify ?? "start"\n\n        // `weight` lets a child claim a share of the height \u2014 equal shares, for the reasons\n        // in A2UIRow. Only the engine can see each child node\'s weight, so it passes them\n        // down as `childWeights`.\n        const weights = Array.isArray(props.childWeights) ? props.childWeights : []\n\n        const items = (children ?? []).map((child, index) => {\n            const weight = weights[index]\n\n            if (typeof weight === "number" && weight > 0) {\n                return child.frame({ maxHeight: Infinity, alignment: "top" })\n            }\n\n            if (justify === "stretch") {\n                return child.frame({ maxHeight: Infinity })\n            }\n\n            return child\n        })\n\n        let laidOut = items\n\n        if (justify === "center") {\n            laidOut = [Spacer(), ...items, Spacer()]\n        } else if (justify === "end") {\n            laidOut = [Spacer(), ...items]\n        } else if (justify === "spaceBetween") {\n            laidOut = interleave(items)\n        } else if (justify === "spaceAround" || justify === "spaceEvenly") {\n            laidOut = [Spacer(), ...interleave(items), Spacer()]\n        }\n\n        // Distributed layouts own their gaps; a stack spacing on top would double them.\n        const distributed = justify === "spaceBetween" || justify === "spaceAround" || justify === "spaceEvenly"\n        const spacing = distributed ? 0 : (props.spacing ?? 12)\n\n        return VStack({ spacing, alignment: ALIGNMENT[props.align] || ALIGNMENT.stretch }, laidOut)\n            .frame({ maxWidth: Infinity, alignment: FRAME_ALIGNMENT[props.align] || FRAME_ALIGNMENT.stretch })\n    },\n\n    previews: [Self({}, [Text("First"), Text("Second"), Text("Third")]).previewName("Default")],\n});\n',
    "A2UIDateTimeInput": '// A2UI Basic Catalog \u2192 BindJS: `DateTimeInput`\n//\n// A2UI props: label, value (two-way bound ISO 8601 string), enableDate, enableTime, min,\n// max, checks.\n//\n// `enableDate` and `enableTime` are independent booleans rather than one mode: a component\n// may offer a date, a time, or both. Both default to false in the spec, and a component\n// that asks for neither is treated as asking for a date \u2014 the same reading the official\n// SwiftUI catalog takes, so an agent that forgot the flags gets the same field everywhere.\n//\n// Interim implementation: an ISO text field. BindJS registers a DatePicker name, but\n// neither backend draws one yet, and it would exchange Date objects while A2UI\'s data\n// model carries ISO strings \u2014 so the conversion belongs here once a native builder lands.\n// `min` and `max` are carried into the caption rather than enforced, because a text field\n// cannot constrain them and silently dropping them would hide a constraint the agent asked\n// for.\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface - bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? "" : String(value))\n\n/**\n * A rule\'s `condition` arrives one of two ways: a boolean, when it was a binding or a logic\n * function, or a `{ valid, message }` result from a validation function such as\n * `required` or `email`. Either spelling of failure counts, and the rule\'s own message\n * wins over the function\'s.\n */\nconst isFailure = (condition) =>\n    condition === false || (condition !== null && typeof condition === "object" && condition.valid === false)\n\nconst failedChecks = (checks) =>\n    (Array.isArray(checks) ? checks : [])\n        .filter((rule) => rule && typeof rule === "object" && isFailure(rule.condition))\n        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? "Invalid" }))\n\n/** What the field is asking for, which decides the hint and the placeholder. */\nconst shapeOf = (props) => {\n    const time = props.enableTime === true\n    const date = props.enableDate === true || !time\n\n    if (date && !time) {\n        return { placeholder: "YYYY-MM-DD", noun: "date" }\n    }\n\n    if (time && !date) {\n        return { placeholder: "HH:MM", noun: "time" }\n    }\n\n    return { placeholder: "YYYY-MM-DDTHH:MM", noun: "date and time" }\n}\n\n/** `min` and `max` are advisory here, so they are shown rather than enforced. */\nconst rangeOf = (props) => {\n    const min = asText(props.min)\n    const max = asText(props.max)\n\n    if (min && max) {\n        return `${min} to ${max}`\n    }\n\n    if (min) {\n        return `from ${min}`\n    }\n\n    if (max) {\n        return `until ${max}`\n    }\n\n    return ""\n}\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIDateTimeInput",\n        description: "A2UI DateTimeInput primitive \u2014 controlled ISO 8601 input for a date, a time, or both.",\n        category: "A2UI",\n    },\n\n    properties: {\n        label: { type: "string", defaultValue: "" },\n        value: { type: "string", defaultValue: "" },\n        enableDate: { type: "boolean", defaultValue: false },\n        enableTime: { type: "boolean", defaultValue: false },\n        min: { type: "string", defaultValue: "" },\n        max: { type: "string", defaultValue: "" },\n    },\n\n    body: (props) => {\n        const shape = shapeOf(props)\n        const range = rangeOf(props)\n        const setText = typeof props.setValue === "function" ? props.setValue : () => {}\n        const failed = failedChecks(props.checks)\n\n        const field = TextField({ placeholder: shape.placeholder, text: asText(props.value), setText })\n            .padding(10)\n            .background(Color("quaternary"))\n            .cornerRadius(8)\n\n        // Built as arrays so the props-form of a layout gets a literal `Component[]`,\n        // which `metabind validate` checks for statically.\n        const caption = props.label\n            ? [Text(asText(props.label)).font("caption").foregroundStyle(Color(failed.length > 0 ? "red" : "secondary"))]\n            : []\n\n        const hint = range\n            ? [Text(`${shape.noun}, ${range}`).font("caption").foregroundStyle(Color("secondary"))]\n            : []\n\n        const error = failed.length > 0 ? [Text(asText(failed[0].message)).font("caption").foregroundStyle(Color("red"))] : []\n\n        if (caption.length === 0 && hint.length === 0 && error.length === 0) {\n            return field\n        }\n\n        return VStack({ spacing: 4, alignment: "leading" }, [...caption, field, ...hint, ...error]).frame({\n            maxWidth: Infinity,\n            alignment: "leading",\n        })\n    },\n\n    previews: [\n        Self({ label: "Departure", value: "2026-02-02", enableDate: true }).previewName("Date only"),\n        Self({ label: "Reminder", value: "09:30", enableTime: true }).previewName("Time only"),\n        Self({\n            label: "Event",\n            value: "2026-02-02T18:00",\n            enableDate: true,\n            enableTime: true,\n            min: "2026-01-01",\n            max: "2026-12-31",\n        }).previewName("Date and time, bounded"),\n        Self({\n            label: "Check-in",\n            value: "",\n            enableDate: true,\n            checks: [{ condition: false, message: "Choose a check-in date" }],\n        }).previewName("Failing a check"),\n    ],\n});\n',
    "A2UIDivider": '// A2UI Basic Catalog \u2192 BindJS: `Divider`\n//\n// A2UI props: axis.\n//\n// BindJS\'s `Divider` draws a horizontal rule and has no orientation of its own, so a\n// vertical divider is a one-point-wide filled rectangle instead. Both are one line the\n// length of their container, which is what the component means either way.\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIDivider",\n        description: "A2UI Divider primitive \u2014 a horizontal or vertical rule.",\n        category: "A2UI",\n    },\n\n    properties: {\n        axis: { type: "enum", options: ["horizontal", "vertical"], defaultValue: "horizontal" },\n    },\n\n    body: (props) => {\n        if (props.axis === "vertical") {\n            return Rectangle()\n                .foregroundStyle(Color("quaternary"))\n                .frame({ width: 1, maxHeight: Infinity })\n        }\n\n        return Divider()\n    },\n\n    previews: [\n        Self({}).previewName("Horizontal"),\n        Self({ axis: "vertical" }).previewName("Vertical"),\n    ],\n});\n',
    "A2UIIcon": '// A2UI Basic Catalog \u2192 BindJS: `Icon`\n//\n// A2UI props: name (required) \u2014 one of 59 platform-neutral names, `{ svgPath }` carrying\n// inline path data, or a binding resolving to either.\n//\n// The names are A2UI\'s own vocabulary and belong to no platform, so they have to be\n// translated. `Image({ systemName })` resolves against SF Symbols on Apple platforms, and\n// bindjs-android maps those same SF names onto Material icons \u2014 its `SYSTEM_ICONS` table\n// is built for exactly the symbols below. Passing an A2UI name straight through sends\n// `shoppingCart` to a symbol set that calls it `cart`, which does not throw: it draws\n// nothing while `.frame(size)` goes on reserving the space.\n\n/** A2UI icon name \u2192 SF Symbol. The keys are the spec\'s enum, and `icons.test.ts` says so. */\nconst SYMBOLS = {\n    accountCircle: "person.crop.circle",\n    add: "plus",\n    arrowBack: "arrow.left",\n    arrowForward: "arrow.right",\n    attachFile: "paperclip",\n    calendarToday: "calendar",\n    call: "phone",\n    camera: "camera",\n    check: "checkmark",\n    close: "xmark",\n    delete: "trash",\n    download: "arrow.down.circle",\n    edit: "pencil",\n    event: "calendar.badge.clock",\n    error: "exclamationmark.circle",\n    fastForward: "forward",\n    favorite: "heart.fill",\n    favoriteOff: "heart",\n    folder: "folder",\n    help: "questionmark.circle",\n    home: "house",\n    info: "info.circle",\n    locationOn: "location",\n    lock: "lock",\n    lockOpen: "lock.open",\n    mail: "envelope",\n    menu: "line.3.horizontal",\n    moreVert: "ellipsis",\n    moreHoriz: "ellipsis",\n    notificationsOff: "bell.slash",\n    notifications: "bell",\n    pause: "pause",\n    payment: "creditcard",\n    person: "person",\n    phone: "phone",\n    photo: "photo",\n    play: "play",\n    print: "printer",\n    refresh: "arrow.clockwise",\n    rewind: "backward",\n    search: "magnifyingglass",\n    send: "paperplane",\n    settings: "gearshape",\n    share: "square.and.arrow.up",\n    shoppingCart: "cart",\n    skipNext: "forward.end",\n    skipPrevious: "backward.end",\n    star: "star.fill",\n    starHalf: "star.leadinghalf.filled",\n    starOff: "star",\n    stop: "stop",\n    upload: "arrow.up.circle",\n    visibility: "eye",\n    visibilityOff: "eye.slash",\n    volumeDown: "speaker.wave.1",\n    volumeMute: "speaker",\n    volumeOff: "speaker.slash",\n    volumeUp: "speaker.wave.3",\n    warning: "exclamationmark.triangle",\n}\n\n/**\n * Drawn when the name is not one of the 59.\n *\n * A visible placeholder rather than nothing, because an agent naming an icon we do not\n * have is a normal event and a gap in the layout reads as a rendering bug.\n */\nconst FALLBACK_SYMBOL = "questionmark.circle"\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface \u2014 bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? \'\' : String(value))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIIcon",\n        description: "A2UI Icon primitive \u2014 named platform symbols or inline SVG path data.",\n        category: "A2UI",\n    },\n\n    properties: {\n        // Also accepts `{ svgPath }` and, for the shape this component used to take, a\n        // bare path or document string. The inspector has no union type to say that in.\n        name: { type: "string", required: true, defaultValue: "star" },\n        size: { type: "number", defaultValue: 24 },\n    },\n\n    body: (props) => {\n        const size = props.size ?? 24\n        const document = svgDocument(props.name)\n\n        if (document) {\n            return Image({ svg: document })\n                .resizable()\n                .aspectRatio({ contentMode: "fit" })\n                .frame({ width: size, height: size })\n        }\n\n        const name = asText(props.name)\n\n        if (!name) {\n            return Empty()\n        }\n\n        return Image({ systemName: SYMBOLS[name] ?? FALLBACK_SYMBOL })\n            .resizable()\n            .aspectRatio({ contentMode: "fit" })\n            .frame({ width: size, height: size })\n    },\n\n    previews: [\n        Self({ name: "favorite" }).previewName("Named"),\n        Self({ name: "shoppingCart", size: 32 }).previewName("Named 32pt"),\n        Self({ name: { svgPath: "M12 2L2 22h20L12 2z" } }).previewName("Path data"),\n    ],\n});\n\n/**\n * The SVG to draw, or `""` when the prop names an icon instead.\n *\n * Two shapes reach here. `{ svgPath }` is what v1.0 specifies; a bare string holding path\n * data or a whole document is what this component accepted before, and is kept because no\n * icon name can be mistaken for either \u2014 the 59 are all lowercase-initial words.\n */\nfunction svgDocument(value) {\n    const isWrapper = value !== null && typeof value === "object"\n    const raw = isWrapper ? asText(value.svgPath) : asText(value)\n\n    if (raw.indexOf("<svg") === 0) {\n        return raw\n    }\n\n    if (isWrapper || raw.charAt(0) === "M") {\n        return raw ? wrapSvgPath(raw) : ""\n    }\n\n    return ""\n}\n\n/**\n * A2UI ships bare Material path data, whose coordinates assume a 24\xD724 canvas the path\n * itself does not carry. Without the viewBox the glyph draws at whatever size the\n * renderer guesses.\n */\nfunction wrapSvgPath(path) {\n    return \'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="\' + path + \'"/></svg>\'\n}\n',
    "A2UIImage": '// A2UI Basic Catalog \u2192 BindJS: `Image`\n//\n// A2UI props: url (required), description (alt text), fit, variant.\n//\n// `variant` is A2UI\'s size hint, and the names are the spec\'s: `icon` and `avatar` are\n// fixed squares (an avatar is round), the three `*Feature` sizes and `header` are\n// full-width bands with a fixed height so images in a stream do not each pick their own\n// intrinsic size. The heights follow the official SwiftUI catalog.\n//\n// `fit` has five spec values but BindJS draws two: `contain` and `scaleDown` fit inside\n// the frame, everything else fills it. A header always fills \u2014 it is a band, and a\n// letterboxed band is not one.\n\nconst VARIANTS = {\n    icon: { width: 24, height: 24, radius: 0 },\n    avatar: { width: 40, height: 40, circle: true },\n    smallFeature: { maxWidth: 100, height: 100 },\n    mediumFeature: { height: 200 },\n    largeFeature: { height: 320 },\n    header: { height: 200, cover: true, radius: 0 },\n}\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface \u2014 bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? \'\' : String(value))\n\nconst contentModeFor = (fit, variant) => {\n    if (variant.cover) {\n        return "fill"\n    }\n\n    return fit === "contain" || fit === "scaleDown" ? "fit" : "fill"\n}\n\nconst frameFor = (variant) => {\n    if (variant.width) {\n        return { width: variant.width, height: variant.height }\n    }\n\n    return { maxWidth: variant.maxWidth ?? Infinity, height: variant.height }\n}\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIImage",\n        description: "A2UI Image primitive with fit and size-variant mapping.",\n        category: "A2UI",\n    },\n\n    properties: {\n        url: { type: "string", required: true, defaultValue: "" },\n        description: { type: "string", defaultValue: "" },\n        fit: { type: "enum", options: ["contain", "cover", "fill", "none", "scaleDown"], defaultValue: "fill" },\n        variant: { type: "enum", options: Object.keys(VARIANTS), defaultValue: "mediumFeature" },\n    },\n\n    body: (props) => {\n        const variant = VARIANTS[props.variant] ?? VARIANTS.mediumFeature\n\n        const sized = Image({ url: asText(props.url) })\n            .resizable()\n            .aspectRatio({ contentMode: contentModeFor(props.fit, variant) })\n            .frame(frameFor(variant))\n            .clipped()\n\n        let shaped\n\n        if (variant.circle) {\n            shaped = sized.clipShape(Circle())\n        } else if (variant.radius === 0) {\n            shaped = sized\n        } else {\n            shaped = sized.cornerRadius(8)\n        }\n\n        return props.description ? shaped.accessibilityLabel(asText(props.description)) : shaped\n    },\n\n    previews: [\n        Self({ url: "https://picsum.photos/600/400", description: "Scenery" }).previewName("Medium feature"),\n        Self({ url: "https://picsum.photos/200", variant: "avatar", description: "Profile" }).previewName("Avatar"),\n        Self({ url: "https://picsum.photos/1200/400", variant: "header" }).previewName("Header"),\n        Self({ url: "https://picsum.photos/64", variant: "icon" }).previewName("Icon"),\n    ],\n});\n',
    "A2UIList": '// A2UI Basic Catalog \u2192 BindJS: `List`\n//\n// A2UI props: children (required \u2014 often the template form), direction, align.\n//\n// Lazy stacks inside a ScrollView are the point of this component: the engine emits\n// template children as a BindJS ForEach, which builds rows on demand, and LazyVStack\n// recycles them natively on iOS / Android.\n\nconst V_ALIGN = { start: "leading", center: "center", end: "trailing", stretch: "leading" }\nconst H_ALIGN = { start: "top", center: "center", end: "bottom", stretch: "top" }\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIList",\n        description: "A2UI List primitive \u2014 scrollable lazy stack, vertical or horizontal.",\n        category: "A2UI",\n    },\n\n    properties: {\n        direction: { type: "enum", options: ["vertical", "horizontal"], defaultValue: "vertical" },\n        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "stretch" },\n        spacing: { type: "number", defaultValue: 8 },\n    },\n\n    body: (props, children) => {\n        const items = children ?? []\n        const spacing = props.spacing ?? 8\n\n        if (props.direction === "horizontal") {\n            return ScrollView({ axis: "horizontal", showsIndicators: false }, [\n                LazyHStack({ spacing, alignment: H_ALIGN[props.align] || "top" }, items),\n            ])\n        }\n\n        return ScrollView({ axis: "vertical", showsIndicators: true }, [\n            LazyVStack({ spacing, alignment: V_ALIGN[props.align] || "leading" }, items),\n        ])\n    },\n\n    previews: [\n        Self({}, [Text("Row 1"), Text("Row 2"), Text("Row 3")]).previewName("Vertical"),\n        Self({ direction: "horizontal" }, [Text("A"), Text("B"), Text("C")]).previewName("Horizontal"),\n    ],\n});\n',
    "A2UIModal": '// A2UI Basic Catalog \u2192 BindJS: `Modal`\n//\n// A2UI props: trigger (required), content (required) \u2014 both component ids, built by\n// the engine and passed here as components.\n//\n// As with Tabs, the v1.0 basic catalog gives Modal no property for open state, so it is\n// renderer state by definition.\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIModal",\n        description: "A2UI Modal primitive \u2014 a trigger that reveals overlay content.",\n        category: "A2UI",\n    },\n\n    properties: {},\n\n    body: (props) => {\n        const [open, setOpen] = useState(false)\n\n        const trigger = Button(props.trigger ?? Text("Open"), () => setOpen(true))\n\n        if (!open) {\n            return trigger\n        }\n\n        const header = HStack({ spacing: 8 }, [\n            Spacer(),\n            Button(Text("Close").font("subheadline").foregroundStyle(Color("accent")), () => setOpen(false)),\n        ])\n\n        const panel = VStack({ spacing: 12, alignment: "leading" }, [header, props.content ?? Empty()])\n            .padding(16)\n            .frame({ maxWidth: Infinity, alignment: "leading" })\n            .background(Color("background"))\n            .cornerRadius(14)\n\n        return VStack({ spacing: 12, alignment: "leading" }, [trigger, panel])\n    },\n\n    previews: [Self({ trigger: Text("Open"), content: Text("Are you sure?") }).previewName("Closed")],\n});\n',
    "A2UIRow": '// A2UI Basic Catalog \u2192 BindJS: `Row`\n//\n// A2UI props: children (required), justify, align.\n//\n// justify distributes along the main (horizontal) axis. BindJS has no justify modifier,\n// so the distributions are spelt out with Spacers \u2014 which is also how the official\n// SwiftUI catalog does it. `spaceAround` and `spaceEvenly` both put a Spacer at each end\n// and between every pair; a Spacer cannot be told to be half of another, so `spaceAround`\n// is drawn as `spaceEvenly`. `stretch` gives every child the whole width to share.\n\n// The spec\'s default is `stretch`. A horizontal stack cannot make a child taller, so it is\n// drawn as `top` \u2014 the reading the official SwiftUI catalog takes \u2014 rather than `center`,\n// which would float a short column against a tall one.\nconst ALIGNMENT = { start: "top", center: "center", end: "bottom", stretch: "top" }\n\n/** Where the stack sits in its full-width frame when no Spacer is pushing it anywhere. */\nconst FRAME_ALIGNMENT = { start: "leading", center: "center", end: "trailing" }\n\nconst interleave = (items) => items.flatMap((child, index) => (index === 0 ? [child] : [Spacer(), child]))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIRow",\n        description: "A2UI Row primitive \u2014 horizontal container with justify / align distribution.",\n        category: "A2UI",\n    },\n\n    properties: {\n        justify: {\n            type: "enum",\n            options: ["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly", "stretch"],\n            defaultValue: "start",\n        },\n        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "stretch" },\n        spacing: { type: "number", defaultValue: 16 },\n    },\n\n    body: (props, children) => {\n        const justify = props.justify ?? "start"\n\n        // `weight` lets a child claim a share of the width. Only the engine can see each\n        // child node\'s weight, so it passes them down as `childWeights`.\n        //\n        // Weighted children share the row equally, as the official SwiftUI catalog does.\n        // The ratio is not honoured: a stack has no proportional flex, and `layoutPriority`\n        // is not one either \u2014 it hands the whole row to the highest priority first, which\n        // left the financial-grid example with one visible column and rows the height\n        // of the screen. Cells are leading-aligned so a grid reads as a grid.\n        const weights = Array.isArray(props.childWeights) ? props.childWeights : []\n\n        const items = (children ?? []).map((child, index) => {\n            const weight = weights[index]\n\n            if (typeof weight === "number" && weight > 0) {\n                return child.frame({ maxWidth: Infinity, alignment: "leading" })\n            }\n\n            if (justify === "stretch") {\n                return child.frame({ maxWidth: Infinity })\n            }\n\n            return child\n        })\n\n        let laidOut = items\n\n        if (justify === "center") {\n            laidOut = [Spacer(), ...items, Spacer()]\n        } else if (justify === "end") {\n            laidOut = [Spacer(), ...items]\n        } else if (justify === "spaceBetween") {\n            laidOut = interleave(items)\n        } else if (justify === "spaceAround" || justify === "spaceEvenly") {\n            laidOut = [Spacer(), ...interleave(items), Spacer()]\n        }\n\n        // Distributed layouts own their gaps; a stack spacing on top would double them.\n        const distributed = justify === "spaceBetween" || justify === "spaceAround" || justify === "spaceEvenly"\n        const spacing = distributed ? 0 : (props.spacing ?? 16)\n\n        return HStack({ spacing, alignment: ALIGNMENT[props.align] || ALIGNMENT.stretch }, laidOut)\n            .frame({ maxWidth: Infinity, alignment: FRAME_ALIGNMENT[justify] || "leading" })\n    },\n\n    previews: [\n        Self({}, [Text("One"), Text("Two")]).previewName("Start"),\n        Self({ justify: "spaceBetween" }, [Text("Left"), Text("Right")]).previewName("Space between"),\n        Self({ justify: "spaceEvenly" }, [Text("A"), Text("B"), Text("C")]).previewName("Space evenly"),\n    ],\n});\n',
    "A2UISlider": '// A2UI Basic Catalog \u2192 BindJS: `Slider`\n//\n// A2UI props: label, value (two-way bound number), min, max, steps, checks.\n//\n// `steps` is the number of discrete divisions across the range, not the size of one \u2014\n// so the step size is derived here. BindJS\'s Slider callback is already named `setValue`,\n// which is exactly what the engine injects for a path-bound `value`.\n//\n// The current value is shown beside the label, as the official SwiftUI catalog does: a\n// slider with no readout tells the user where the thumb is and nothing else.\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface - bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? "" : String(value))\n\n/**\n * A rule\'s `condition` arrives one of two ways: a boolean, when it was a binding or a logic\n * function, or a `{ valid, message }` result from a validation function such as\n * `required` or `email`. Either spelling of failure counts, and the rule\'s own message\n * wins over the function\'s.\n */\nconst isFailure = (condition) =>\n    condition === false || (condition !== null && typeof condition === "object" && condition.valid === false)\n\nconst failedChecks = (checks) =>\n    (Array.isArray(checks) ? checks : [])\n        .filter((rule) => rule && typeof rule === "object" && isFailure(rule.condition))\n        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? "Invalid" }))\n\n/** Whole numbers read as such; anything else keeps its fraction. */\nconst formatValue = (value) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UISlider",\n        description: "A2UI Slider primitive \u2014 controlled numeric slider with optional discrete steps.",\n        category: "A2UI",\n    },\n\n    properties: {\n        label: { type: "string", defaultValue: "" },\n        value: { type: "number", defaultValue: 0 },\n        min: { type: "number", defaultValue: 0 },\n        max: { type: "number", defaultValue: 100 },\n        steps: { type: "number" },\n    },\n\n    body: (props) => {\n        const lowerBound = typeof props.min === "number" ? props.min : 0\n        const upperBound = typeof props.max === "number" && props.max > lowerBound ? props.max : lowerBound + 100\n        const value = typeof props.value === "number" ? props.value : lowerBound\n        const setValue = typeof props.setValue === "function" ? props.setValue : () => {}\n        const steps = typeof props.steps === "number" && props.steps > 0 ? Math.floor(props.steps) : 0\n        const failed = failedChecks(props.checks)\n\n        const slider = Slider({\n            value,\n            setValue,\n            lowerBound,\n            upperBound,\n            step: steps > 0 ? (upperBound - lowerBound) / steps : null,\n            label: asText(props.label),\n        })\n\n        // Built as arrays so the props-form of a layout gets a literal `Component[]`,\n        // which `metabind validate` checks for statically.\n        const header = props.label\n            ? [\n                  HStack({ spacing: 8 }, [\n                      Text(asText(props.label)).font("caption").foregroundStyle(Color(failed.length > 0 ? "red" : "secondary")),\n                      Spacer(),\n                      Text(formatValue(value)).font("caption").monospaced().foregroundStyle(Color("secondary")),\n                  ]),\n              ]\n            : []\n\n        const error = failed.length > 0 ? [Text(asText(failed[0].message)).font("caption").foregroundStyle(Color("red"))] : []\n\n        if (header.length === 0 && error.length === 0) {\n            return slider\n        }\n\n        return VStack({ spacing: 4, alignment: "leading" }, [...header, slider, ...error]).frame({\n            maxWidth: Infinity,\n            alignment: "leading",\n        })\n    },\n\n    previews: [\n        Self({ label: "Budget", value: 40, min: 0, max: 100, steps: 20 }).previewName("Stepped"),\n        Self({ label: "Volume", value: 0.35, min: 0, max: 1 }).previewName("Continuous"),\n        Self({ label: "Guests", value: 0, min: 0, max: 12, checks: [{ condition: false, message: "Invite at least one guest" }] }).previewName(\n            "Failing a check"\n        ),\n    ],\n});\n',
    "A2UITabs": '// A2UI Basic Catalog \u2192 BindJS: `Tabs`\n//\n// A2UI props: tabs (required) \u2014 an array of { title, child }, where `child` is a\n// component id. The engine builds each id and hands this component the array with the\n// built component in place of the id.\n//\n// The v1.0 basic catalog gives Tabs no property for the selected tab, so the selection\n// is renderer state by definition \u2014 there is nowhere in the data model to put it.\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UITabs",\n        description: "A2UI Tabs primitive \u2014 a title strip over one visible panel.",\n        category: "A2UI",\n    },\n\n    properties: {},\n\n    body: (props) => {\n        const tabs = Array.isArray(props.tabs) ? props.tabs : []\n        const [selected, setSelected] = useState(0)\n        const active = Math.min(selected, Math.max(tabs.length - 1, 0))\n\n        const strip = tabs.map((tab, index) => {\n            const title = String((tab && tab.title) ?? "Tab " + (index + 1))\n\n            const label = index === active\n                ? Text(title).font("subheadline").fontWeight("semibold").foregroundStyle(Color("accent"))\n                : Text(title).font("subheadline").foregroundStyle(Color("secondary"))\n\n            return Button(label.padding({ horizontal: 12, vertical: 8 }), () => setSelected(index))\n        })\n\n        const panel = tabs.length > 0 && tabs[active] ? tabs[active].child : null\n\n        return VStack({ spacing: 12, alignment: "leading" }, [\n            ScrollView({ axis: "horizontal", showsIndicators: false }, [HStack({ spacing: 4 }, strip)]),\n            Divider(),\n            panel ?? Empty(),\n        ]).frame({ maxWidth: Infinity, alignment: "leading" })\n    },\n\n    previews: [\n        Self({\n            tabs: [\n                { title: "Overview", child: Text("Overview panel") },\n                { title: "Details", child: Text("Details panel") },\n            ],\n        }).previewName("Two tabs"),\n    ],\n});\n',
    "A2UIText": '// A2UI Basic Catalog \u2192 BindJS: `Text`\n//\n// A2UI props: text (required), variant.\n//\n// Platform note carried over from the first implementation: only the object form\n// `Text({ markdown })` is honoured by bindjs-apple\'s TextComponent (it maps to\n// SwiftUI Text(LocalizedStringKey:)). `Markdown(text)` has no native builder and\n// `Text(string)` renders nothing on iOS \u2014 so the object form is the only safe\n// spelling for a component that must work on every backend.\n//\n// The v1.0 basic catalog only defines ("body" | "caption"), but agents routinely\n// emit h1\u2013h5. Unrecognised variants would silently collapse to body and flatten\n// every heading, so all seven are mapped onto the platform type ramp.\n//\n// Block markdown is parsed here rather than left to the backend. The spec\'s own route to a\n// heading is `# Heading` \u2014 `variant` has no heading value \u2014 and 19 of its 43 examples use\n// it. The web backend draws blocks itself, but `Text(LocalizedStringKey:)` natively handles\n// inline markdown only and shows the hashes. So a value with block syntax becomes a stack:\n// headings on the same type ramp as the variants, list items with their markers, code on a\n// quiet background, quotes behind a bar. A value with none stays one `Text`, unchanged.\n// Only a marker at column zero counts; `" - Qty: "` is a fragment in a row, not a list.\n\nconst HEADING_STYLES = {\n    h1: "title",\n    h2: "title2",\n    h3: "title3",\n    h4: "headline",\n    h5: "subheadline",\n}\n\n/** `#` through `######`; anything past five hashes reads as the smallest heading. */\nconst HEADING_LEVELS = ["h1", "h2", "h3", "h4", "h5", "h5"]\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface - bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? "" : String(value))\n\n// MARK: - Block parsing\n\nconst HEADING = /^(#{1,6})\\s+(.*)$/\nconst BULLET = /^[-*]\\s+(.*)$/\nconst NUMBER = /^(\\d+)\\.\\s+(.*)$/\nconst QUOTE = /^>\\s?(.*)$/\nconst FENCE = /^```/\n\nconst startsBlock = (line) => HEADING.test(line) || BULLET.test(line) || NUMBER.test(line) || QUOTE.test(line) || FENCE.test(line)\n\n/** True when any line opens a block, which is the only case that needs the stack. */\nconst hasBlocks = (text) => text.split("\\n").some(startsBlock)\n\n/** Consecutive lines matching `pattern`, mapped through it, from `start`. */\nconst runOf = (lines, start, pattern, pick) => {\n    const items = []\n    let index = start\n\n    while (index < lines.length && pattern.test(lines[index])) {\n        items.push(pick(pattern.exec(lines[index])))\n        index += 1\n    }\n\n    return { items, next: index }\n}\n\nconst parseBlocks = (text) => {\n    const lines = text.split("\\n")\n    const blocks = []\n    let index = 0\n\n    while (index < lines.length) {\n        const line = lines[index]\n\n        if (line.trim() === "") {\n            index += 1\n        } else if (FENCE.test(line)) {\n            const code = []\n            index += 1\n\n            while (index < lines.length && !FENCE.test(lines[index])) {\n                code.push(lines[index])\n                index += 1\n            }\n\n            blocks.push({ kind: "code", text: code.join("\\n") })\n            index += 1\n        } else if (HEADING.test(line)) {\n            const match = HEADING.exec(line)\n\n            blocks.push({ kind: "heading", level: match[1].length, text: match[2].trim() })\n            index += 1\n        } else if (QUOTE.test(line)) {\n            const run = runOf(lines, index, QUOTE, (match) => match[1])\n\n            blocks.push({ kind: "quote", text: run.items.join("\\n") })\n            index = run.next\n        } else if (BULLET.test(line)) {\n            const run = runOf(lines, index, BULLET, (match) => match[1])\n\n            blocks.push({ kind: "bullets", items: run.items })\n            index = run.next\n        } else if (NUMBER.test(line)) {\n            const run = runOf(lines, index, NUMBER, (match) => `${match[1]}. ${match[2]}`)\n\n            blocks.push({ kind: "bullets", items: run.items })\n            index = run.next\n        } else {\n            const paragraph = []\n\n            while (index < lines.length && lines[index].trim() !== "" && !startsBlock(lines[index])) {\n                paragraph.push(lines[index])\n                index += 1\n            }\n\n            blocks.push({ kind: "paragraph", text: paragraph.join("\\n") })\n        }\n    }\n\n    return blocks\n}\n\n// MARK: - Drawing\n\n/** A heading on the type ramp \u2014 the same one the h1\u2013h5 variants use. */\nconst heading = (text, variant) => {\n    const style = HEADING_STYLES[variant]\n\n    // Each branch builds its own Text: hanging two modifier stacks off one shared\n    // instance renders nothing on the web backend.\n    if (variant === "h5") {\n        return Text({ markdown: text }).font(style).multilineTextAlignment("leading")\n    }\n\n    return Text({ markdown: text }).font(style).fontWeight("semibold").multilineTextAlignment("leading")\n}\n\n/**\n * Running text at the variant\'s size: body or caption.\n *\n * Body is the platform\'s body font \u2014 17pt on iOS \u2014 which is what the official SwiftUI\n * catalog draws it at. It was `subheadline` (15pt) here, which left every body value in\n * every example two points smaller than the reference renderer.\n */\nconst paragraph = (text, variant) => {\n    if (variant === "caption") {\n        return Text({ markdown: text }).font("caption").foregroundStyle(Color("secondary")).multilineTextAlignment("leading")\n    }\n\n    return Text({ markdown: text }).font("body").multilineTextAlignment("leading")\n}\n\nconst bullets = (items, variant) =>\n    VStack(\n        { spacing: 4, alignment: "leading" },\n        items.map((item) => paragraph(/^\\d+\\. /.test(item) ? item : `\u2022 ${item}`, variant))\n    )\n\nconst code = (text) =>\n    Text({ markdown: text })\n        .font("callout")\n        .monospaced()\n        .padding(8)\n        .frame({ maxWidth: Infinity, alignment: "leading" })\n        .background(Color("quaternary"))\n        .cornerRadius(6)\n\nconst quote = (text, variant) =>\n    HStack({ spacing: 8, alignment: "top" }, [\n        Rectangle().foregroundStyle(Color("quaternary")).frame({ width: 3, maxHeight: Infinity }),\n        paragraph(text, variant).foregroundStyle(Color("secondary")),\n    ])\n\nconst draw = (block, variant) => {\n    if (block.kind === "heading") {\n        return heading(block.text, HEADING_LEVELS[block.level - 1])\n    }\n\n    if (block.kind === "bullets") {\n        return bullets(block.items, variant)\n    }\n\n    if (block.kind === "code") {\n        return code(block.text)\n    }\n\n    if (block.kind === "quote") {\n        return quote(block.text, variant)\n    }\n\n    return paragraph(block.text, variant)\n}\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIText",\n        description: "A2UI Text primitive \u2014 headings, body or caption, with simple Markdown.",\n        category: "A2UI",\n    },\n\n    properties: {\n        text: { type: "string", required: true, defaultValue: "", inspector: { control: "multiline", markdown: true } },\n        variant: { type: "enum", options: ["h1", "h2", "h3", "h4", "h5", "body", "caption"] },\n    },\n\n    body: (props) => {\n        const text = asText(props.text)\n\n        if (HEADING_STYLES[props.variant]) {\n            return heading(text, props.variant)\n        }\n\n        if (!hasBlocks(text)) {\n            return paragraph(text, props.variant)\n        }\n\n        const pieces = parseBlocks(text).map((block) => draw(block, props.variant))\n\n        // One block \u2014 `### Location`, say \u2014 is just that block, so the parent\'s alignment\n        // still reaches it. Several are stacked, and the stack sizes to its content for\n        // the same reason: a full-width leading frame here would override a centred Column.\n        if (pieces.length === 1) {\n            return pieces[0]\n        }\n\n        return VStack({ spacing: 8, alignment: "leading" }, pieces)\n    },\n\n    previews: [\n        Self({ text: "Heading one", variant: "h1" }).previewName("h1"),\n        Self({ text: "Heading three", variant: "h3" }).previewName("h3"),\n        Self({ text: "The quick brown fox jumps over the lazy dog." }).previewName("Body"),\n        Self({ text: "Updated 5 minutes ago", variant: "caption" }).previewName("Caption"),\n        Self({ text: "Supports **bold**, _italic_ and [links](https://a2ui.org)." }).previewName("Markdown"),\n        Self({\n            text: "# Heading 1\\n\\nThis is **bold** text and *italic* text.\\n\\n- List item 1\\n- List item 2\\n\\n> A quote\\n\\n```\\nlet x = 1\\n```",\n        }).previewName("Block markdown"),\n    ],\n});\n',
    "A2UITextField": '// A2UI Basic Catalog \u2192 BindJS: `TextField`\n//\n// A2UI props: label (required), value (two-way bound), placeholder, variant, checks.\n//\n// The data model owns the value. The engine resolves `value` and injects `setValue`,\n// which writes back to the bound JSON Pointer \u2014 so this component is stateless and\n// there is only ever one copy of the truth.\n//\n// Validation is `checks`: rules whose `condition` the engine has already resolved to a\n// boolean. The first failing rule\'s message is shown under the field in red and the\n// label turns red with it, which is what the official SwiftUI catalog does.\n//\n// The `number` variant asks for a decimal keyboard. That is a native modifier \u2014 the web\n// backend does not know it and ignores it, which is fine: a browser keyboard is already\n// a full one.\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface - bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? "" : String(value))\n\n/**\n * A rule\'s `condition` arrives one of two ways: a boolean, when it was a binding or a logic\n * function, or a `{ valid, message }` result from a validation function such as\n * `required` or `email`. Either spelling of failure counts, and the rule\'s own message\n * wins over the function\'s.\n */\nconst isFailure = (condition) =>\n    condition === false || (condition !== null && typeof condition === "object" && condition.valid === false)\n\nconst failedChecks = (checks) =>\n    (Array.isArray(checks) ? checks : [])\n        .filter((rule) => rule && typeof rule === "object" && isFailure(rule.condition))\n        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? "Invalid" }))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UITextField",\n        description: "A2UI TextField primitive \u2014 controlled input over an engine-supplied setValue.",\n        category: "A2UI",\n    },\n\n    properties: {\n        label: { type: "string", required: true, defaultValue: "Label" },\n        value: { type: "string", defaultValue: "" },\n        placeholder: { type: "string", defaultValue: "" },\n        variant: { type: "enum", options: ["shortText", "longText", "number", "obscured"], defaultValue: "shortText" },\n    },\n\n    body: (props) => {\n        const text = props.value === undefined || props.value === null ? "" : String(props.value)\n        const setText = typeof props.setValue === "function" ? props.setValue : () => {}\n        const placeholder = asText(props.placeholder)\n        const failed = failedChecks(props.checks)\n        const hasError = failed.length > 0\n\n        let input\n\n        if (props.variant === "longText") {\n            input = TextEditor({ text, setText }).frame({ minHeight: 96 })\n        } else if (props.variant === "obscured") {\n            input = SecureField({ placeholder, text, setText })\n        } else if (props.variant === "number") {\n            input = TextField({ placeholder, text, setText }).keyboardType("decimalPad")\n        } else {\n            input = TextField({ placeholder, text, setText })\n        }\n\n        const field = input.padding(10).background(Color("quaternary")).cornerRadius(8)\n\n        const rows = [\n            Text(asText(props.label)).font("caption").foregroundStyle(Color(hasError ? "red" : "secondary")),\n            field,\n        ]\n\n        if (hasError) {\n            rows.push(Text(asText(failed[0].message)).font("caption").foregroundStyle(Color("red")))\n        }\n\n        return VStack({ spacing: 4, alignment: "leading" }, rows).frame({ maxWidth: Infinity, alignment: "leading" })\n    },\n\n    previews: [\n        Self({ label: "Full name", value: "Jane Doe", placeholder: "Jane Doe" }).previewName("Short text"),\n        Self({ label: "Notes", variant: "longText", value: "Two scoops." }).previewName("Long text"),\n        Self({ label: "Password", variant: "obscured", value: "hunter2" }).previewName("Obscured"),\n        Self({ label: "Quantity", variant: "number", value: "2" }).previewName("Number"),\n        Self({\n            label: "Email",\n            value: "nope",\n            checks: [{ condition: false, message: "Enter a valid email address" }],\n        }).previewName("Failing a check"),\n    ],\n});\n',
    "A2UIVideo": '// A2UI Basic Catalog \u2192 BindJS: `Video`\n//\n// A2UI props: url (required), posterUrl, description.\n// `Video` is a registered BindJS built-in. The web backend honours a `poster` frame; the\n// native one does not read it yet and ignores the key, so it is passed rather than\n// dropped and used as the accessibility description as well.\n\n/**\n * A2UI\'s DynamicString resolves to whatever the data model holds, so a binding can arrive\n * as a number or a boolean. Builders that expect a string throw on those, and the throw\n * takes out the whole surface \u2014 bindjs-react\'s ErrorBoundary renders an empty div.\n */\nconst asText = (value) => (value === null || value === undefined ? \'\' : String(value))\n\nexports.default = defineComponent({\n    metadata: {\n        title: "A2UIVideo",\n        description: "A2UI Video primitive with standard playback controls.",\n        category: "A2UI",\n    },\n\n    properties: {\n        url: { type: "string", required: true, defaultValue: "" },\n        posterUrl: { type: "string", defaultValue: "" },\n        description: { type: "string", defaultValue: "" },\n    },\n\n    body: (props) => {\n        const poster = asText(props.posterUrl)\n        const source = poster ? { url: asText(props.url), poster } : { url: asText(props.url) }\n\n        const player = Video(source).frame({ maxWidth: Infinity, height: 220 }).cornerRadius(8)\n\n        return props.description ? player.accessibilityLabel(asText(props.description)) : player\n    },\n\n    previews: [\n        Self({ url: "https://example.com/clip.mp4" }).previewName("Default"),\n        Self({ url: "https://example.com/clip.mp4", posterUrl: "https://picsum.photos/600/340" }).previewName("With poster"),\n    ],\n});\n'
  };

  // src/catalog/register.ts
  function registerCatalog(runtime, options = {}) {
    const sources = options.sources ?? BASIC_CATALOG_SOURCES;
    for (const [name, source] of Object.entries(sources)) {
      runtime.registerComponent(name, source);
    }
    return options.catalog ?? BASIC_CATALOG;
  }

  // src/protocol/types.ts
  function isPathBinding(value) {
    if (!isPlainObject(value)) {
      return false;
    }
    return typeof value.path === "string" && !("call" in value);
  }
  function isFunctionCall(value) {
    if (!isPlainObject(value)) {
      return false;
    }
    return typeof value.call === "string";
  }
  var ROOT_COMPONENT_ID = "root";
  function isChildTemplate(value) {
    if (!isPlainObject(value)) {
      return false;
    }
    return typeof value.componentId === "string";
  }
  var AGENT_MESSAGE_TYPES = [
    "createSurface",
    "updateComponents",
    "updateDataModel",
    "deleteSurface",
    "callRendererFunction",
    "agentFunctionResponse"
  ];
  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  // src/store/jsonPointer.ts
  function isAbsolutePath(path) {
    return path.startsWith("/");
  }
  function parsePointer(path) {
    if (path === "" || path === "/") {
      return [];
    }
    const body = path.startsWith("/") ? path.slice(1) : path;
    return body.split("/").map(unescapeToken);
  }
  function joinPointer(tokens) {
    if (tokens.length === 0) {
      return "/";
    }
    return "/" + tokens.map(escapeToken).join("/");
  }
  function resolvePath(path, scope = "/") {
    if (isAbsolutePath(path)) {
      return joinPointer(parsePointer(path));
    }
    if (path === "") {
      return joinPointer(parsePointer(scope));
    }
    return joinPointer([...parsePointer(scope), ...parsePointer(path)]);
  }
  function escapeToken(token) {
    return token.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  function unescapeToken(token) {
    return token.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  function getAt(data, path) {
    let current = data;
    for (const token of parsePointer(path)) {
      if (current === null || current === void 0) {
        return void 0;
      }
      if (Array.isArray(current)) {
        const index2 = Number(token);
        if (!Number.isInteger(index2)) {
          return void 0;
        }
        current = current[index2];
        continue;
      }
      if (typeof current === "object") {
        current = current[token];
        continue;
      }
      return void 0;
    }
    return current;
  }
  function setAt(data, path, value) {
    const tokens = parsePointer(path);
    if (tokens.length === 0) {
      return value;
    }
    return setTokens(data, tokens, value);
  }
  function setTokens(node, tokens, value) {
    const [head, ...rest] = tokens;
    const isIndexToken = /^\d+$/.test(head) || head === "-";
    const shouldBeArray = Array.isArray(node) || node == null && isIndexToken;
    if (shouldBeArray) {
      const array = Array.isArray(node) ? [...node] : [];
      const index2 = head === "-" ? array.length : Number(head);
      array[index2] = rest.length > 0 ? setTokens(array[index2], rest, value) : value;
      return array;
    }
    const isObject = node !== null && typeof node === "object" && !Array.isArray(node);
    const object = isObject ? { ...node } : {};
    object[head] = rest.length > 0 ? setTokens(object[head], rest, value) : value;
    return object;
  }
  function deleteAt(data, path) {
    const tokens = parsePointer(path);
    if (tokens.length === 0) {
      return {};
    }
    return deleteTokens(data, tokens) ?? {};
  }
  function deleteTokens(node, tokens) {
    if (node === null || node === void 0 || typeof node !== "object") {
      return node;
    }
    const [head, ...rest] = tokens;
    if (Array.isArray(node)) {
      const index2 = Number(head);
      const inRange = Number.isInteger(index2) && index2 >= 0 && index2 < node.length;
      if (!inRange) {
        return node;
      }
      const array = [...node];
      if (rest.length > 0) {
        array[index2] = deleteTokens(array[index2], rest);
      } else {
        array.splice(index2, 1);
      }
      return array;
    }
    if (!(head in node)) {
      return node;
    }
    const object = { ...node };
    if (rest.length > 0) {
      object[head] = deleteTokens(object[head], rest);
    } else {
      delete object[head];
    }
    return object;
  }

  // src/functions/resolve.ts
  var STRUCTURAL_KEYS = /* @__PURE__ */ new Set(["id", "component", "catalogId", "children", "child", "action"]);
  function resolvePropsExcept(component, skip, context) {
    const skipped = new Set(skip);
    const props = {};
    for (const [key, value] of Object.entries(component)) {
      if (STRUCTURAL_KEYS.has(key) || skipped.has(key)) {
        continue;
      }
      const resolved = resolveValue(value, context);
      if (resolved !== void 0) {
        props[key] = resolved;
      }
    }
    return props;
  }
  function resolveValue(value, context) {
    if (isPathBinding(value)) {
      return readPath(value.path, context);
    }
    if (isFunctionCall(value)) {
      return callFunction(value.call, value.args, context);
    }
    if (Array.isArray(value)) {
      return value.map((entry) => resolveValue(entry, context) ?? null);
    }
    if (isPlainObject(value)) {
      return resolveObject(value, context);
    }
    return value;
  }
  function resolveActionContext(actionContext, context) {
    if (actionContext === void 0) {
      return void 0;
    }
    return resolveObject(actionContext, context);
  }
  function resolveObject(source, context) {
    const result = {};
    for (const [key, value] of Object.entries(source)) {
      const resolved = resolveValue(value, context);
      if (resolved !== void 0) {
        result[key] = resolved;
      }
    }
    return result;
  }
  function readPath(path, context) {
    const absolute = resolvePath(path, context.scope ?? "/");
    const value = getAt(context.dataModel, absolute);
    context.onRead?.(absolute, value);
    return value;
  }
  function callFunction(name, args, context) {
    const { registry } = context;
    try {
      if (!registry) {
        throw new Error(`Cannot call '${name}': no function registry was provided.`);
      }
      const resolvedArgs = args === void 0 ? {} : resolveObject(args, context);
      return registry.call(name, resolvedArgs, functionContext(context), context.caller ?? "renderer");
    } catch (error) {
      if (!context.onError) {
        throw error;
      }
      context.onError(error, { call: name, args });
      return void 0;
    }
  }
  function functionContext(context) {
    return {
      getValue: (path) => readPath(path, context),
      scope: context.scope ?? "/",
      index: context.index,
      locale: context.locale,
      timeZone: context.timeZone,
      openUrl: context.openUrl,
      call: (name, args) => callFunction(name, args, context)
    };
  }

  // src/engine/types.ts
  function catalogEntry(value) {
    if (value === void 0) {
      return void 0;
    }
    return typeof value === "string" ? { component: value } : value;
  }
  var DEFAULT_SLOTS = [
    { prop: "child", kind: "single" },
    { prop: "children", kind: "list" }
  ];
  var DEFAULT_MAX_DEPTH = 50;
  var DEFAULT_MAX_NODES = 1e4;

  // src/engine/render.ts
  var KEY_PROP = "__a2uiKey";
  var _cache, _pending, _options, _signature, _catalog, _catalogs, _registry, _diagnostics, _nodeCount, _reused, _maxDepth, _maxNodes, _RenderSession_instances, keyOf_fn, isValid_fn, harvest_fn, build_fn, catalogFor_fn, buildSlots_fn, buildObjectList_fn, buildChildList_fn, buildTemplate_fn, propsFor_fn, contextFor_fn, dispatch_fn, weightsFor_fn, reuse_fn, placeholder_fn, present_fn, report_fn;
  var RenderSession = class {
    constructor() {
      __privateAdd(this, _RenderSession_instances);
      __privateAdd(this, _cache, /* @__PURE__ */ new Map());
      __privateAdd(this, _pending, /* @__PURE__ */ new Map());
      __privateAdd(this, _options);
      __privateAdd(this, _signature);
      __privateAdd(this, _catalog);
      __privateAdd(this, _catalogs);
      __privateAdd(this, _registry);
      __privateAdd(this, _diagnostics, []);
      __privateAdd(this, _nodeCount, 0);
      __privateAdd(this, _reused, 0);
      __privateAdd(this, _maxDepth, DEFAULT_MAX_DEPTH);
      __privateAdd(this, _maxNodes, DEFAULT_MAX_NODES);
    }
    /** Drops every cached subtree. */
    clear() {
      __privateGet(this, _cache).clear();
    }
    render(options) {
      __privateSet(this, _options, options);
      __privateSet(this, _maxDepth, options.maxDepth ?? DEFAULT_MAX_DEPTH);
      __privateSet(this, _maxNodes, options.maxNodes ?? DEFAULT_MAX_NODES);
      __privateSet(this, _diagnostics, []);
      __privateSet(this, _pending, /* @__PURE__ */ new Map());
      __privateSet(this, _nodeCount, 0);
      __privateSet(this, _reused, 0);
      const signature = [options.surface.id, options.locale, options.timeZone].join(" ");
      const stale = signature !== __privateGet(this, _signature) || options.catalog !== __privateGet(this, _catalog) || options.catalogs !== __privateGet(this, _catalogs) || options.registry !== __privateGet(this, _registry);
      if (stale) {
        __privateSet(this, _signature, signature);
        __privateSet(this, _catalog, options.catalog);
        __privateSet(this, _catalogs, options.catalogs);
        __privateSet(this, _registry, options.registry);
        __privateGet(this, _cache).clear();
      }
      const root = options.surface.components.get(ROOT_COMPONENT_ID);
      if (!root) {
        __privateMethod(this, _RenderSession_instances, report_fn).call(this, "MISSING_ROOT", `Surface '${options.surface.id}' has no 'root' component.`);
        return { ast: void 0, diagnostics: __privateGet(this, _diagnostics), nodeCount: 0, reused: 0 };
      }
      const built = __privateMethod(this, _RenderSession_instances, build_fn).call(this, ROOT_COMPONENT_ID, "/", void 0, 0, /* @__PURE__ */ new Set());
      const ast = built === void 0 ? void 0 : __privateGet(this, _options).runtime.unwrapComponentAST(built);
      __privateMethod(this, _RenderSession_instances, harvest_fn).call(this, ast);
      return { ast, diagnostics: __privateGet(this, _diagnostics), nodeCount: __privateGet(this, _nodeCount), reused: __privateGet(this, _reused) };
    }
  };
  _cache = new WeakMap();
  _pending = new WeakMap();
  _options = new WeakMap();
  _signature = new WeakMap();
  _catalog = new WeakMap();
  _catalogs = new WeakMap();
  _registry = new WeakMap();
  _diagnostics = new WeakMap();
  _nodeCount = new WeakMap();
  _reused = new WeakMap();
  _maxDepth = new WeakMap();
  _maxNodes = new WeakMap();
  _RenderSession_instances = new WeakSet();
  // MARK: Cache
  keyOf_fn = function(id, scope) {
    return `${scope} ${id}`;
  };
  /**
   * True when a node and everything under it would rebuild to exactly what is cached:
   * same definition object, same values at every path it read, and valid children.
   */
  isValid_fn = function(id, scope, visiting = /* @__PURE__ */ new Set()) {
    const key = __privateMethod(this, _RenderSession_instances, keyOf_fn).call(this, id, scope);
    if (visiting.has(key)) {
      return false;
    }
    const entry = __privateGet(this, _cache).get(key);
    if (!entry || __privateGet(this, _options).surface.components.get(id) !== entry.definition) {
      return false;
    }
    const { dataModel } = __privateGet(this, _options).surface;
    for (const [path, value] of entry.reads) {
      if (getAt(dataModel, path) !== value) {
        return false;
      }
    }
    visiting.add(key);
    for (const child of entry.children) {
      if (!__privateMethod(this, _RenderSession_instances, isValid_fn).call(this, child.id, child.scope, visiting)) {
        visiting.delete(key);
        return false;
      }
    }
    visiting.delete(key);
    return true;
  };
  /** Indexes the freshly built subtrees out of the unwrapped AST. */
  harvest_fn = function(ast) {
    if (__privateGet(this, _pending).size === 0) {
      return;
    }
    const seen = /* @__PURE__ */ new WeakSet();
    const visit = (node) => {
      if (node === null || typeof node !== "object") {
        return;
      }
      if (seen.has(node)) {
        return;
      }
      seen.add(node);
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (!isPlainObject(node)) {
        return;
      }
      const call = node;
      const key = call.type === "ComponentCall" ? call.props?.props?.[KEY_PROP] : void 0;
      if (typeof key === "string") {
        const pending = __privateGet(this, _pending).get(key);
        if (pending) {
          __privateGet(this, _cache).set(key, { ...pending, ast: node });
          __privateGet(this, _pending).delete(key);
        }
      }
      for (const value of Object.values(node)) {
        visit(value);
      }
    };
    visit(ast);
  };
  // MARK: Building
  /**
   * Builds one component. `scope` is the JSON Pointer of the enclosing template
   * element; `ancestors` carries the ids on the current path for cycle detection.
   */
  build_fn = function(componentId, scope, index2, depth, ancestors) {
    if (depth > __privateGet(this, _maxDepth)) {
      __privateMethod(this, _RenderSession_instances, report_fn).call(this, "DEPTH_EXCEEDED", `Maximum depth of ${__privateGet(this, _maxDepth)} exceeded.`, componentId);
      return void 0;
    }
    if (__privateGet(this, _nodeCount) >= __privateGet(this, _maxNodes)) {
      __privateMethod(this, _RenderSession_instances, report_fn).call(this, "NODE_LIMIT", `Maximum of ${__privateGet(this, _maxNodes)} components exceeded.`, componentId);
      return void 0;
    }
    if (ancestors.has(componentId)) {
      __privateMethod(this, _RenderSession_instances, report_fn).call(this, "CYCLE", `Component '${componentId}' contains itself.`, componentId);
      return void 0;
    }
    const node = __privateGet(this, _options).surface.components.get(componentId);
    if (!node) {
      __privateMethod(this, _RenderSession_instances, report_fn).call(this, "MISSING_COMPONENT", `No component with id '${componentId}'.`, componentId);
      return void 0;
    }
    const catalog = __privateMethod(this, _RenderSession_instances, catalogFor_fn).call(this, node, componentId);
    if (!catalog) {
      return void 0;
    }
    const entry = catalogEntry(catalog[node.component]);
    if (!entry) {
      __privateMethod(this, _RenderSession_instances, report_fn).call(this, "UNKNOWN_COMPONENT", `No catalog entry for component type '${node.component}'.`, componentId);
      return void 0;
    }
    const registry = __privateGet(this, _options).runtime.components;
    if (registry !== void 0 && registry[entry.component] === void 0) {
      __privateMethod(this, _RenderSession_instances, report_fn).call(this, "UNREGISTERED_COMPONENT", `Catalog maps '${node.component}' to '${entry.component}', which is not registered on the runtime.`, componentId);
      return void 0;
    }
    const key = __privateMethod(this, _RenderSession_instances, keyOf_fn).call(this, componentId, scope);
    if (__privateMethod(this, _RenderSession_instances, isValid_fn).call(this, componentId, scope)) {
      __privateSet(this, _reused, __privateGet(this, _reused) + 1);
      return __privateMethod(this, _RenderSession_instances, reuse_fn).call(this, __privateGet(this, _cache).get(key).ast);
    }
    __privateSet(this, _nodeCount, __privateGet(this, _nodeCount) + 1);
    const reads = [];
    const children = [];
    const context = __privateMethod(this, _RenderSession_instances, contextFor_fn).call(this, scope, index2, componentId, reads);
    const slotProps = (entry.slots ?? DEFAULT_SLOTS).map((slot) => slot.prop);
    const props = __privateMethod(this, _RenderSession_instances, propsFor_fn).call(this, node, context, scope, slotProps);
    const slots = __privateMethod(this, _RenderSession_instances, buildSlots_fn).call(this, node, entry.slots ?? DEFAULT_SLOTS, context, scope, depth, new Set(ancestors).add(componentId), children);
    Object.assign(props, slots.props);
    if (slots.weights) {
      props.childWeights = slots.weights;
    }
    if (!entry.stateful) {
      props[KEY_PROP] = key;
      __privateGet(this, _pending).set(key, { definition: node, reads, children });
    }
    return __privateGet(this, _options).runtime.callComponent(entry.component, props, slots.children, false);
  };
  /**
   * Picks the catalog a node renders through: its own `catalogId`, then the surface's,
   * then the default. v1.0 resolution is strict — an id we were not given is reported,
   * never quietly rendered with a different catalog's components.
   */
  catalogFor_fn = function(node, componentId) {
    const requested = node.catalogId ?? __privateGet(this, _options).surface.catalogId;
    if (requested === void 0) {
      return __privateGet(this, _options).catalog;
    }
    const answersTo = __privateGet(this, _options).defaultCatalogId ?? BASIC_CATALOG_IDS;
    if (typeof answersTo === "string" ? requested === answersTo : answersTo.includes(requested)) {
      return __privateGet(this, _options).catalog;
    }
    const registered = __privateGet(this, _options).catalogs?.[requested];
    if (registered) {
      return registered;
    }
    __privateMethod(this, _RenderSession_instances, report_fn).call(this, "UNKNOWN_CATALOG", `Surface asks for catalog '${requested}', which this renderer does not support.`, componentId);
    return void 0;
  };
  /**
   * Resolves every child-bearing property the catalog declares for this type.
   * Which properties those are comes from the spec, not a hard-coded pair — `Modal`
   * uses `trigger` / `content`, `Tabs` nests ids under `tabs[].child`.
   */
  buildSlots_fn = function(node, slots, context, scope, depth, ancestors, record) {
    const result = { children: [], props: {} };
    for (const slot of slots) {
      const raw = node[slot.prop];
      if (raw === void 0) {
        continue;
      }
      const positional = slot.prop === "child" || slot.prop === "children";
      if (slot.kind === "single") {
        record.push({ id: raw, scope });
        const built2 = __privateMethod(this, _RenderSession_instances, build_fn).call(this, raw, scope, void 0, depth + 1, ancestors);
        if (positional) {
          result.children.push(built2 ?? __privateMethod(this, _RenderSession_instances, placeholder_fn).call(this));
        } else if (built2 !== void 0) {
          result.props[slot.prop] = built2;
        }
        continue;
      }
      if (slot.kind === "objectList") {
        result.props[slot.prop] = __privateMethod(this, _RenderSession_instances, buildObjectList_fn).call(this, raw, slot, context, scope, depth, ancestors, record);
        continue;
      }
      const built = __privateMethod(this, _RenderSession_instances, buildChildList_fn).call(this, raw, scope, depth, ancestors, record);
      if (positional) {
        result.children.push(...built);
        result.weights = __privateMethod(this, _RenderSession_instances, weightsFor_fn).call(this, raw, context);
      } else {
        result.props[slot.prop] = built;
      }
    }
    return result;
  };
  /** An array of objects each carrying a child id, e.g. `Tabs.tabs`. */
  buildObjectList_fn = function(raw, slot, context, scope, depth, ancestors, record) {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map((item) => {
      if (!isPlainObject(item)) {
        return item;
      }
      const resolved = {};
      for (const [key, value] of Object.entries(item)) {
        if (key !== slot.childKey) {
          resolved[key] = resolveValue(value, context);
          continue;
        }
        record.push({ id: value, scope });
        resolved[key] = __privateMethod(this, _RenderSession_instances, build_fn).call(this, value, scope, void 0, depth + 1, ancestors);
      }
      return resolved;
    });
  };
  /**
   * A static id list, or a lazy `ForEach` over a template.
   *
   * A child that fails to build is replaced by a placeholder rather than dropped.
   * The runtime derives a component's hook path from its index among its siblings, so
   * removing one shifts every later sibling onto the previous one's stored state —
   * a dangling reference would silently transplant an open Modal or a typed field.
   */
  buildChildList_fn = function(children, scope, depth, ancestors, record) {
    if (Array.isArray(children)) {
      return children.map((childId) => {
        record.push({ id: childId, scope });
        return __privateMethod(this, _RenderSession_instances, build_fn).call(this, childId, scope, void 0, depth + 1, ancestors) ?? __privateMethod(this, _RenderSession_instances, placeholder_fn).call(this);
      });
    }
    if (isChildTemplate(children)) {
      return __privateMethod(this, _RenderSession_instances, present_fn).call(this, __privateMethod(this, _RenderSession_instances, buildTemplate_fn).call(this, children.path, children.componentId, scope, depth, ancestors));
    }
    return [];
  };
  /**
   * Template children become `ForEach(array, (item, index) => …)`. The callback is
   * stored by the runtime and invoked per visible row, so nothing is expanded here.
   *
   * Rows are not memoised: they are built later, outside this pass. The `ForEach` node
   * itself is, keyed on the identity of the bound array.
   */
  buildTemplate_fn = function(path, templateId, scope, depth, ancestors) {
    const basePath = resolvePath(path, scope);
    const array = resolveValue({ path: basePath }, __privateMethod(this, _RenderSession_instances, contextFor_fn).call(this, scope, void 0, templateId));
    if (!Array.isArray(array)) {
      __privateMethod(this, _RenderSession_instances, report_fn).call(this, "TEMPLATE_NOT_ARRAY", `Template path '${basePath}' is not an array.`, templateId);
      return void 0;
    }
    const forEach = __privateGet(this, _options).runtime.context.ForEach;
    return forEach(array, (_item, rowIndex) => {
      return __privateMethod(this, _RenderSession_instances, build_fn).call(this, templateId, `${basePath}/${rowIndex}`, rowIndex, depth + 1, ancestors);
    });
  };
  // MARK: Props
  /**
   * Resolved catalog props, plus the two things only the engine can supply:
   * an `action` callback, and a `set<Prop>` writer for each path-bound prop.
   */
  propsFor_fn = function(node, context, scope, slotProps) {
    const props = resolvePropsExcept(node, slotProps, context);
    for (const [key, rawValue] of Object.entries(node)) {
      if (!isPathBinding(rawValue)) {
        continue;
      }
      const absolutePath = resolvePath(rawValue.path, scope);
      props[writerName(key)] = (value) => {
        __privateGet(this, _options).setValue?.(absolutePath, value);
      };
    }
    if (node.action !== void 0) {
      const index2 = context.index;
      props.action = () => {
        __privateMethod(this, _RenderSession_instances, dispatch_fn).call(this, node, __privateMethod(this, _RenderSession_instances, contextFor_fn).call(this, scope, index2, node.id));
      };
    }
    return props;
  };
  contextFor_fn = function(scope, index2, componentId, reads) {
    return {
      dataModel: __privateGet(this, _options).surface.dataModel,
      registry: __privateGet(this, _options).registry,
      scope,
      index: index2,
      locale: __privateGet(this, _options).locale,
      timeZone: __privateGet(this, _options).timeZone,
      openUrl: __privateGet(this, _options).openUrl,
      onRead: reads ? (path, value) => reads.push([path, value]) : void 0,
      onError: (error) => {
        __privateMethod(this, _RenderSession_instances, report_fn).call(this, "RESOLVE_FAILED", error.message, componentId);
      }
    };
  };
  // MARK: Actions
  /** Runs a component's action: a renderer-side function call, an agent event, or both. */
  dispatch_fn = function(node, context) {
    const action = node.action;
    if (!action) {
      return;
    }
    if (action.functionCall) {
      resolveValue(action.functionCall, context);
    }
    const { event } = action;
    if (!event) {
      return;
    }
    const { surface, onAction } = __privateGet(this, _options);
    onAction?.({
      name: event.name,
      surfaceId: surface.id,
      sourceComponentId: node.id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      context: resolveActionContext(event.context, context),
      // The spec attaches the whole model as transport metadata when asked.
      dataModel: surface.sendDataModel ? surface.dataModel : void 0
    });
  };
  // MARK: Helpers
  /** `weight` lets a Row / Column child claim proportional space. */
  weightsFor_fn = function(raw, context) {
    if (!Array.isArray(raw)) {
      return void 0;
    }
    let any = false;
    const weights = raw.map((childId) => {
      const child = __privateGet(this, _options).surface.components.get(childId);
      const weight = child === void 0 ? void 0 : resolveValue(child.weight, context);
      if (typeof weight === "number") {
        any = true;
        return weight;
      }
      return 0;
    });
    return any ? weights : void 0;
  };
  /**
   * Wraps a cached subtree so it looks like any other built component.
   *
   * A bare AST object cannot be handed straight to a component: BindJS builders
   * overload on `typeof arg === 'object'` (`Button(label, action)` reads an object
   * first argument as `{ action, label }`), so a spliced object is misread. Going back
   * through `makeComponent` restores the function form and modifier chaining, while
   * the body still just returns the cached tree — no component is re-invoked.
   */
  reuse_fn = function(ast) {
    return __privateGet(this, _options).runtime.makeComponent(() => ast);
  };
  /** Keeps a failed child's slot occupied so sibling hook paths stay put. */
  placeholder_fn = function() {
    const empty = __privateGet(this, _options).runtime.context.Empty;
    return typeof empty === "function" ? empty() : null;
  };
  /** Drops a value that failed to build, where position does not matter. */
  present_fn = function(value) {
    return value === void 0 ? [] : [value];
  };
  report_fn = function(code, message, componentId) {
    __privateGet(this, _diagnostics).push({ code, message, componentId });
  };
  function writerName(propName) {
    return "set" + propName.charAt(0).toUpperCase() + propName.slice(1);
  }

  // src/protocol/parse.ts
  var A2UIProtocolError = class extends Error {
    constructor(message, options = {}) {
      super(message);
      __publicField(this, "code");
      __publicField(this, "path");
      __publicField(this, "surfaceId");
      this.name = "A2UIProtocolError";
      this.code = options.code ?? "VALIDATION_FAILED";
      this.path = options.path;
      this.surfaceId = options.surfaceId;
    }
  };
  var LEGACY_V09_KEYS = ["beginRendering", "surfaceUpdate", "dataModelUpdate"];
  function messageType(message) {
    const keys = Object.keys(message).filter((key) => key !== "version");
    const found = keys.filter((key) => AGENT_MESSAGE_TYPES.includes(key));
    if (found.length === 1) {
      return found[0];
    }
    if (found.length > 1) {
      throw new A2UIProtocolError(`Message has multiple type keys: ${found.join(", ")}`, { path: "/" });
    }
    const legacy = keys.find((key) => LEGACY_V09_KEYS.includes(key));
    if (legacy) {
      throw new A2UIProtocolError(`'${legacy}' is an A2UI v0.9 message; this renderer targets v1.0.`, { path: `/${legacy}` });
    }
    throw new A2UIProtocolError(`Message has no recognised type key (expected one of ${AGENT_MESSAGE_TYPES.join(", ")})`, {
      path: "/"
    });
  }
  function parseMessage(input) {
    const raw = typeof input === "string" ? parseJson(input) : input;
    if (!isPlainObject(raw)) {
      throw new A2UIProtocolError("Message must be a JSON object", { path: "/" });
    }
    const message = raw;
    const type = messageType(message);
    const body = message[type];
    if (!isPlainObject(body)) {
      throw new A2UIProtocolError(`'${type}' must be an object`, { path: `/${type}` });
    }
    const surfaceId = validateSurfaceId(type, body);
    switch (type) {
      case "createSurface":
        validateCreateSurface(body, surfaceId);
        break;
      case "updateComponents":
        validateComponents(body.components, "/updateComponents/components", surfaceId);
        break;
      case "updateDataModel":
        validateUpdateDataModel(body, surfaceId);
        break;
      case "deleteSurface":
        break;
      case "callRendererFunction":
        validateFunctionCallId(body, type);
        if (!isPlainObject(body.callFunction) || typeof body.callFunction.call !== "string") {
          throw new A2UIProtocolError("callFunction.call is required", { path: `/${type}/callFunction` });
        }
        break;
      case "agentFunctionResponse":
        validateFunctionCallId(body, type);
        break;
    }
    return message;
  }
  function parseJson(input) {
    try {
      return JSON.parse(input);
    } catch (error) {
      throw new A2UIProtocolError(`Invalid JSON: ${error.message}`, { path: "/" });
    }
  }
  function validateSurfaceId(type, body) {
    const isSurfaceScoped = type !== "agentFunctionResponse" && type !== "callRendererFunction";
    const surfaceId = body.surfaceId;
    if (typeof surfaceId === "string" && surfaceId.length > 0) {
      return surfaceId;
    }
    if (isSurfaceScoped) {
      throw new A2UIProtocolError("surfaceId is required", { path: `/${type}/surfaceId` });
    }
    return void 0;
  }
  function validateCreateSurface(body, surfaceId) {
    if (body.components !== void 0) {
      validateComponents(body.components, "/createSurface/components", surfaceId);
    }
    if (body.dataModel !== void 0 && !isPlainObject(body.dataModel)) {
      throw new A2UIProtocolError("dataModel must be an object", { path: "/createSurface/dataModel", surfaceId });
    }
    if (body.catalogId !== void 0 && typeof body.catalogId !== "string") {
      throw new A2UIProtocolError("catalogId must be a string", { path: "/createSurface/catalogId", surfaceId });
    }
  }
  function validateUpdateDataModel(body, surfaceId) {
    if (!("value" in body)) {
      throw new A2UIProtocolError("value is required", { path: "/updateDataModel/value", surfaceId });
    }
    if (body.path !== void 0 && typeof body.path !== "string") {
      throw new A2UIProtocolError("path must be a string", { path: "/updateDataModel/path", surfaceId });
    }
  }
  function validateFunctionCallId(body, type) {
    if (typeof body.functionCallId !== "string") {
      throw new A2UIProtocolError("functionCallId is required", { path: `/${type}/functionCallId` });
    }
  }
  function validateComponents(value, basePath, surfaceId) {
    if (!Array.isArray(value)) {
      throw new A2UIProtocolError("components must be an array", { path: basePath, surfaceId });
    }
    const seen = /* @__PURE__ */ new Set();
    value.forEach((component, index2) => {
      const path = `${basePath}/${index2}`;
      validateComponent(component, path, surfaceId);
      if (seen.has(component.id)) {
        throw new A2UIProtocolError(`Duplicate component id '${component.id}' in message`, { path: `${path}/id`, surfaceId });
      }
      seen.add(component.id);
    });
  }
  function validateComponent(component, path, surfaceId) {
    if (!isPlainObject(component)) {
      throw new A2UIProtocolError("component must be an object", { path, surfaceId });
    }
    if (typeof component.id !== "string" || component.id.length === 0) {
      throw new A2UIProtocolError("component id is required", { path: `${path}/id`, surfaceId });
    }
    if (typeof component.component !== "string" || !isIdentifier(component.component)) {
      throw new A2UIProtocolError(`component type must be an identifier, got ${JSON.stringify(component.component)}`, {
        path: `${path}/component`,
        surfaceId
      });
    }
    if (component.component === "Surface") {
      throw new A2UIProtocolError(`'Surface' is a reserved component name`, { path: `${path}/component`, surfaceId });
    }
    if (component.children !== void 0 && !isValidChildList(component.children)) {
      throw new A2UIProtocolError("children must be an array of ids or {path, componentId}", {
        path: `${path}/children`,
        surfaceId
      });
    }
    if (component.child !== void 0 && typeof component.child !== "string") {
      throw new A2UIProtocolError("child must be a component id", { path: `${path}/child`, surfaceId });
    }
  }
  function isValidChildList(children) {
    if (Array.isArray(children)) {
      return children.every((id) => typeof id === "string");
    }
    return isChildTemplate(children) && typeof children.path === "string";
  }
  function isIdentifier(name) {
    return /^[\p{L}_][\p{L}\p{N}_]*$/u.test(name);
  }

  // src/functions/coerce.ts
  function toDisplayString(value) {
    if (value === null || value === void 0) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return JSON.stringify(value);
  }
  function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return void 0;
  }
  function toBoolean(value) {
    if (typeof value === "string") {
      return value !== "" && value.toLowerCase() !== "false";
    }
    return Boolean(value);
  }
  function toOperands(args) {
    if (Array.isArray(args.values)) {
      return args.values;
    }
    if ("value" in args) {
      return [args.value];
    }
    return Object.values(args);
  }
  function toLength(value) {
    if (typeof value === "string" || Array.isArray(value)) {
      return value.length;
    }
    return void 0;
  }

  // src/functions/standard/format.ts
  function interpolate(template, context) {
    let output = "";
    let index2 = 0;
    while (index2 < template.length) {
      if (template.startsWith("\\${", index2) || template.startsWith("$${", index2)) {
        output += "${";
        index2 += 3;
      } else if (template.startsWith("${", index2)) {
        const close = placeholderEnd(template, index2 + 2);
        if (close === -1) {
          output += template.slice(index2);
          break;
        }
        output += toDisplayString(evaluate(template.slice(index2 + 2, close).trim(), context));
        index2 = close + 1;
      } else {
        output += template[index2];
        index2 += 1;
      }
    }
    return output;
  }
  function placeholderEnd(template, start) {
    let depth = 1;
    let quote;
    let index2 = start;
    while (index2 < template.length) {
      const character = template[index2];
      if (quote !== void 0) {
        if (character === quote) {
          quote = void 0;
        }
      } else if (character === "'" || character === '"') {
        quote = character;
      } else if (template.startsWith("${", index2)) {
        depth += 1;
        index2 += 1;
      } else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          return index2;
        }
      }
      index2 += 1;
    }
    return -1;
  }
  var CALL = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*)\)$/;
  function evaluate(expression, context) {
    if (expression === "@index") {
      return context.index;
    }
    const call = CALL.exec(expression);
    if (call === null) {
      return context.getValue(expression);
    }
    if (context.call === void 0) {
      return void 0;
    }
    return context.call(call[1], parseArguments(call[2], context));
  }
  function parseArguments(text, context) {
    const args = {};
    for (const pair of splitTopLevel(text)) {
      const colon = pair.indexOf(":");
      if (colon === -1) {
        continue;
      }
      const key = pair.slice(0, colon).trim();
      const value = pair.slice(colon + 1).trim();
      if (key !== "") {
        args[key] = parseValue(value, context);
      }
    }
    return args;
  }
  function splitTopLevel(text) {
    const pieces = [];
    let depth = 0;
    let quote;
    let current = "";
    for (let index2 = 0; index2 < text.length; index2 += 1) {
      const character = text[index2];
      if (quote !== void 0) {
        current += character;
        if (character === quote) {
          quote = void 0;
        }
      } else if (character === "'" || character === '"') {
        quote = character;
        current += character;
      } else if (character === "(" || character === "{") {
        depth += 1;
        current += character;
      } else if (character === ")" || character === "}") {
        depth -= 1;
        current += character;
      } else if (character === "," && depth === 0) {
        pieces.push(current);
        current = "";
      } else {
        current += character;
      }
    }
    if (current.trim() !== "") {
      pieces.push(current);
    }
    return pieces;
  }
  function parseValue(text, context) {
    if (text.startsWith("${") && text.endsWith("}")) {
      return evaluate(text.slice(2, -1).trim(), context);
    }
    const quoted = /^(['"])([\s\S]*)\1$/.exec(text);
    if (quoted !== null) {
      return quoted[2];
    }
    if (/^-?\d+(\.\d+)?$/.test(text)) {
      return Number(text);
    }
    if (text === "true") {
      return true;
    }
    if (text === "false") {
      return false;
    }
    if (text === "null") {
      return null;
    }
    return text;
  }
  var formatString = {
    name: "formatString",
    returnType: "string",
    description: "Interpolates ${/pointer} placeholders into a template string.",
    invoke(args, context) {
      const template = args.value;
      if (typeof template !== "string") {
        return toDisplayString(template);
      }
      return interpolate(template, context);
    }
  };
  function numberOptions(args) {
    const options = {};
    const minimumFractionDigits = toNumber(args.minimumFractionDigits);
    const maximumFractionDigits = toNumber(args.maximumFractionDigits);
    if (minimumFractionDigits !== void 0) {
      options.minimumFractionDigits = minimumFractionDigits;
    }
    if (maximumFractionDigits !== void 0) {
      options.maximumFractionDigits = maximumFractionDigits;
    }
    if (typeof args.style === "string") {
      options.style = args.style;
    }
    return options;
  }
  var formatNumber = {
    name: "formatNumber",
    returnType: "string",
    description: "Formats a number for the current locale.",
    invoke(args, context) {
      const value = toNumber(args.value);
      if (value === void 0) {
        return toDisplayString(args.value);
      }
      return new Intl.NumberFormat(context.locale, numberOptions(args)).format(value);
    }
  };
  var formatCurrency = {
    name: "formatCurrency",
    returnType: "string",
    description: "Formats a number as a currency amount.",
    invoke(args, context) {
      const value = toNumber(args.value);
      if (value === void 0) {
        return toDisplayString(args.value);
      }
      const currency = typeof args.currency === "string" ? args.currency : "USD";
      const options = { ...numberOptions(args), style: "currency", currency };
      return new Intl.NumberFormat(context.locale, options).format(value);
    }
  };
  function dateOptions(args, timeZone) {
    const options = {};
    if (typeof args.dateStyle === "string") {
      options.dateStyle = args.dateStyle;
    }
    if (typeof args.timeStyle === "string") {
      options.timeStyle = args.timeStyle;
    }
    if (options.dateStyle === void 0 && options.timeStyle === void 0) {
      options.dateStyle = "medium";
    }
    if (timeZone !== void 0) {
      options.timeZone = timeZone;
    }
    return options;
  }
  var DATE_FIELDS = {
    yy: { options: { year: "2-digit" }, part: "year" },
    yyyy: { options: { year: "numeric" }, part: "year" },
    M: { options: { month: "numeric" }, part: "month" },
    MM: { options: { month: "2-digit" }, part: "month" },
    MMM: { options: { month: "short" }, part: "month" },
    MMMM: { options: { month: "long" }, part: "month" },
    d: { options: { day: "numeric" }, part: "day" },
    dd: { options: { day: "2-digit" }, part: "day" },
    E: { options: { weekday: "short" }, part: "weekday" },
    EE: { options: { weekday: "short" }, part: "weekday" },
    EEE: { options: { weekday: "short" }, part: "weekday" },
    EEEE: { options: { weekday: "long" }, part: "weekday" },
    h: { options: { hour: "numeric", hour12: true }, part: "hour" },
    hh: { options: { hour: "2-digit", hour12: true }, part: "hour" },
    H: { options: { hour: "numeric", hourCycle: "h23" }, part: "hour" },
    HH: { options: { hour: "2-digit", hourCycle: "h23" }, part: "hour" },
    m: { options: { minute: "numeric" }, part: "minute" },
    mm: { options: { minute: "2-digit" }, part: "minute" },
    s: { options: { second: "numeric" }, part: "second" },
    ss: { options: { second: "2-digit" }, part: "second" },
    a: { options: { hour: "numeric", hour12: true }, part: "dayPeriod" }
  };
  function dateField(token, date, locale, timeZone) {
    const field = DATE_FIELDS[token];
    if (field === void 0) {
      return token;
    }
    const options = { ...field.options };
    if (timeZone !== void 0) {
      options.timeZone = timeZone;
    }
    const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date);
    const value = parts.find((part) => part.type === field.part)?.value ?? "";
    const padded = token.length === 2 && token !== "yy" && /^\d$/.test(value);
    return padded ? `0${value}` : value;
  }
  function formatDatePattern(pattern, date, locale, timeZone) {
    let output = "";
    let index2 = 0;
    while (index2 < pattern.length) {
      const character = pattern[index2];
      if (character === "'") {
        if (pattern[index2 + 1] === "'") {
          output += "'";
          index2 += 2;
          continue;
        }
        index2 += 1;
        while (index2 < pattern.length) {
          if (pattern[index2] === "'" && pattern[index2 + 1] === "'") {
            output += "'";
            index2 += 2;
          } else if (pattern[index2] === "'") {
            index2 += 1;
            break;
          } else {
            output += pattern[index2];
            index2 += 1;
          }
        }
      } else if (/[A-Za-z]/.test(character)) {
        let end = index2;
        while (end < pattern.length && pattern[end] === character) {
          end += 1;
        }
        output += dateField(pattern.slice(index2, end), date, locale, timeZone);
        index2 = end;
      } else {
        output += character;
        index2 += 1;
      }
    }
    return output;
  }
  var formatDate = {
    name: "formatDate",
    returnType: "string",
    description: "Formats an ISO date string or epoch milliseconds with a TR35 pattern, for the current locale.",
    invoke(args, context) {
      const raw = args.value;
      if (typeof raw !== "string" && typeof raw !== "number") {
        return toDisplayString(raw);
      }
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        return toDisplayString(raw);
      }
      const timeZone = typeof args.timeZone === "string" ? args.timeZone : context.timeZone;
      if (typeof args.format === "string" && args.format !== "") {
        return formatDatePattern(args.format, date, context.locale, timeZone);
      }
      return new Intl.DateTimeFormat(context.locale, dateOptions(args, timeZone)).format(date);
    }
  };
  var pluralize = {
    name: "pluralize",
    returnType: "string",
    description: "Picks a plural form (zero/one/two/few/many/other) for a count.",
    invoke(args, context) {
      const count = toNumber(args.value ?? args.count) ?? 0;
      const category = new Intl.PluralRules(context.locale).select(count);
      const chosen = args[category] ?? args.other;
      return toDisplayString(chosen);
    }
  };
  var FORMAT_FUNCTIONS = [formatString, formatNumber, formatCurrency, formatDate, pluralize];

  // src/functions/standard/logic.ts
  var and = {
    name: "and",
    returnType: "boolean",
    description: "True when every operand is truthy.",
    invoke(args) {
      return toOperands(args).every(toBoolean);
    }
  };
  var or = {
    name: "or",
    returnType: "boolean",
    description: "True when any operand is truthy.",
    invoke(args) {
      return toOperands(args).some(toBoolean);
    }
  };
  var not = {
    name: "not",
    returnType: "boolean",
    description: "Negates its single operand.",
    invoke(args) {
      const [operand] = toOperands(args);
      return !toBoolean(operand);
    }
  };
  var LOGIC_FUNCTIONS = [and, or, not];

  // src/functions/standard/system.ts
  var index = {
    name: "@index",
    returnType: "number",
    description: "Zero-based index of the current template element.",
    invoke(_args, context) {
      return context.index ?? -1;
    }
  };
  var openUrl = {
    name: "openUrl",
    allowedCallers: "rendererOnly",
    returnType: "null",
    description: "Opens a URL on the renderer. Requires a host `openUrl` hook.",
    invoke(args, context) {
      if (typeof args.url !== "string") {
        return null;
      }
      const target = typeof args.target === "string" ? args.target : void 0;
      context.openUrl?.(args.url, target);
      return null;
    }
  };
  var SYSTEM_FUNCTIONS = [index, openUrl];

  // src/functions/standard/validation.ts
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function pass() {
    return { valid: true };
  }
  function fail(args, fallback) {
    const message = typeof args.message === "string" ? args.message : fallback;
    return { valid: false, message };
  }
  function isEmpty(value) {
    if (value === null || value === void 0) {
      return true;
    }
    if (typeof value === "string") {
      return value.trim() === "";
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return false;
  }
  var required = {
    name: "required",
    returnType: "validationResult",
    description: "Fails when the value is null, undefined, blank, or an empty array.",
    invoke(args) {
      if (isEmpty(args.value)) {
        return fail(args, "This field is required.");
      }
      return pass();
    }
  };
  var regex = {
    name: "regex",
    returnType: "validationResult",
    description: "Fails when the value does not match the given pattern.",
    invoke(args) {
      const pattern = args.pattern;
      if (typeof pattern !== "string") {
        return fail(args, "regex requires a string `pattern` argument.");
      }
      const flags = typeof args.flags === "string" ? args.flags : void 0;
      const text = toDisplayString(args.value);
      try {
        if (new RegExp(pattern, flags).test(text)) {
          return pass();
        }
      } catch (error) {
        return fail(args, `Invalid pattern: ${error.message}`);
      }
      return fail(args, "This value is not in the expected format.");
    }
  };
  var length = {
    name: "length",
    returnType: "validationResult",
    description: "Checks the length of a string or array against min / max.",
    invoke(args) {
      const size = toLength(args.value);
      if (size === void 0) {
        return fail(args, "This value has no length.");
      }
      const min = toNumber(args.min);
      const max = toNumber(args.max);
      if (min !== void 0 && size < min) {
        return fail(args, `Must be at least ${min} characters.`);
      }
      if (max !== void 0 && size > max) {
        return fail(args, `Must be at most ${max} characters.`);
      }
      return pass();
    }
  };
  var numeric = {
    name: "numeric",
    returnType: "validationResult",
    description: "Checks that the value is a number, optionally an integer within min / max.",
    invoke(args) {
      const value = toNumber(args.value);
      if (value === void 0) {
        return fail(args, "Must be a number.");
      }
      if (args.integer === true && !Number.isInteger(value)) {
        return fail(args, "Must be a whole number.");
      }
      const min = toNumber(args.min);
      const max = toNumber(args.max);
      if (min !== void 0 && value < min) {
        return fail(args, `Must be at least ${min}.`);
      }
      if (max !== void 0 && value > max) {
        return fail(args, `Must be at most ${max}.`);
      }
      return pass();
    }
  };
  var email = {
    name: "email",
    returnType: "validationResult",
    description: "Checks that the value looks like an email address.",
    invoke(args) {
      if (EMAIL_PATTERN.test(toDisplayString(args.value))) {
        return pass();
      }
      return fail(args, "Enter a valid email address.");
    }
  };
  var VALIDATION_FUNCTIONS = [required, regex, length, numeric, email];

  // src/functions/standard/index.ts
  var STANDARD_FUNCTIONS = [...FORMAT_FUNCTIONS, ...VALIDATION_FUNCTIONS, ...LOGIC_FUNCTIONS, ...SYSTEM_FUNCTIONS];

  // src/functions/registry.ts
  var _functions;
  var _FunctionRegistry = class _FunctionRegistry {
    constructor(functions = []) {
      __privateAdd(this, _functions, /* @__PURE__ */ new Map());
      for (const fn of functions) {
        this.register(fn);
      }
    }
    // MARK: Registration
    /** Registers (or replaces) a function. Defaults `allowedCallers` to `rendererOrAgent`. */
    register(fn) {
      if (!isFunctionName(fn.name)) {
        throw new A2UIProtocolError(`'${fn.name}' is not a valid function name`, { code: "INVALID_FUNCTION_CALL" });
      }
      __privateGet(this, _functions).set(fn.name, { allowedCallers: "rendererOrAgent", ...fn });
    }
    unregister(name) {
      __privateGet(this, _functions).delete(name);
    }
    // MARK: Reading
    get names() {
      return [...__privateGet(this, _functions).keys()];
    }
    has(name) {
      return __privateGet(this, _functions).has(name);
    }
    get(name) {
      return __privateGet(this, _functions).get(name);
    }
    /** Returns a copy with the same functions, for per-surface overrides. */
    clone() {
      const copy = new _FunctionRegistry();
      for (const fn of __privateGet(this, _functions).values()) {
        copy.register(fn);
      }
      return copy;
    }
    // MARK: Invocation
    /** Looks up and invokes a function, enforcing the caller boundary. */
    call(name, args, context, caller = "renderer") {
      const fn = __privateGet(this, _functions).get(name);
      if (!fn) {
        throw new A2UIProtocolError(`Unknown function '${name}'`, { code: "INVALID_FUNCTION_CALL" });
      }
      this.assertCallable(fn, caller);
      return fn.invoke(args, context);
    }
    /** Throws unless `caller` is permitted to invoke `fn`. */
    assertCallable(fn, caller) {
      const permitted = fn.allowedCallers === "rendererOrAgent" || fn.allowedCallers === `${caller}Only`;
      if (permitted) {
        return;
      }
      throw new A2UIProtocolError(`Function '${fn.name}' is ${fn.allowedCallers} and cannot be called by the ${caller}.`, {
        code: "INVALID_FUNCTION_CALL"
      });
    }
  };
  _functions = new WeakMap();
  var FunctionRegistry = _FunctionRegistry;
  function createStandardRegistry(extra = []) {
    return new FunctionRegistry([...STANDARD_FUNCTIONS, ...extra]);
  }
  function isFunctionName(name) {
    if (name.startsWith("@")) {
      return isIdentifier(name.slice(1));
    }
    return isIdentifier(name);
  }

  // src/store/SurfaceStore.ts
  var _surfaces, _listeners, _options2, _batchDepth, _queued, _SurfaceStore_instances, createSurface_fn, updateComponents_fn, updateDataModel_fn, replace_fn, emit_fn, flush_fn;
  var SurfaceStore = class {
    constructor(options = {}) {
      __privateAdd(this, _SurfaceStore_instances);
      __privateAdd(this, _surfaces, /* @__PURE__ */ new Map());
      __privateAdd(this, _listeners, /* @__PURE__ */ new Set());
      __privateAdd(this, _options2);
      __privateAdd(this, _batchDepth, 0);
      __privateAdd(this, _queued, []);
      __privateSet(this, _options2, options);
    }
    // MARK: Reading
    get surfaceIds() {
      return [...__privateGet(this, _surfaces).keys()];
    }
    getSurface(surfaceId) {
      return __privateGet(this, _surfaces).get(surfaceId);
    }
    requireSurface(surfaceId) {
      const surface = __privateGet(this, _surfaces).get(surfaceId);
      if (!surface) {
        throw new A2UIProtocolError(`Unknown surface '${surfaceId}'`, { surfaceId });
      }
      return surface;
    }
    getComponent(surfaceId, componentId) {
      return __privateGet(this, _surfaces).get(surfaceId)?.components.get(componentId);
    }
    getRoot(surfaceId) {
      return this.getComponent(surfaceId, ROOT_COMPONENT_ID);
    }
    /** Reads the data model at a pointer, resolving relative paths against `scope`. */
    getValue(surfaceId, path, scope = "/") {
      const surface = __privateGet(this, _surfaces).get(surfaceId);
      if (!surface) {
        return void 0;
      }
      return getAt(surface.dataModel, resolvePath(path, scope));
    }
    // MARK: Applying agent messages
    /** Applies a single agent message (JSON string or object). Validates first; throws `A2UIProtocolError`. */
    apply(input) {
      const message = parseMessage(input);
      const type = messageType(message);
      switch (type) {
        case "createSurface":
          __privateMethod(this, _SurfaceStore_instances, createSurface_fn).call(this, message.createSurface);
          break;
        case "updateComponents":
          __privateMethod(this, _SurfaceStore_instances, updateComponents_fn).call(this, message.updateComponents);
          break;
        case "updateDataModel":
          __privateMethod(this, _SurfaceStore_instances, updateDataModel_fn).call(this, message.updateDataModel);
          break;
        case "deleteSurface":
          this.deleteSurface(message.deleteSurface.surfaceId);
          break;
        case "callRendererFunction":
          __privateMethod(this, _SurfaceStore_instances, emit_fn).call(this, { type: "callRendererFunction", message: message.callRendererFunction });
          break;
        case "agentFunctionResponse":
          __privateMethod(this, _SurfaceStore_instances, emit_fn).call(this, { type: "agentFunctionResponse", message: message.agentFunctionResponse });
          break;
      }
    }
    /** Applies a batch (e.g. one streamed chunk containing several messages). */
    applyAll(messages) {
      this.batch(() => {
        for (const message of messages) {
          this.apply(message);
        }
      });
    }
    /**
     * Applies several messages, notifying listeners once at the end.
     *
     * Without this, a run of messages that supersede each other — two
     * `updateComponents` for the same id, say — makes a renderer draw every
     * intermediate state before the final one. On the web React's own batching hides
     * that when the messages land in the same tick; nothing does on the native hosts,
     * so a stream reader should wrap each chunk in `batch`.
     *
     * Nested calls are fine: only the outermost one flushes.
     */
    batch(work) {
      __privateSet(this, _batchDepth, __privateGet(this, _batchDepth) + 1);
      try {
        return work();
      } finally {
        __privateSet(this, _batchDepth, __privateGet(this, _batchDepth) - 1);
        if (__privateGet(this, _batchDepth) === 0) {
          __privateMethod(this, _SurfaceStore_instances, flush_fn).call(this);
        }
      }
    }
    // MARK: Local writes
    /**
     * Local write from an input component (two-way binding). Relative paths are resolved
     * against `scope` (the template element scope the component was rendered in).
     */
    setValue(surfaceId, path, value, scope = "/") {
      const surface = this.requireSurface(surfaceId);
      const absolutePath = resolvePath(path, scope);
      const dataModel = value === null ? deleteAt(surface.dataModel, absolutePath) : setAt(surface.dataModel, absolutePath, value);
      __privateMethod(this, _SurfaceStore_instances, replace_fn).call(this, { ...surface, dataModel, version: surface.version + 1 });
      __privateMethod(this, _SurfaceStore_instances, emit_fn).call(this, { type: "surfaceUpdated", surfaceId });
    }
    deleteSurface(surfaceId) {
      const existed = __privateGet(this, _surfaces).delete(surfaceId);
      if (!existed) {
        return;
      }
      __privateMethod(this, _SurfaceStore_instances, emit_fn).call(this, { type: "surfaceDeleted", surfaceId });
    }
    clear() {
      for (const surfaceId of this.surfaceIds) {
        this.deleteSurface(surfaceId);
      }
    }
    // MARK: Subscriptions
    subscribe(listener) {
      __privateGet(this, _listeners).add(listener);
      return () => {
        __privateGet(this, _listeners).delete(listener);
      };
    }
  };
  _surfaces = new WeakMap();
  _listeners = new WeakMap();
  _options2 = new WeakMap();
  _batchDepth = new WeakMap();
  _queued = new WeakMap();
  _SurfaceStore_instances = new WeakSet();
  // MARK: Internals
  createSurface_fn = function(message) {
    const previous = __privateGet(this, _surfaces).get(message.surfaceId);
    const components = /* @__PURE__ */ new Map();
    for (const component of message.components ?? []) {
      components.set(component.id, component);
    }
    __privateMethod(this, _SurfaceStore_instances, replace_fn).call(this, {
      id: message.surfaceId,
      catalogId: message.catalogId ?? __privateGet(this, _options2).defaultCatalogId,
      sendDataModel: message.sendDataModel ?? false,
      components,
      dataModel: message.dataModel ?? {},
      version: (previous?.version ?? 0) + 1
    });
    __privateMethod(this, _SurfaceStore_instances, emit_fn).call(this, { type: previous ? "surfaceUpdated" : "surfaceCreated", surfaceId: message.surfaceId });
  };
  updateComponents_fn = function(message) {
    const surface = this.requireSurface(message.surfaceId);
    const components = new Map(surface.components);
    for (const component of message.components) {
      components.set(component.id, component);
    }
    __privateMethod(this, _SurfaceStore_instances, replace_fn).call(this, { ...surface, components, version: surface.version + 1 });
    __privateMethod(this, _SurfaceStore_instances, emit_fn).call(this, { type: "surfaceUpdated", surfaceId: message.surfaceId });
  };
  updateDataModel_fn = function(message) {
    const surface = this.requireSurface(message.surfaceId);
    const path = message.path ?? "/";
    const dataModel = message.value === null ? deleteAt(surface.dataModel, path) : setAt(surface.dataModel, path, message.value);
    __privateMethod(this, _SurfaceStore_instances, replace_fn).call(this, { ...surface, dataModel, version: surface.version + 1 });
    __privateMethod(this, _SurfaceStore_instances, emit_fn).call(this, { type: "surfaceUpdated", surfaceId: message.surfaceId });
  };
  replace_fn = function(surface) {
    __privateGet(this, _surfaces).set(surface.id, surface);
  };
  emit_fn = function(event) {
    if (__privateGet(this, _batchDepth) > 0) {
      __privateGet(this, _queued).push(event);
      return;
    }
    for (const listener of __privateGet(this, _listeners)) {
      listener(event, this);
    }
  };
  /**
   * Sends the batched events. A surface that changed several times is reported once,
   * with its last state — created-then-updated stays 'created', and anything followed
   * by a delete is reported only as deleted. Function-call events are never collapsed;
   * each one is a distinct request.
   */
  flush_fn = function() {
    const queued = __privateGet(this, _queued);
    __privateSet(this, _queued, []);
    const order = [];
    const bySurface = /* @__PURE__ */ new Map();
    const events = [];
    for (const event of queued) {
      if (!("surfaceId" in event)) {
        events.push(event);
        continue;
      }
      const previous = bySurface.get(event.surfaceId);
      if (previous === void 0) {
        order.push(event.surfaceId);
      }
      const keepCreated = previous?.type === "surfaceCreated" && event.type === "surfaceUpdated";
      bySurface.set(event.surfaceId, keepCreated ? previous : event);
    }
    for (const surfaceId of order) {
      events.push(bySurface.get(surfaceId));
    }
    for (const event of events) {
      for (const listener of __privateGet(this, _listeners)) {
        listener(event, this);
      }
    }
  };

  // src/validation/validate.ts
  function validationError(issue) {
    return {
      code: "VALIDATION_FAILED",
      surfaceId: issue.surfaceId,
      path: issue.path,
      message: issue.message
    };
  }
  var DEFAULT_MAX_DEPTH2 = 50;
  var DEFAULT_MAX_FUNCTION_CALL_DEPTH = 5;
  var ROOT_ID = "root";
  function validateSurface(surfaceId, components, dataModel, options = {}) {
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH2;
    const catalog = options.catalog ?? BASIC_CATALOG;
    const complete = options.complete ?? true;
    const issues = [];
    const indexOf = options.indexOf ?? new Map([...components.keys()].map((id, index2) => [id, index2]));
    const pointerFor = (componentId, field) => {
      if (componentId === void 0) {
        return "/components";
      }
      const index2 = indexOf.get(componentId);
      const base = index2 === void 0 ? "/components" : `/components/${index2}`;
      return field ? `${base}/${field}` : base;
    };
    const report = (code, message, componentId, field) => {
      issues.push({ code, message, surfaceId, path: pointerFor(componentId, field), componentId });
    };
    if (complete && components.size > 0 && !components.has(ROOT_ID)) {
      report("MISSING_ROOT", `Missing root component in surface '${surfaceId}'.`);
    }
    checkReferences(components, catalog, report);
    checkPathsAndCalls(components, options.maxFunctionCallDepth ?? DEFAULT_MAX_FUNCTION_CALL_DEPTH, report);
    const reached = walk(components, catalog, maxDepth, report);
    for (const id of components.keys()) {
      const superseded = options.everReferenced?.has(id) ?? false;
      if (complete && !reached.has(id) && !superseded && id !== ROOT_ID && components.has(ROOT_ID)) {
        report("UNREACHABLE", `Component '${id}' is not reachable from '${ROOT_ID}'.`, id);
      }
    }
    if (depthOf(dataModel) > maxDepth) {
      report("DEPTH_EXCEEDED", `Data model in surface '${surfaceId}' nests deeper than ${maxDepth} levels.`);
    }
    return issues;
  }
  function childRefsOf(component, catalog) {
    const entry = catalog[component.component];
    const slots = entry?.slots;
    const effective = slots?.length ? slots : [
      { prop: "child", kind: "single" },
      { prop: "children", kind: "list" }
    ];
    const refs = [];
    const source = component;
    for (const slot of effective) {
      const value = source[slot.prop];
      if (value === void 0 || value === null) {
        continue;
      }
      if (slot.kind === "single") {
        if (typeof value === "string") {
          refs.push({ id: value, field: slot.prop });
        }
        continue;
      }
      if (isChildTemplate(value)) {
        refs.push({ id: value.componentId, field: `${slot.prop}/componentId` });
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((entryValue, index2) => {
          if (typeof entryValue === "string") {
            refs.push({ id: entryValue, field: `${slot.prop}/${index2}` });
            return;
          }
          if (slot.kind === "objectList" && isPlainObject(entryValue)) {
            const child = entryValue[slot.childKey];
            if (typeof child === "string") {
              refs.push({ id: child, field: `${slot.prop}/${index2}/${slot.childKey}` });
            }
          }
        });
      }
    }
    return refs;
  }
  function childIdsOf(component, catalog) {
    return childRefsOf(component, catalog).map((ref) => ref.id);
  }
  function checkReferences(components, catalog, report) {
    for (const [id, component] of components) {
      for (const { id: childId, field } of childRefsOf(component, catalog)) {
        if (childId === id) {
          report("SELF_REFERENCE", `Self-reference detected: component '${id}' contains itself.`, id, field);
          continue;
        }
        if (!components.has(childId)) {
          report("DANGLING_REFERENCE", `Component '${id}' references non-existent component '${childId}'.`, id, field);
        }
      }
    }
  }
  function walk(components, catalog, maxDepth, report) {
    const reached = /* @__PURE__ */ new Set();
    const reportedCycles = /* @__PURE__ */ new Set();
    let reportedDepth = false;
    const visit = (id, stack, depth, collect) => {
      const component = components.get(id);
      if (!component) {
        return;
      }
      if (stack.has(id)) {
        if (!reportedCycles.has(id)) {
          reportedCycles.add(id);
          report("CYCLE", `Circular reference detected at component '${id}'.`, id);
        }
        return;
      }
      if (depth > maxDepth) {
        if (!reportedDepth) {
          reportedDepth = true;
          report("DEPTH_EXCEEDED", `Component graph nests deeper than ${maxDepth} levels.`, id);
        }
        return;
      }
      if (collect) {
        reached.add(id);
      }
      stack.add(id);
      for (const childId of childIdsOf(component, catalog)) {
        visit(childId, stack, depth + 1, collect);
      }
      stack.delete(id);
    };
    if (components.has(ROOT_ID)) {
      visit(ROOT_ID, /* @__PURE__ */ new Set(), 1, true);
    }
    for (const id of components.keys()) {
      if (!reached.has(id)) {
        visit(id, /* @__PURE__ */ new Set(), 1, false);
      }
    }
    return reached;
  }
  function checkPathsAndCalls(components, maxFunctionCallDepth, report) {
    for (const [id, component] of components) {
      inspect(component, 0);
    }
    function inspect(value, callDepth, componentId) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          inspect(entry, callDepth, componentId);
        }
        return;
      }
      if (!isPlainObject(value)) {
        return;
      }
      if (isPathBinding(value)) {
        if (!isValidPointer(value.path)) {
          report("INVALID_PATH", `Invalid path syntax: '${value.path}'.`, componentId);
        }
        return;
      }
      const call = isFunctionCall(value) ? value : isPlainObject(value.functionCall) ? value.functionCall : void 0;
      if (call) {
        const depth = callDepth + 1;
        if (depth > maxFunctionCallDepth) {
          report(
            "FUNCTION_DEPTH_EXCEEDED",
            `Recursion limit exceeded: function calls nest deeper than ${maxFunctionCallDepth}.`,
            componentId
          );
          return;
        }
        inspect(call.args, depth, componentId);
        return;
      }
      for (const entry of Object.values(value)) {
        inspect(entry, callDepth, componentId);
      }
    }
  }
  function isValidPointer(path) {
    if (typeof path !== "string") {
      return false;
    }
    for (let index2 = 0; index2 < path.length; index2 += 1) {
      if (path[index2] !== "~") {
        continue;
      }
      const next = path[index2 + 1];
      if (next !== "0" && next !== "1") {
        return false;
      }
    }
    return true;
  }
  function depthOf(value, seen = 0) {
    if (seen > DEFAULT_MAX_DEPTH2 * 2 || value === null || typeof value !== "object") {
      return seen;
    }
    let deepest = seen + 1;
    for (const entry of Object.values(value)) {
      deepest = Math.max(deepest, depthOf(entry, seen + 1));
    }
    return deepest;
  }

  // src/native/bridge.ts
  var _store, _sessions, _actions, _errors, _runtime, _catalog2, _registry2, _options3, _onActions, _A2UINativeBridge_instances, validateAll_fn, sessionFor_fn, require_fn;
  var A2UINativeBridge = class {
    constructor() {
      __privateAdd(this, _A2UINativeBridge_instances);
      __privateAdd(this, _store, new SurfaceStore());
      __privateAdd(this, _sessions, /* @__PURE__ */ new Map());
      __privateAdd(this, _actions, []);
      __privateAdd(this, _errors, []);
      __privateAdd(this, _runtime);
      __privateAdd(this, _catalog2, BASIC_CATALOG);
      __privateAdd(this, _registry2, createStandardRegistry());
      __privateAdd(this, _options3, {});
      __privateAdd(this, _onActions);
    }
    /** Attaches to the host's runtime and registers the catalog on it. */
    attach(runtime, options = {}) {
      __privateSet(this, _runtime, runtime);
      __privateSet(this, _options3, options);
      registerCatalog(runtime);
    }
    /**
     * Registers a callback fired whenever a surface changes.
     *
     * This is the signal a host redraws on, and without it nothing does. A control writing
     * back into the data model does not touch BindJS hook state — the model owns the value,
     * which is the whole point — so the runtime never marks itself dirty and the host has
     * no other way to learn that the tree it drew is now stale.
     *
     * `useA2UIStore` is the web equivalent, via `useSyncExternalStore`.
     */
    onChange(callback) {
      return __privateGet(this, _store).subscribe((event) => {
        const surfaceId = "surfaceId" in event ? event.surfaceId : "";
        callback(surfaceId, event.type);
      });
    }
    /**
     * Registers a callback fired whenever an action is queued.
     *
     * A tap does not always change the data model, so a host cannot rely on its own
     * redraw to notice one. This lets the host drain the queue on the tap itself rather
     * than polling for something that may never come.
     */
    onActions(callback) {
      __privateSet(this, _onActions, callback);
    }
    configure(options) {
      __privateSet(this, _options3, { ...__privateGet(this, _options3), ...options });
    }
    /**
     * Registers extra BindJS sources and points catalog entries at them.
     *
     * `catalog` is merged over the current one, so a host adds a type or overrides an
     * existing one by naming just that entry — the basic catalog stays underneath. It
     * does not have to re-supply entries it is not changing, which a native caller could
     * not do anyway: the basic catalog lives on this side of the bridge.
     */
    useCatalog(sources, catalog) {
      const runtime = __privateMethod(this, _A2UINativeBridge_instances, require_fn).call(this);
      registerCatalog(runtime, { sources });
      if (catalog) {
        __privateSet(this, _catalog2, { ...__privateGet(this, _catalog2), ...catalog });
        __privateGet(this, _sessions).clear();
      }
    }
    /** Applies agent messages. Accepts one message, an array, or a JSON string of either. */
    applyMessages(input) {
      const parsed = typeof input === "string" ? JSON.parse(input) : input;
      const messages = Array.isArray(parsed) ? parsed : [parsed];
      const errors = [];
      let applied = 0;
      __privateGet(this, _store).batch(() => {
        for (const message of messages) {
          try {
            __privateGet(this, _store).apply(message);
            applied += 1;
          } catch (error) {
            errors.push(error.message);
          }
        }
      });
      if (__privateGet(this, _options3).validate) {
        __privateMethod(this, _A2UINativeBridge_instances, validateAll_fn).call(this);
      }
      return { applied, errors };
    }
    /** Everything validation reported since the last call. Clears the queue. */
    takeErrors() {
      const errors = __privateGet(this, _errors);
      __privateSet(this, _errors, []);
      return errors;
    }
    takeErrorsJSON() {
      return JSON.stringify(this.takeErrors());
    }
    surfaceIds() {
      return __privateGet(this, _store).surfaceIds;
    }
    /** Builds the AST for one surface. Returns `null` when there is no such surface. */
    render(surfaceId) {
      const runtime = __privateMethod(this, _A2UINativeBridge_instances, require_fn).call(this);
      const id = surfaceId ?? __privateGet(this, _store).surfaceIds[0];
      const surface = id === void 0 ? void 0 : __privateGet(this, _store).getSurface(id);
      if (!surface) {
        return null;
      }
      const result = __privateMethod(this, _A2UINativeBridge_instances, sessionFor_fn).call(this, surface.id).render({
        runtime,
        surface,
        catalog: __privateGet(this, _catalog2),
        registry: __privateGet(this, _registry2),
        locale: __privateGet(this, _options3).locale,
        timeZone: __privateGet(this, _options3).timeZone,
        setValue: (path, value) => __privateGet(this, _store).setValue(surface.id, path, value),
        onAction: (action) => {
          var _a;
          __privateGet(this, _actions).push(action);
          (_a = __privateGet(this, _onActions)) == null ? void 0 : _a.call(this);
        }
      });
      return { ast: result.ast ?? null, diagnostics: result.diagnostics };
    }
    /** `render`, serialised — the form a JavaScriptCore host can read directly. */
    renderJSON(surfaceId) {
      return JSON.stringify(this.render(surfaceId));
    }
    /** Writes into the data model, as a two-way bound control would. */
    setValue(surfaceId, path, value) {
      __privateGet(this, _store).setValue(surfaceId, path, value);
    }
    /** Everything the surface dispatched since the last call. Clears the queue. */
    takeActions() {
      const actions = __privateGet(this, _actions);
      __privateSet(this, _actions, []);
      return actions;
    }
    takeActionsJSON() {
      return JSON.stringify(this.takeActions());
    }
    /** Version counter for a surface, so a host can skip redrawing an unchanged one. */
    versionOf(surfaceId) {
      return __privateGet(this, _store).getSurface(surfaceId)?.version ?? 0;
    }
    reset() {
      __privateGet(this, _store).clear();
      __privateGet(this, _sessions).clear();
      __privateSet(this, _actions, []);
      __privateSet(this, _errors, []);
    }
  };
  _store = new WeakMap();
  _sessions = new WeakMap();
  _actions = new WeakMap();
  _errors = new WeakMap();
  _runtime = new WeakMap();
  _catalog2 = new WeakMap();
  _registry2 = new WeakMap();
  _options3 = new WeakMap();
  _onActions = new WeakMap();
  _A2UINativeBridge_instances = new WeakSet();
  validateAll_fn = function() {
    for (const surfaceId of __privateGet(this, _store).surfaceIds) {
      const surface = __privateGet(this, _store).getSurface(surfaceId);
      if (!surface) {
        continue;
      }
      for (const issue of validateSurface(surfaceId, surface.components, surface.dataModel, {
        catalog: __privateGet(this, _catalog2)
      })) {
        __privateGet(this, _errors).push(validationError(issue));
      }
    }
  };
  /** One session per surface, so subtrees are reused across redraws. */
  sessionFor_fn = function(surfaceId) {
    let session = __privateGet(this, _sessions).get(surfaceId);
    if (!session) {
      session = new RenderSession();
      __privateGet(this, _sessions).set(surfaceId, session);
    }
    return session;
  };
  require_fn = function() {
    if (!__privateGet(this, _runtime)) {
      throw new Error("a2ui: call attach(runtime) with the host runtime before rendering");
    }
    return __privateGet(this, _runtime);
  };

  // src/native/global.ts
  var bridge = new A2UINativeBridge();
  globalThis.a2ui = bridge;
  return __toCommonJS(global_exports);
})();
