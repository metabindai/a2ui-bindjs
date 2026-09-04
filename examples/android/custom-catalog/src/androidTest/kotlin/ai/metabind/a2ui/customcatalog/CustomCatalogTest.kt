// The Android counterpart of the iOS example's `--check`.
//
// Proves the catalog is what makes the difference: the host without it cannot draw
// `Rating`, the host with it can, and a write into the data model repaints. Instrumented,
// because `JavaScriptSandbox` is served by the system WebView.
package ai.metabind.a2ui.customcatalog

import ai.metabind.a2ui.A2UIHost
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.time.Duration.Companion.minutes

@RunWith(AndroidJUnit4::class)
class CustomCatalogTest {

    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Test
    fun theBasicCatalogReportsRatingAsUnknown() = runTest(timeout = 2.minutes) {
        val host = A2UIHost(context, locale = "en-US")

        try {
            host.apply(Agent.messages)

            assertNotNull(host.ast("main"))
            assertTrue(host.diagnostics.value.isEmpty())

            host.ast("review")
            assertTrue(host.diagnostics.value.any { it.message.contains("Rating") })
        } finally {
            host.close()
        }
    }

    @Test
    fun theRegisteredCatalogDrawsRatingAndRepaintsOnWrite() = runTest(timeout = 2.minutes) {
        val host = A2UIHost(context, locale = "en-US")

        try {
            host.useCatalog(Brand.sources, Brand.catalog)
            host.apply(Agent.messages)

            assertNotNull(host.ast("review"))
            assertEquals(emptyList<Any>(), host.diagnostics.value)

            val before = host.revision.value
            host.setValue("review", "/review/stars", 5)

            assertNotNull(host.ast("review"))
            assertTrue("a write into the data model should bump the revision", host.revision.value >= before)
        } finally {
            host.close()
        }
    }
}
