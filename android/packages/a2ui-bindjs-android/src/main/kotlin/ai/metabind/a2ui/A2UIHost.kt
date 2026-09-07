// A2UI on a BindJS host.
//
// One `JsRuntime`, and therefore one isolate, shared by the app and the A2UI renderer.
// That sharing is not an optimisation: a `handlerId` in the AST only resolves back to a
// closure inside the instance that stored it, and hook state is keyed by component path
// within that instance. A renderer carrying a second runtime would draw a correct-looking
// tree and then do nothing at all when tapped.
//
// So a host that already renders BindJS components passes its runtime in, and A2UI
// surfaces and hand-written components share one isolate.

package ai.metabind.a2ui

import ai.metabind.bindjs.JsRuntime
import ai.metabind.bindjs.JsRuntimeImpl
import ai.metabind.bindjs.composables.UiEvent
import ai.metabind.bindjs.composables.routeUiEvent
import ai.metabind.bindjs.model.BaseComponent
import android.content.Context
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale
import java.util.TimeZone

/**
 * Holds A2UI surfaces and renders them through a BindJS runtime.
 *
 * ```kotlin
 * val host = A2UIHost(context)
 * host.apply(messagesFromTheAgent)      // JSON, one message or an array
 *
 * A2UISurfaceView(host = host)          // in a composable
 * ```
 *
 * Every entry point is `suspend`: the JavaScript engine on Android is an out-of-process
 * sandbox reached over IPC, so nothing here can be synchronous the way the Apple package
 * is. `A2UISurfaceView` does the awaiting for you.
 *
 * @param context used to read the renderer bundle out of this package's resources.
 * @param runtime the runtime to share. Defaults to one of its own, which this host then
 *   owns and [close]s; an app that already renders BindJS should pass its own so that
 *   hand-written components and agent-authored surfaces share a runtime.
 * @param locale BCP 47 tag used by the formatting functions. Defaults to the device's.
 * @param timeZone IANA identifier used by the date functions. Defaults to the device's.
 * @param validate report structural problems as A2UI `error` messages ([takeErrors]).
 *   Off by default: a surface being streamed is legitimately incomplete part-way
 *   through, so validating every message would report errors that are not true yet.
 */
