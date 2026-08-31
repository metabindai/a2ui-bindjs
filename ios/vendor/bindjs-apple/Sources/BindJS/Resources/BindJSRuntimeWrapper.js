// Custom JSON stringify that preserves Infinity, -Infinity, and NaN
function customJSONStringify(value, replacer, space) {
    return JSON.stringify(value, (key, val) => {
        if (val === Infinity) return "Infinity";
        if (val === -Infinity) return "-Infinity";
        if (Number.isNaN(val)) return "NaN";
        return replacer ? replacer(key, val) : val;
    }, space);
}

const runtime = new BindJSRuntime();

Object.assign(this, {
    setComponents: (args) => runtime.registerComponents(args),
    setASTComponents: (components, modifiers) => runtime.registerASTComponents(components, modifiers),
    call: (args) => runtime.call(...args)(),
    callComponent: (args) => runtime.callComponent(...args),
    callComponentPreview: (args) => runtime.callComponentPreview(...args),
    getComponentPreviewsWithMetadata: (args) => runtime.getComponentPreviewsWithMetadata(...args),
    setEnvironment: (environment) => runtime.registerEnvironment(environment),
    makeComponent: (body, props, children) => runtime.makeComponent(body, props, children),
    restoreEnvironment: (environmentId) => runtime.restoreEnvironment(environmentId),
    restoreFunction: (functionId) => runtime.restoreFunction(functionId),
    setForEachElementId: (id) => runtime.setForEachElementId(id),
    callForEachFunction: (functionId, element, index) => runtime.callForEachFunction(functionId, element, index),
    restoreForEachData: (dataId) => runtime.restoreData(dataId),
    restorePickerValue: (dataId) => runtime.restoreData(dataId),
    restoreOnChangeTrigger: (watcherId) => runtime.restoreOnChangeTrigger(watcherId),
    triggerOnChangeHandler: (watcherId) => runtime.triggerOnChangeHandler(watcherId),
    restoreEventHandler: (handlerId) => runtime.restoreEventHandler(handlerId),
    callEventHandler: (handlerId, ...args) => {
        const handler = runtime.storedFunctions[handlerId]
        if (handler) {
            return handler(...args)
        }
        return null
    },
    willRender: () => runtime.willRender(),
    debug: () => console.log(customJSONStringify(runtime.components)),
    reset: () => runtime.reset(),
    setAppState: (state) => runtime.registerAppState(state),
    updatedAppState: (key, value, completionCallback) => runtime.updatedAppState(key, value, (s) => ({ ...s, [key]: value }), completionCallback),
    setOnOpenURL: (callback) => runtime.onOpenURL = callback,
    setMCPHost: (host) => runtime.mcpHost = host
});