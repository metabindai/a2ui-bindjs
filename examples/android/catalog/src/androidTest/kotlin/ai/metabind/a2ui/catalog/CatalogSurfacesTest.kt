// The Android counterpart of the iOS example's `--check`.
//
// Applies every showcase — the basic screens and both spec corpora — to a host and asks
// each to decode the way `A2UISurfaceView` would. A surface that produces no tree or a
// diagnostic fails the test and names itself. Instrumented, because `JavaScriptSandbox`
// is served by the system WebView.

package ai.metabind.a2ui.catalog

import ai.metabind.a2ui.A2UIHost
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.time.Duration.Companion.minutes

@RunWith(AndroidJUnit4::class)
class CatalogSurfacesTest {

    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Test
    fun everyShowcaseRendersWithoutDiagnostics() = runTest(timeout = 15.minutes) {
        val host = A2UIHost(context, locale = "en-US")
        val failures = mutableListOf<String>()
        var total = 0

        try {
            for (group in Group.entries) {
                val items = if (group == Group.BASIC) Showcases.basic else Showcases.spec(context, group)

                assertTrue("${group.title} should not be empty", items.isNotEmpty())

                for (showcase in items) {
                    total += 1
                    host.reset()
                    host.apply(showcase.messages)

                    val ids = host.surfaceIds.value

                    if (ids.isEmpty()) {
                        failures += "${showcase.id}: no surface"
                        continue
                    }

                    for (id in ids) {
                        val tree = host.ast(id)
                        val diagnostics = host.diagnostics.value

                        if (tree == null) {
                            failures += "${showcase.id}/$id: no tree"
                        }

                        if (diagnostics.isNotEmpty()) {
                            failures += "${showcase.id}/$id: " + diagnostics.joinToString("; ") { it.description }
                        }
                    }
                }
            }
        } finally {
            host.close()
        }

        assertEquals(104, total)
        assertEquals("surfaces that failed:\n" + failures.joinToString("\n"), emptyList<String>(), failures)
    }
}
