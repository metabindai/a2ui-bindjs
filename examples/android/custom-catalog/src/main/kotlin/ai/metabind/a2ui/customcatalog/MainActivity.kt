// The app's own Compose — all of it.
//
// Four panels of chrome around the same two surfaces drawn by two hosts. Nothing here
// describes an offer card or a star; that arrives as A2UI and a catalog draws it.

package ai.metabind.a2ui.customcatalog

import ai.metabind.a2ui.A2UIHost
import ai.metabind.a2ui.A2UISurfaceView
import ai.metabind.bindjs.composables.LocalHostScrollsVertically
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
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

    // Two hosts, two isolates on the one sandbox, on purpose: each renders on its own and
    // they never exchange handler ids. An app that also renders BindJS of its own would
    // pass that runtime to one host, not both.
    val builtIn = remember { A2UIHost(context, locale = "en-US") }
    val branded = remember { A2UIHost(context, locale = "en-US") }
    val scope = rememberCoroutineScope()
    var actionLog by remember { mutableStateOf(listOf<String>()) }
    val builtInDiagnostics by builtIn.diagnostics.collectAsState()

    LaunchedEffect(builtIn) {
        builtIn.apply(Agent.messages)
    }

    // Told about three components before the first surface arrives.
    LaunchedEffect(branded) {
        branded.useCatalog(Brand.sources, Brand.catalog)
        branded.apply(Agent.messages)
    }

    for (host in listOf(builtIn, branded)) {
        LaunchedEffect(host) {
            host.actions.collect { action ->
                actionLog = (listOf("${action.name} ${action.contextJson}") + actionLog).take(6)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Header(onReset = {
            scope.launch {
                actionLog = emptyList()

                for (host in listOf(builtIn, branded)) {
                    host.reset()
                    host.apply(Agent.messages)
                }
            }
        })

        // This screen scrolls, so any `ScrollView` inside a surface degrades to a column.
        CompositionLocalProvider(LocalHostScrollsVertically provides true) {
            Panel("Built-in catalog") {
                A2UISurfaceView(host = builtIn, surfaceId = "main", placeholder = { Loading() })
            }

            Panel("Text and Button overridden") {
                A2UISurfaceView(host = branded, surfaceId = "main", placeholder = { Loading() })
            }

            Panel("Rating, registered by this app") {
                A2UISurfaceView(host = branded, surfaceId = "review", placeholder = { Loading() })
            }

            Panel("The same surface, without the catalog") {
                A2UISurfaceView(host = builtIn, surfaceId = "review", placeholder = { Loading() })

                val entries = builtInDiagnostics.filter { it.surfaceId == "review" }.map { it.description }

                if (entries.isNotEmpty()) {
                    Entries("Diagnostics", entries, MaterialTheme.colorScheme.error)
                }
            }
        }

        if (actionLog.isNotEmpty()) {
            Entries("Sent to the agent", actionLog, MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Header(onReset: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text("One surface, two catalogs", style = MaterialTheme.typography.titleMedium)
        Text(
            "Same messages on every panel. Only the catalog differs.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        TextButton(onClick = onReset, modifier = Modifier.align(Alignment.Start)) {
            Text("Reset")
        }
    }
}

@Composable
private fun Loading() {
    CircularProgressIndicator(modifier = Modifier.padding(24.dp))
}

@Composable
private fun Panel(title: String, content: @Composable () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            title.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        content()
    }
}

@Composable
private fun Entries(title: String, entries: List<String>, tint: Color) {
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
