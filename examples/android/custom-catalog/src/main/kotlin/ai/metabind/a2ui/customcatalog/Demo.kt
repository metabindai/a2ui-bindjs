// The example's own state: five hosts, and the messages each was given.
//
// Five hosts, and therefore five isolates on the one sandbox, on purpose: each renders on
// its own and they never exchange handler ids. An app that also renders BindJS of its own
// would pass that runtime to one host, not all five.
//
// Everything here suspends, because every way into the Android runtime does — the sandbox
// is out of process, and Kotlin only ever sends a script and waits for a string back.

package ai.metabind.a2ui.customcatalog

import ai.metabind.a2ui.A2UIAction
import ai.metabind.a2ui.A2UIHost
import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class Demo(context: Context) {

    /** The basic catalog, untouched. */
    val builtIn = A2UIHost(context, locale = "en-US")

    /** The same package, told about three components before the first surface arrives. */
    val branded = A2UIHost(context, locale = "en-US")

    /** The flight search: the basic catalog plus one type of the app's own. */
    val flights = A2UIHost(context, locale = "en-US")

    /**
     * The sales dashboard: the basic catalog plus `Chart`, named three times on one surface
     * for three different shapes.
     */
    val dashboard = A2UIHost(context, locale = "en-US")

    /** The habitat sort: the basic catalog plus `SortBoard`, one type carrying a whole interaction. */
    val habitat = A2UIHost(context, locale = "en-US")

    val hosts = listOf(builtIn, branded, flights, dashboard, habitat)

    private val _actions = MutableStateFlow(emptyList<LoggedAction>())

    /**
     * What the surfaces have dispatched, newest first.
     *
     * Recorded against the host and surface it came from, so a screen shows only its own:
     * two of them share the `branded` host, and all of them share this object.
     */
    val actions: StateFlow<List<LoggedAction>> = _actions.asStateFlow()

    // MARK: - Lifecycle

    suspend fun start() {
        branded.useCatalog(Brand.sources, Brand.catalog)
        flights.useCatalog(Flights.sources, Flights.catalog)
        dashboard.useCatalog(Dashboard.sources, Dashboard.catalog)
        habitat.useCatalog(Habitat.sources, Habitat.catalog)

        applyAll()
    }

    suspend fun reset() {
        _actions.value = emptyList()

        for (host in hosts) {
            host.reset()
        }

        applyAll()
    }

    fun close() {
        for (host in hosts) {
            host.close()
        }
    }

    /** Each host gets the messages it is there to draw. */
    private suspend fun applyAll() {
        builtIn.apply(Agent.messages)
        branded.apply(Agent.messages)
        flights.apply(Flights.messages)
        dashboard.apply(Dashboard.messages)
        habitat.apply(Habitat.messages)
    }

    // MARK: - Actions

    fun record(host: A2UIHost, action: A2UIAction) {
        val entry = LoggedAction(
            host = host,
            surfaceId = action.surfaceId,
            name = action.name,
            payload = LoggedValue.pairs(action.context),
        )

        _actions.value = (listOf(entry) + _actions.value).take(12)
    }

}

/**
 * Everything the given surfaces dispatched, out of a collected log.
 *
 * An extension on the collected list rather than a method on `Demo`, because a composable
 * has to read the `StateFlow` through `collectAsState` to recompose at all — reaching into
 * the holder for the current value would draw once and then stop.
 */
fun List<LoggedAction>.forSurfaces(drawn: List<Drawn>): List<LoggedAction> {
    val wanted = drawn.map { it.host to it.surfaceId }.toSet()

    return filter { (it.host to it.surfaceId) in wanted }
}

// MARK: - What a screen draws

/**
 * A host and one of its surfaces. A screen's activity — what it dispatched, what it could
 * not draw — is the sum of these, so the Rating screen accounts for both of its hosts.
 */
data class Drawn(val host: A2UIHost, val surfaceId: String)

// MARK: - One dispatched action

/**
 * What the agent would have received, kept as fields rather than a formatted string so the
 * view can lay it out.
 */
data class LoggedAction(
    val host: A2UIHost,
    val surfaceId: String,
    val name: String,

    /** The engine-resolved action context, a row per entry. Empty when it carried none. */
    val payload: List<LoggedValue>,

    val id: Long = nextId++,
) {
    companion object {
        private var nextId = 0L
    }
}

/** One entry of an action's context. */
data class LoggedValue(val key: String, val value: String) {

    companion object {

        /**
         * Sorted by key, because a map has no order of its own and a log that reshuffles
         * between entries is hard to read.
         */
        fun pairs(context: Map<String, Any?>): List<LoggedValue> =
            context.entries
                .sortedBy { it.key }
                .map { LoggedValue(it.key, describe(it.value)) }

        private fun describe(value: Any?): String = when (value) {
            null -> ""
            is String -> value
            is Boolean -> if (value) "true" else "false"
            else -> value.toString()
        }
    }
}