class A2UIHost(
    context: Context,
    runtime: JsRuntime? = null,
    private val locale: String = Locale.getDefault().toLanguageTag(),
    private val timeZone: String = TimeZone.getDefault().id,
    private val validate: Boolean = false,
) {
    private val appContext = context.applicationContext

    /** The runtime surfaces are drawn through. Pass one in to share it. */
    val runtime: JsRuntime = runtime ?: JsRuntimeImpl.create(appContext)

    private val ownsRuntime = runtime == null

    private val _surfaceIds = MutableStateFlow<List<String>>(emptyList())
    val surfaceIds: StateFlow<List<String>> = _surfaceIds.asStateFlow()

    /** What the renderer could not draw. Empty is the healthy case. */
    private val _diagnostics = MutableStateFlow<List<A2UIDiagnostic>>(emptyList())
    val diagnostics: StateFlow<List<A2UIDiagnostic>> = _diagnostics.asStateFlow()

    /**
     * Actions the surfaces dispatched — the agent's half of the conversation.
     *
     * Answer one with more A2UI and hand it back to [apply]. Replayless and buffered, so
     * a collector that attaches late misses nothing already in flight but does not
     * re-receive history.
     */
    private val _actions = MutableSharedFlow<A2UIAction>(extraBufferCapacity = 64)
    val actions: SharedFlow<A2UIAction> = _actions.asSharedFlow()

    /**
     * Bumped whenever something makes the drawn tree stale.
     *
     * Two independent things do, and neither marks the runtime dirty on its own: the A2UI
     * data model changing (a control writing back owns its value in the model, not in
     * BindJS hook state) and BindJS hook state changing inside a stateful catalog
     * component such as `Modal`. The renderer bundle routes the first into the second's
     * signal at attach time, so both arrive here as one counter to redraw on.
     */
    private val _revision = MutableStateFlow(0)
    val revision: StateFlow<Int> = _revision.asStateFlow()

    private val attachment = Mutex()
    private var attached = false

    // MARK: - Catalog

    /**
     * Registers BindJS components of the app's own and names the A2UI types they draw.
     *
     * [sources] is BindJS component name → source. [catalog] is A2UI type → BindJS
     * component name, merged over the current catalog: name only the entries you are
     * adding or replacing, and the basic catalog stays underneath. Call it before the
     * first surface arrives.
     *
     * The same call adds a type the basic catalog lacks (`"Rating" to "Rating"`) or
     * restyles one it has (`"Button" to "BrandButton"`). The sources are the strings the
     * web and Apple renderers take, so one component covers every platform.
     */
    suspend fun useCatalog(sources: Map<String, String>, catalog: Map<String, String> = emptyMap()) {
        attach()

        evaluate("a2ui.useCatalog(${JSONObject(sources)}, ${JSONObject(catalog)});")
    }

    // MARK: - Messages in

    /** Applies one agent message or an array of them, as JSON. */
    suspend fun apply(messages: String) {
        attach()

        // The JSON is embedded as a JavaScript expression rather than as a quoted string
        // the bridge would have to parse again: every JSON document is already a valid JS
        // expression, and this way nothing has to be escaped twice.
        evaluate("a2ui.applyMessages($messages);")

        refreshSurfaceIds()
        takeActions()
    }

    /** Writes into the data model, as a two-way bound control would. */
    suspend fun setValue(surfaceId: String, path: String, value: Any?) {
        attach()

        // Wrapped in an array so one encoder covers strings, numbers, booleans, null and
        // whole objects, then unwrapped in JavaScript. `JSONObject.quote` alone would
        // only have handled the string case.
        val encoded = JSONArray().put(JSONObject.wrap(value)).toString()

        evaluate("a2ui.setValue(${quote(surfaceId)}, ${quote(path)}, $encoded[0]);")
    }

    /** Drops every surface and starts over. */
    suspend fun reset() {
        attach()
        evaluate("a2ui.reset();")

        _diagnostics.value = emptyList()

        refreshSurfaceIds()
    }

    /**
     * Everything validation reported since the last call, as A2UI `error` messages ready
     * to send to the agent. Always empty unless the host was built with `validate = true`.
     */
    suspend fun takeErrors(): String {
        attach()

        return evaluate("a2ui.takeErrorsJSON();")
    }

    // MARK: - Rendering

    /**
     * Builds the AST for a surface, or `null` when there is no such surface.
     *
     * Goes through [JsRuntime.renderExternal] and nowhere else: the runtime's
     * component-path counters have to be reset immediately before the tree is built and
     * it has to be decoded immediately after, and that method is what holds the three
     * together.
     */
    suspend fun ast(surfaceId: String? = null): BaseComponent<*>? {
        attach()

        val id = surfaceId ?: _surfaceIds.value.firstOrNull() ?: return null

        if (id !in _surfaceIds.value) {
            return null
        }

        val tree = runtime.renderExternal(renderScript(id))

        // Read back from the same render rather than rendering again for them, which is
        // what the Apple package can afford to do. There the second pass is memoised and
        // in-process; here every render crosses a process boundary carrying the whole
        // tree as JSON, so the cheap thing on iOS is the expensive thing on Android.
        _diagnostics.value = A2UIDiagnostic.list(id, evaluate(DIAGNOSTICS))

        return tree
    }

    // MARK: - Events out

    /**
     * Delivers a [UiEvent] from `BindJSView` and forwards whatever the surface dispatched.
     *
     * Actions are drained here rather than pushed from JavaScript because on Android every
     * way into the runtime is host-initiated: a tap arrives as this call, so by the time
     * it returns any action it produced is already queued. The Apple package needs a
     * callback for the same job, since a tap there happens inside JavaScriptCore with no
     * Swift frame beneath it.
     */
    suspend fun dispatch(event: UiEvent): List<A2UIAction> {
        attach()

        var dispatched = emptyList<A2UIAction>()

        runtime.routeUiEvent(event) { dispatched = takeActions() }

        return dispatched
    }

    /**
     * Drains the action queue, returning what was in it and publishing it on [actions].
     *
     * [dispatch] already does this, so a host collecting [actions] never needs to call it.
     * It is here for one that would rather pull than collect — and because a returned list
     * is answerable, where a hot flow has to be raced.
     */
    suspend fun takeActions(): List<A2UIAction> {
        attach()

        val drained = A2UIAction.list(evaluate("a2ui.takeActionsJSON();"))

        for (action in drained) {
            _actions.emit(action)
        }

        return drained
    }

    /** Releases the runtime, if this host made it. Harmless on a shared one. */
    fun close() {
        if (ownsRuntime) {
            runtime.close()
        }
    }

    // MARK: - The bridge

    /**
     * Loads the renderer into the isolate the runtime already lives in, once.
     *
     * `runtime` is fetched by naming it in evaluated source rather than off `globalThis`:
     * `script.js` declares it as a `const`, so it lives in the global *lexical*
     * environment. That value is the `BindJSRuntime` itself, not the facade of globals
     * wrapped around it — the facade has `callComponent` and `willRender`, while a
     * renderer registering a catalog needs `registerComponent`.
     */
    private suspend fun attach() {
        if (attached) {
            return
        }

        attachment.withLock {
            if (attached) {
                return
            }

            runtime.awaitReady()

            val bundle = appContext.resources.openRawResource(R.raw.a2ui_native).use { stream ->
                stream.bufferedReader().readText()
            }

            evaluate(bundle)
            evaluate(attachScript())

            // A2UI surfaces redraw on this counter. The bundle was told at attach time to
            // route both store changes and dispatched actions into `needsRerender`, which
            // is the signal bindjs already coalesces and posts to the main thread — so
            // this one listener covers hook state and the data model alike.
            runtime.setOnRerenderRequested { _revision.value += 1 }

            attached = true
        }
    }

    private fun attachScript(): String {
        val options = JSONObject()
            .put("locale", locale)
            .put("timeZone", timeZone)
            .put("validate", validate)

        return """
            a2ui.attach(runtime, $options);
            a2ui.onChange(function () { runtime.needsRerender(); });
            a2ui.onActions(function () { runtime.needsRerender(); });
            "attached";
        """.trimIndent()
    }

    private suspend fun refreshSurfaceIds() {
        val ids = JSONArray(evaluate("JSON.stringify(a2ui.surfaceIds());"))

        _surfaceIds.value = (0 until ids.length()).map(ids::getString)
    }

    private suspend fun evaluate(script: String): String = runtime.evaluate(script)

    private companion object {
        /** Where [renderScript] leaves the diagnostics from the render it just did. */
        const val DIAGNOSTICS = "globalThis.__a2uiDiagnostics;"

        /**
         * One render, yielding the AST as JSON and stashing its diagnostics.
         *
         * Serialised with bindjs's `customJSONStringify` rather than `JSON.stringify`,
         * which is not interchangeable here: `JSON.stringify` has no representation for
         * `Infinity` and emits `null`, while the Kotlin side reads that field as a
         * `Float` and throws. Half the catalog carries `.frame({ maxWidth: Infinity })`,
         * so this is every surface, not an edge case. bindjs writes the string
         * `"Infinity"` and decodes it back on arrival, which is why its own
         * `callComponent` goes through the same function.
         *
         * Falls back to an `Empty` directive rather than `null` when a surface produces
         * no tree at all: Gson decodes a component into a non-null type, so `null` here
         * would surface a drawable failure as a crash — and a surface that renders
         * nothing is exactly the case where the diagnostics matter most.
         */
        fun renderScript(surfaceId: String): String = """
            (function () {
                var result = a2ui.render(${quote(surfaceId)});
                globalThis.__a2uiDiagnostics = JSON.stringify(result ? result.diagnostics : []);
                return customJSONStringify((result && result.ast) || { type: "Empty", props: {} });
            })();
        """.trimIndent()

        fun quote(value: String): String = JSONObject.quote(value)
    }
}
