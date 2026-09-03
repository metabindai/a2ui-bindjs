// The values that cross the boundary.
//
// Everything comes back from the JavaScript sandbox as a string, so these types are where
// that stops: a host should never have to parse JSON to find out what the user did.

package ai.metabind.a2ui

import org.json.JSONArray
import org.json.JSONObject

// MARK: - Actions

/**
 * Something the surface dispatched, on its way to the agent.
 *
 * Answer it with more A2UI and hand that back to [A2UIHost.apply].
 */
data class A2UIAction(
    val name: String,
    val surfaceId: String,
    val sourceComponentId: String?,
    val timestamp: String?,

    /** The action's context, resolved against the data model at the moment of the tap. */
    val context: Map<String, Any?>,

    /** The same context as JSON, which is usually what gets sent onward. */
    val contextJson: String,
) {
    internal companion object {
        /** Parses what `a2ui.takeActionsJSON()` returns. */
        fun list(json: String): List<A2UIAction> {
            val array = runCatching { JSONArray(json) }.getOrNull() ?: return emptyList()

            return (0 until array.length()).mapNotNull { index ->
                array.optJSONObject(index)?.let(::from)
            }
        }

        private fun from(entry: JSONObject): A2UIAction? {
            val name = entry.optString("name").takeIf { it.isNotEmpty() } ?: return null
            val context = entry.optJSONObject("context") ?: JSONObject()

            return A2UIAction(
                name = name,
                surfaceId = entry.optString("surfaceId"),
                sourceComponentId = entry.optString("sourceComponentId").takeIf { it.isNotEmpty() },
                timestamp = entry.optString("timestamp").takeIf { it.isNotEmpty() },
                context = context.toMap(),
                contextJson = context.toString(),
            )
        }
    }
}

// MARK: - Diagnostics

/**
 * Something the renderer could not draw, reported rather than thrown.
 *
 * A2UI surfaces arrive from an agent, so a component the catalog does not know is a
 * normal event. The rest of the surface still renders.
 */
data class A2UIDiagnostic(
    val surfaceId: String,
    val componentId: String?,
    val code: String?,
    val message: String,
) {
    val description: String
        get() = listOfNotNull(surfaceId.takeIf { it.isNotEmpty() }, componentId, message).joinToString(" · ")

    internal companion object {
        fun list(surfaceId: String, json: String): List<A2UIDiagnostic> {
            val array = runCatching { JSONArray(json) }.getOrNull() ?: return emptyList()

            return (0 until array.length()).mapNotNull { index ->
                array.optJSONObject(index)?.let { entry ->
                    A2UIDiagnostic(
                        surfaceId = surfaceId,
                        componentId = entry.optString("componentId").takeIf { it.isNotEmpty() },
                        code = entry.optString("code").takeIf { it.isNotEmpty() },
                        message = entry.optString("message").takeIf { it.isNotEmpty() } ?: "unknown",
                    )
                }
            }
        }
    }
}

// MARK: - JSON

/** `org.json` containers as Kotlin ones, with `JSONObject.NULL` flattened to `null`. */
internal fun JSONObject.toMap(): Map<String, Any?> = keys().asSequence().associateWith { key -> unwrap(get(key)) }

private fun JSONArray.toList(): List<Any?> = (0 until length()).map { index -> unwrap(get(index)) }

private fun unwrap(value: Any?): Any? = when (value) {
    JSONObject.NULL -> null
    is JSONObject -> value.toMap()
    is JSONArray -> value.toList()
    else -> value
}
