// The Android counterpart of the iOS example's `--check`.
//
// Proves the catalog is what makes the difference: the host without it cannot draw
// `Rating`, the host with it can, and a write into the data model repaints. The flight
// search does the same for a type that stands in for a whole row of chrome. Instrumented,
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

    @Test
    fun theFlightSurfaceBindsThreeRowsToOneCustomType() = runTest(timeout = 2.minutes) {
        val host = A2UIHost(context, locale = "en-US")

        try {
            host.useCatalog(Flights.sources, Flights.catalog)
            host.apply(Flights.messages)

            // The AST as JSON, the way the iOS check reads it. `ast` decodes to Compose;
            // this is the same render, left as the string the sandbox hands back.
            host.ast("flights")
            val surface = host.runtime.evaluate("a2ui.renderJSON('flights');")

            assertEquals(emptyList<Any>(), host.diagnostics.value)
            assertTrue("the template should bind a ForEach over three rows", surface.contains("\"count\":3"))
        } finally {
            host.close()
        }
    }

    @Test
    fun theCardDrawsWhatItIsHanded() = runTest(timeout = 2.minutes) {
        val host = A2UIHost(context, locale = "en-US")

        try {
            host.useCatalog(Flights.sources, Flights.catalog)

            // Not templated: a template's rows are built lazily inside the `ForEach`
            // callback, so they are not in the tree `render` returns and this one is.
            host.apply(Flights.singleCard)

            host.ast("one")
            val card = host.runtime.evaluate("a2ui.renderJSON('one');")

            assertTrue(card.contains("United Airlines"))
            assertTrue(card.contains("\$289"))

            // `Color('#f59e0b')` crosses as channels, not as the hex it was written as, so
            // the Delayed status dot is checked by the colour it ended up with.
            assertTrue("the status dot should be amber", card.contains("\"r\":245,\"g\":158,\"b\":11"))
        } finally {
            host.close()
        }
    }

    @Test
    fun theDashboardDrawsOneChartTypeInThreeShapes() = runTest(timeout = 2.minutes) {
        val host = A2UIHost(context, locale = "en-US")

        try {
            host.useCatalog(Dashboard.sources, Dashboard.catalog)
            host.apply(Dashboard.messages)

            host.ast("dashboard")
            val surface = host.runtime.evaluate("a2ui.renderJSON('dashboard');")

            assertEquals(emptyList<Any>(), host.diagnostics.value)

            // One entry point, three shapes: the cartesian marks and the pie slices come
            // from the two inline components behind the one A2UI type.
            assertTrue("the bar chart should emit bar marks", surface.contains("BarMark"))
            assertTrue("the line chart should emit line marks", surface.contains("LineMark"))
            assertTrue("the donut should emit pie slices", surface.contains("PieSliceMark"))

            // `formatCurrency` is the engine's, applied before the surface is built.
            assertTrue("the total should be formatted by the engine", surface.contains("708,550"))
        } finally {
            host.close()
        }
    }

    @Test
    fun theSortBoardDealsADeckOverThreeBins() = runTest(timeout = 2.minutes) {
        val host = A2UIHost(context, locale = "en-US")

        try {
            host.useCatalog(Habitat.sources, Habitat.catalog)
            host.apply(Habitat.messages)

            host.ast("habitat")
            val surface = host.runtime.evaluate("a2ui.renderJSON('habitat');")

            assertEquals(emptyList<Any>(), host.diagnostics.value)

            // The bins are the agent's; the prompt and the count are the component's.
            for (bin in listOf("Ocean", "Savanna", "Arctic")) {
                assertTrue("the board should name the bin ${'$'}bin", surface.contains(bin))
            }

            assertTrue("the deck should be nine deep", surface.contains("1 of 9"))
        } finally {
            host.close()
        }
    }

    @Test
    fun aHostThatNeverRegisteredFlightCardReportsIt() = runTest(timeout = 2.minutes) {
        val host = A2UIHost(context, locale = "en-US")

        try {
            host.apply(Flights.singleCard)
            host.ast("one")

            assertTrue(host.diagnostics.value.any { it.message.contains("FlightCard") })
        } finally {
            host.close()
        }
    }
}
