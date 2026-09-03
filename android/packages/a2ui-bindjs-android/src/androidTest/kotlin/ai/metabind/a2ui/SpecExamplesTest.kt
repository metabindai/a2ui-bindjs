// The official spec examples, rendered on a device.
//
// `core/tests/conformance.test.ts` renders these same 43 surfaces in Node and asserts the
// engine reports nothing it could not draw. This runs them the rest of the way: through
// the sandbox, across the bridge as JSON, and into a decoded Compose tree — which is where
// a surface that renders perfectly well in Node can still arrive as nothing, because a
// value has no JSON representation or a prop is missing from the Kotlin model.

package ai.metabind.a2ui

import ai.metabind.bindjs.JsRuntime
import ai.metabind.bindjs.JsRuntimeImpl
import ai.metabind.bindjs.model.EmptyComponent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.time.Duration.Companion.minutes

@RunWith(AndroidJUnit4::class)
class SpecExamplesTest {

    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val assets = InstrumentationRegistry.getInstrumentation().context.assets

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

    @Test
    fun everySpecExampleRendersIntoATree() = runTest(timeout = 10.minutes) {
        val files = assets.list(EXAMPLES)?.filter { it.endsWith(".json") }.orEmpty().sorted()

        assertTrue("the spec examples were packaged into the test APK", files.size >= 40)

        val failures = mutableListOf<String>()

        for (file in files) {
            // One host, reset between examples, rather than one isolate each: starting a
            // sandbox 43 times would dominate the run, and a reset drops every surface.
            host.reset()

            val document = JSONObject(assets.open("$EXAMPLES/$file").bufferedReader().use { it.readText() })

            host.apply(document.getJSONArray("messages").toString())

            if (host.surfaceIds.value.isEmpty()) {
                failures += "$file: applied no surfaces"

                continue
            }

            for (surfaceId in host.surfaceIds.value) {
                val tree = host.ast(surfaceId)

                when {
                    tree == null -> failures += "$file/$surfaceId: rendered nothing"
                    tree is EmptyComponent -> failures += "$file/$surfaceId: decoded to the unknown-type fallback"
                }

                for (diagnostic in host.diagnostics.value) {
                    failures += "$file/$surfaceId: ${diagnostic.message}"
                }
            }
        }

        assertTrue(failures.joinToString("\n"), failures.isEmpty())
    }

    private companion object {
        const val EXAMPLES = "a2ui-spec-examples"
    }
}
