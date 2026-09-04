// The app's own Compose — all of it.
//
// A three-row menu, a list per group, and for each item a surface drawn by the catalog.
// Nothing here describes what a component looks like; that arrives as A2UI.

package ai.metabind.a2ui.catalog

import ai.metabind.a2ui.A2UIHost
import ai.metabind.a2ui.A2UISurfaceView
import ai.metabind.bindjs.composables.LocalHostScrollsVertically
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
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

        // `--show <id>` on iOS; here `adb shell am start … --es show <id>`. Opens a screen
        // directly, which is what a screenshot script wants.
        val show = intent?.getStringExtra("show")

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    CatalogApp(initialShowcaseId = show)
                }
            }
        }
    }
}

/** Where the user is: the menu, a group's list, or one screen within a group. */
private sealed interface Route {
    data object Menu : Route
    data class GroupList(val group: Group) : Route
    data class Screen(val group: Group, val index: Int) : Route
}

@Composable
private fun CatalogApp(initialShowcaseId: String?) {
    val context = LocalContext.current

    // Every corpus, loaded once. The spec examples come out of the assets the build
    // copied from `vendor/spec/`.
    val showcases = remember {
        Group.entries.associateWith { group ->
            if (group == Group.BASIC) Showcases.basic else Showcases.spec(context, group)
        }
    }

    // One host for the whole app. Each screen resets it and applies its own message
    // stream, which is what the iOS example's per-example host achieves: a clean store
    // per example, and no clash between the v0.9 and v1.0 files, which share surface ids.
    val host = remember { A2UIHost(context, locale = "en-US") }

    var route by remember {
        mutableStateOf<Route>(
            initialShowcaseId?.let { id ->
                showcases.entries.firstNotNullOfOrNull { (group, items) ->
                    items.indexOfFirst { it.id == id }.takeIf { it >= 0 }?.let { Route.Screen(group, it) }
                }
            } ?: Route.Menu,
        )
    }

    BackHandler(enabled = route != Route.Menu) {
        route = when (val current = route) {
            is Route.Screen -> Route.GroupList(current.group)
            else -> Route.Menu
        }
    }

    when (val current = route) {
        Route.Menu -> Menu(onOpen = { route = Route.GroupList(it) })

        is Route.GroupList -> GroupList(
            group = current.group,
            items = showcases.getValue(current.group),
            onBack = { route = Route.Menu },
            onOpen = { index -> route = Route.Screen(current.group, index) },
        )

        is Route.Screen -> ExampleScreen(
            host = host,
            siblings = showcases.getValue(current.group),
            index = current.index,
            onBack = { route = Route.GroupList(current.group) },
            onStep = { index -> route = Route.Screen(current.group, index) },
        )
    }
}

// MARK: - Menu

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Menu(onOpen: (Group) -> Unit) {
    Scaffold(topBar = { TopAppBar(title = { Text("A2UI Catalog") }) }) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            for (group in Group.entries) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpen(group) }
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(group.title, style = MaterialTheme.typography.bodyLarge)
                    Text(
                        group.detail,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                HorizontalDivider()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GroupList(group: Group, items: List<Showcase>, onBack: () -> Unit, onOpen: (Int) -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(group.title) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("‹ Back")
                    }
                },
            )
        },
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding)) {
            items(items.indices.toList()) { index ->
                Text(
                    items[index].title,
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpen(index) }
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                )
                HorizontalDivider()
            }
        }
    }
}

// MARK: - One screen

/**
 * The pushed screen. Previous and Next step within the group in place; Back returns to
 * the list the item came from.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExampleScreen(
    host: A2UIHost,
    siblings: List<Showcase>,
    index: Int,
    onBack: () -> Unit,
    onStep: (Int) -> Unit,
) {
    val showcase = siblings[index]
    val scope = rememberCoroutineScope()
    var actionLog by remember { mutableStateOf(listOf<String>()) }
    val diagnostics by host.diagnostics.collectAsState()

    // A clean store per screen: reset, then this screen's stream.
    LaunchedEffect(showcase.id) {
        actionLog = emptyList()
        host.reset()
        host.apply(showcase.messages)
    }

    LaunchedEffect(host) {
        host.actions.collect { action ->
            actionLog = (listOf("${action.name} ${action.contextJson}") + actionLog).take(6)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(showcase.title) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("‹ Back")
                    }
                },
                actions = {
                    TextButton(onClick = {
                        scope.launch {
                            actionLog = emptyList()
                            host.reset()
                            host.apply(showcase.messages)
                        }
                    }) {
                        Text("Reset")
                    }
                },
            )
        },
        bottomBar = {
            BottomAppBar {
                TextButton(onClick = { onStep(index - 1) }, enabled = index > 0) {
                    Text("‹ Previous")
                }
                Text(
                    "${index + 1} of ${siblings.size}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
                TextButton(onClick = { onStep(index + 1) }, enabled = index < siblings.size - 1) {
                    Text("Next ›")
                }
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Text(
                showcase.summary,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            // This screen scrolls, so any `ScrollView` inside the surface degrades to a
            // column rather than fighting it.
            CompositionLocalProvider(LocalHostScrollsVertically provides true) {
                A2UISurfaceView(
                    host = host,
                    placeholder = { CircularProgressIndicator(modifier = Modifier.padding(24.dp)) },
                )
            }

            if (diagnostics.isNotEmpty()) {
                Entries("Diagnostics", diagnostics.map { it.description }, MaterialTheme.colorScheme.error)
            }

            if (actionLog.isNotEmpty()) {
                Entries("Sent to the agent", actionLog, MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
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
