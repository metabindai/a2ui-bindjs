// One A2UI surface, decoded into Compose.

package ai.metabind.a2ui

import ai.metabind.bindjs.composables.BindJSView
import ai.metabind.bindjs.model.BaseComponent
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

/**
 * Draws one of [host]'s surfaces.
 *
 * ```kotlin
 * A2UISurfaceView(host = host)
 * ```
 *
 * Unlike the SwiftUI counterpart, the tree cannot be built in the composable's own body:
 * the JavaScript engine is out-of-process, so `ast` suspends. The surface is therefore
 * held in state and re-fetched whenever [A2UIHost.revision] moves — which covers both a
 * write into the A2UI data model and BindJS's own hook state changing inside a stateful
 * catalog component. [placeholder] fills the gap until the first render lands.
 *
 * A host that embeds this inside its own vertically scrolling content should provide
 * `LocalHostScrollsVertically` as `true` around it, so nested `ScrollView`s degrade to
 * columns instead of fighting the outer scroll.
 *
 * @param surfaceId which surface to draw. Defaults to the first one, which is all an
 *   agent driving a single screen ever creates.
 */
@Composable
fun A2UISurfaceView(
    host: A2UIHost,
    surfaceId: String? = null,
    modifier: Modifier = Modifier,
    placeholder: @Composable () -> Unit = {},
) {
    val surfaceIds by host.surfaceIds.collectAsState()
    val revision by host.revision.collectAsState()

    val id = surfaceId ?: surfaceIds.firstOrNull()

    var component by remember { mutableStateOf<BaseComponent<*>?>(null) }
    var version by remember { mutableIntStateOf(0) }
    var failure by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    LaunchedEffect(id, revision) {
        if (id == null) {
            component = null

            return@LaunchedEffect
        }

        try {
            component = host.ast(id)
            failure = null
            version += 1
        } catch (cancellation: CancellationException) {
            // The surface left composition, or a newer revision superseded this render.
            // Neither is a failure, and swallowing it would break the caller's
            // cancellation.
            throw cancellation
        } catch (error: Exception) {
            failure = error.message ?: error.toString()
        }
    }

    val tree = component
    val message = failure

    when {
        tree != null -> BindJSView(
            jsRuntime = host.runtime,
            component = tree,
            version = version,
            onUiEvent = { event -> scope.launch { host.dispatch(event) } },
        )

        // Not routed through `diagnostics`: those are what the renderer decided it could
        // not draw, and are part of the surface. This is the bridge itself failing, which
        // is a different thing and worth looking different.
        message != null -> BasicText(
            text = "A2UI could not render: $message",
            style = TextStyle(color = Color.Red, fontSize = 12.sp),
            modifier = modifier,
        )

        else -> placeholder()
    }
}
