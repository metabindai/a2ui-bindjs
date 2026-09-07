// The bridge, end to end on a device.
//
// The Android counterpart of `examples/ios/minimal/Sources/A2UIMinimal/Checks.swift`, and
// it has to be an instrumented test rather than a JVM one: `JavaScriptSandbox` is served
// by the system WebView, so there is no Robolectric shadow that would mean anything. A
// failure here attributes itself to the bridge before anyone looks at a layout.

package ai.metabind.a2ui

import ai.metabind.bindjs.JsRuntime
import ai.metabind.bindjs.JsRuntimeImpl
import ai.metabind.bindjs.composables.UiEvent
import ai.metabind.bindjs.model.EmptyComponent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.time.Duration.Companion.seconds

@RunWith(AndroidJUnit4::class)
class A2UIBridgeTest {

    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    private lateinit var runtime: JsRuntime
    private lateinit var host: A2UIHost

    @Before
    fun setUp() {
        runtime = JsRuntimeImpl.create(context)
        host = A2UIHost(context, runtime, locale = "en-US", timeZone = "America/Chicago")
    }

    @After
    fun tearDown() {
        runtime.close()
    }

    // MARK: - The engine the bundle assumes

    /**
     * `Intl` has to exist before anything else matters.
     *
     * `formatNumber`, `formatCurrency`, `formatDate` and `plural` are all built on it.
     * JavaScriptCore ships the whole of it; the sandbox is served by whatever V8 the
     * system WebView carries, and a build without ICU would leave those functions
     * returning something plausible-looking and wrong rather than failing outright.
     */
    @Test
    fun intlIsAvailable() = runTest(timeout = TIMEOUT) {
        runtime.awaitReady()

        assertEquals("function", runtime.evaluate("typeof Intl.NumberFormat;"))
        assertEquals("function", runtime.evaluate("typeof Intl.DateTimeFormat;"))
        assertEquals("function", runtime.evaluate("typeof Intl.PluralRules;"))

        assertEquals(
            "$129.00",
            runtime.evaluate("new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(129);"),
        )
    }

    // MARK: - The bundle loads and attaches

    @Test
    fun theBundleAttachesToTheHostRuntime() = runTest(timeout = TIMEOUT) {
        host.apply(OPENING)

        assertEquals("function", runtime.evaluate("typeof a2ui.render;"))

        // The catalog has to land on the runtime the host owns, not on one the bundle
        // brought with it.
        assertEquals("true", runtime.evaluate("(runtime.components['A2UIText'] !== undefined).toString();"))
    }

    // MARK: - Messages in, a tree out

    @Test
    fun appliesMessagesAndResolvesTheDataModel() = runTest(timeout = TIMEOUT) {
        host.apply(OPENING)

        assertEquals(listOf("main"), host.surfaceIds.value)

        val rendered = render("main")

        assertTrue("a data binding resolved", rendered.contains("Trail Runner X2"))
        assertTrue("a function call resolved", rendered.contains("$129.00"))
    }

    @Test
    fun decodesIntoAComponentTree() = runTest(timeout = TIMEOUT) {
        host.apply(OPENING)

        val tree = host.ast("main")

        assertNotNull("the AST decoded through Gson", tree)
        assertFalse("the root is a real component, not the unknown-type fallback", tree is EmptyComponent)
        assertEquals("no diagnostics", emptyList<A2UIDiagnostic>(), host.diagnostics.value)
    }

    // MARK: - A tap, resolved in this runtime instance

    /**
     * The whole reason the runtime is shared.
     *
     * A `handlerId` only resolves back to a closure inside the instance that stored it, so
     * this is what a renderer carrying its own runtime would fail — after drawing a tree
     * that looked perfectly correct.
     */
    @Test
    fun aTapResolvesAndDispatchesAnAction() = runTest(timeout = TIMEOUT) {
        host.apply(TAP_PROBE)
        host.ast("probe")

        val handlerId = runtime.evaluate(FIRST_HANDLER_ID)

        assertTrue("the rendered AST carries a handler id", handlerId.isNotEmpty() && handlerId != "null")

        val dispatched = host.dispatch(UiEvent.OnTap(handlerId))

        assertEquals(1, dispatched.size)
        assertEquals("smoke_test", dispatched.first().name)
        assertTrue("the action carries its context", dispatched.first().contextJson.contains("\"ok\""))
        assertEquals(true, dispatched.first().context["ok"])
    }

