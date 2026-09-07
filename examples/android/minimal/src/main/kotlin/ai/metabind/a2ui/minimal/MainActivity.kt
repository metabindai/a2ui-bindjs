// A2UI on a native host.
//
// A Compose app whose only screen is described by an agent. Everything outside
// `A2UISurfaceView` is chrome: a title, a reset button, a log of what was sent back.

package ai.metabind.a2ui.minimal

import ai.metabind.a2ui.A2UIHost
import ai.metabind.a2ui.A2UISurfaceView
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import ai.metabind.bindjs.composables.LocalHostScrollsVertically
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    DemoScreen()
                }
            }
        }
    }
}

@Composable
private fun DemoScreen() {
    val context = LocalContext.current

    // A host of its own, because nothing else in this app renders BindJS. An app that
    // already did would pass its runtime in, so both share one.
    val host = remember { A2UIHost(context, locale = "en-US") }
    val scope = rememberCoroutineScope()

    var actionLog by remember { mutableStateOf(listOf<String>()) }

    val diagnostics by host.diagnostics.collectAsState()

    LaunchedEffect(host) {
        host.apply(Agent.opening)
    }

    // The agent's half of the conversation: it answers an action with more A2UI, applied
    // to the same surface. A real app would send this to a server instead.
    LaunchedEffect(host) {
        host.actions.collect { action ->
            actionLog = (listOf("${action.name} ${action.contextJson}") + actionLog).take(6)

            Agent.reply(action.name, action.context)?.let { host.apply(it) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Header(onReset = {
            scope.launch {
                actionLog = emptyList()
                host.reset()
                host.apply(Agent.opening)
            }
        })

        // This screen scrolls, so any `ScrollView` inside the surface has to degrade to a
        // column rather than fight it.
        CompositionLocalProvider(LocalHostScrollsVertically provides true) {
            A2UISurfaceView(
                host = host,
                placeholder = {
                    CircularProgressIndicator(modifier = Modifier.padding(24.dp))
                },
            )
        }

        if (diagnostics.isNotEmpty()) {
            Panel("Diagnostics", diagnostics.map { it.description }, MaterialTheme.colorScheme.error)
        }

        if (actionLog.isNotEmpty()) {
            Panel("Sent to the agent", actionLog, MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Header(onReset: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text("A2UI on BindJS", style = MaterialTheme.typography.titleMedium)

        Text(
            "The card below is agent-authored — no Compose describes it.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        TextButton(onClick = onReset, modifier = Modifier.align(Alignment.Start)) {
            Text("Reset")
        }
    }
}

@Composable
private fun Panel(title: String, entries: List<String>, tint: androidx.compose.ui.graphics.Color) {
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            title,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        for (entry in entries) {
            Text(entry, style = MaterialTheme.typography.bodySmall, color = tint)
        }
    }
}