    // MARK: - Two-way binding, and the redraw signal

    @Test
    fun setValueRepaintsTheSurface() = runTest(timeout = TIMEOUT) {
        host.apply(OPENING)
        host.setValue("main", "/product/name", "Trail Runner X3")

        assertTrue(render("main").contains("Trail Runner X3"))
    }

    /**
     * A write into the data model does not touch BindJS hook state — the model owns the
     * value — so the runtime never marks itself dirty on its own. Without the bundle
     * routing store changes into `needsRerender` at attach time, the store would update
     * correctly and the screen would keep showing the tree it drew first.
     */
    @Test
    fun aStoreWriteWakesTheHost() = runTest(timeout = TIMEOUT) {
        host.apply(OPENING)

        val before = host.revision.value

        host.setValue("main", "/order/size", JSONArray().put("S"))

        withTimeout(10.seconds) {
            host.revision.first { it > before }
        }

        assertTrue("the surface reflects the write", render("main").contains("\"S\""))
    }

    // MARK: - Failure is reported, not thrown

    @Test
    fun anUnknownComponentBecomesADiagnostic() = runTest(timeout = TIMEOUT) {
        host.apply(UNKNOWN_COMPONENT)

        val tree = host.ast("broken")

        assertNotNull("the rest of the surface still draws", tree)
        assertTrue("the drawable part is still there", render("broken").contains("drawn"))
        assertFalse("the renderer said what it could not draw", host.diagnostics.value.isEmpty())
    }

    @Test
    fun resetDropsEverySurface() = runTest(timeout = TIMEOUT) {
        host.apply(OPENING)
        host.reset()

        assertEquals(emptyList<String>(), host.surfaceIds.value)
        assertEquals(null, host.ast("main"))
    }

    // MARK: - Helpers

    private suspend fun render(surfaceId: String): String =
        runtime.evaluate("JSON.stringify(a2ui.render('$surfaceId').ast);")

    private companion object {
        val TIMEOUT = 120.seconds

        /** The first stored-function id in the probe surface's tree. */
        const val FIRST_HANDLER_ID = """
            (function () {
                var found = [];
                JSON.stringify(a2ui.render('probe').ast, function (key, value) {
                    if (key === 'handlerId') { found.push(value); }
                    return value;
                });
                return found[0] || '';
            })();
        """

        /** The same shape the iOS example opens with. */
        val OPENING = """
            [{ "version": "v1.0",
               "createSurface": {
                 "surfaceId": "main",
                 "components": [
                   { "id": "root", "component": "Card", "child": "body" },
                   { "id": "body", "component": "Column", "children": ["title", "price", "size"] },
                   { "id": "title", "component": "Text", "variant": "h2", "text": { "path": "/product/name" } },
                   { "id": "price", "component": "Text", "variant": "caption",
                     "text": { "call": "formatCurrency",
                               "args": { "value": { "path": "/product/price" }, "currency": "USD" } } },
                   { "id": "size", "component": "ChoicePicker", "label": "Size",
                     "variant": "mutuallyExclusive",
                     "options": [{ "label": "S", "value": "S" }, { "label": "M", "value": "M" }],
                     "value": { "path": "/order/size" } }
                 ],
                 "dataModel": { "product": { "name": "Trail Runner X2", "price": 129 }, "order": { "size": [] } }
               } }]
        """.trimIndent()

        /** One button, one action — the smallest surface that can be tapped. */
        val TAP_PROBE = """
            [{ "version": "v1.0",
               "createSurface": {
                 "surfaceId": "probe",
                 "components": [
                   { "id": "root", "component": "Button", "child": "label",
                     "action": { "event": { "name": "smoke_test", "context": { "ok": true } } } },
                   { "id": "label", "component": "Text", "text": "Tap" }
                 ],
                 "dataModel": {}
               } }]
        """.trimIndent()

        val UNKNOWN_COMPONENT = """
            [{ "version": "v1.0",
               "createSurface": {
                 "surfaceId": "broken",
                 "components": [
                   { "id": "root", "component": "Column", "children": ["ok", "nope"] },
                   { "id": "ok", "component": "Text", "text": "drawn" },
                   { "id": "nope", "component": "Hologram" }
                 ],
                 "dataModel": {}
               } }]
        """.trimIndent()
    }
}
