// The app's own Compose — all of it.
//
// An index in two sections and a screen behind each row. Nothing here describes an offer
// card, a star, a flight, a chart or a deck of cards; that arrives as A2UI and a catalog
// draws it.

package ai.metabind.a2ui.customcatalog

import ai.metabind.a2ui.A2UIHost
import ai.metabind.a2ui.A2UISurfaceView
import ai.metabind.bindjs.composables.LocalHostScrollsVertically
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SheetState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    App()
                }
            }
        }
    }
}

// MARK: - Index

private enum class Screen(val title: String) {
    Offer("Offer card"),
    Overrides("Overrides"),
    Rating("Rating"),
    Flights("Flight search"),
    Dashboard("Sales dashboard"),
    Habitat("Habitat sort"),
}

@Composable
private fun App() {
    val context = LocalContext.current
    val demo = remember { Demo(context) }
    var screen by remember { mutableStateOf<Screen?>(null) }

    LaunchedEffect(demo) {
        demo.start()
    }

    // Every host's actions land in the one log, tagged with the host that sent them.
    for (host in demo.hosts) {
        LaunchedEffect(host) {
            host.actions.collect { action ->
                demo.record(host, action)
            }
        }
    }

    DisposableEffect(demo) {
        onDispose { demo.close() }
    }

    BackHandler(enabled = screen != null) {
        screen = null
    }

    // Collected here, one call per host in a fixed order: a composable only recomposes on
    // a flow it reads through `collectAsState`, and the count of those calls has to be the
    // same on every pass.
    val logged by demo.actions.collectAsState()
    val builtInDiagnostics by demo.builtIn.diagnostics.collectAsState()
    val brandedDiagnostics by demo.branded.diagnostics.collectAsState()
    val flightsDiagnostics by demo.flights.diagnostics.collectAsState()
    val dashboardDiagnostics by demo.dashboard.diagnostics.collectAsState()
    val habitatDiagnostics by demo.habitat.diagnostics.collectAsState()

    val diagnostics = mapOf(
        demo.builtIn to builtInDiagnostics,
        demo.branded to brandedDiagnostics,
        demo.flights to flightsDiagnostics,
        demo.dashboard to dashboardDiagnostics,
        demo.habitat to habitatDiagnostics,
    )

    val current = screen

    if (current == null) {
        IndexScreen(onOpen = { screen = it })
    } else {
        ScreenView(
            screen = current,
            demo = demo,
            logged = logged,
            diagnostics = diagnostics,
            onBack = { screen = null },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun IndexScreen(onOpen: (Screen) -> Unit) {
    Scaffold(topBar = { TopAppBar(title = { Text("A2UI Custom Catalog") }) }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
        ) {
            // Split by what the agent named, not by what the app supplied: these two are
            // types the bundled catalog already has, drawn as it ships and again with
            // `Text` and `Button` replaced.
            SectionHeader("Built-in catalog")
            IndexRow(Screen.Offer, onOpen)
            IndexRow(Screen.Overrides, onOpen)

            // Types the bundled catalog does not have at all.
            SectionHeader("Custom components")
            IndexRow(Screen.Rating, onOpen)
            IndexRow(Screen.Flights, onOpen)
            IndexRow(Screen.Dashboard, onOpen)
            IndexRow(Screen.Habitat, onOpen)
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 6.dp),
    )
}

@Composable
private fun IndexRow(screen: Screen, onOpen: (Screen) -> Unit) {
    ListItem(
        headlineContent = { Text(screen.title) },
        modifier = Modifier.clickable { onOpen(screen) },
    )
    HorizontalDivider()
}

// MARK: - Screens

@Composable
private fun ScreenView(
    screen: Screen,
    demo: Demo,
    logged: List<LoggedAction>,
    diagnostics: Map<A2UIHost, List<ai.metabind.a2ui.A2UIDiagnostic>>,
    onBack: () -> Unit,
) {
    // Every host and surface this screen draws. Its activity is the sum of them, so a
    // screen reports its own work and never another's.
    val drawn = when (screen) {
        Screen.Offer -> listOf(Drawn(demo.builtIn, "main"))
        Screen.Overrides -> listOf(Drawn(demo.branded, "main"))

        // Both hosts: the one that was told about `Rating` and the one that was not.
        Screen.Rating -> listOf(Drawn(demo.branded, "review"), Drawn(demo.builtIn, "review"))
        Screen.Flights -> listOf(Drawn(demo.flights, "flights"))
        Screen.Dashboard -> listOf(Drawn(demo.dashboard, "dashboard"))
        Screen.Habitat -> listOf(Drawn(demo.habitat, "habitat"))
    }

    val messages = drawn.flatMap { entry ->
        diagnostics[entry.host].orEmpty().filter { it.surfaceId == entry.surfaceId }.map { it.description }
    }

    Screenful(
        screen = screen,
        demo = demo,
        actions = logged.forSurfaces(drawn),
        diagnostics = messages,
        onBack = onBack,
    ) {
        val subject = drawn.first()

        A2UISurfaceView(host = subject.host, surfaceId = subject.surfaceId, placeholder = { Loading() })

        // The same surface on a host that was never told about `Rating`. Why it comes out
        // empty is in the sheet, with everything else the screen has to say.
        if (screen == Screen.Rating) {
            Panel("Without the catalog") {
                A2UISurfaceView(host = demo.builtIn, surfaceId = "review", placeholder = { Loading() })
            }
        }
    }
}

// MARK: - Chrome

/**
 * A screen: its surface, and a floating pill for whatever the surface has said back.
 *
 * Nothing is shown inline — a screen that has dispatched nothing and drawn cleanly is only
 * its surface.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Screenful(
    screen: Screen,
    demo: Demo,
    actions: List<LoggedAction>,
    diagnostics: List<String>,
    onBack: () -> Unit,
    content: @Composable () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var showingActivity by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(screen.title) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("Back")
                    }
                },
                actions = {
                    TextButton(onClick = { scope.launch { demo.reset() } }) {
                        Text("Reset")
                    }
                },
            )
        },
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                // This screen scrolls, so any `ScrollView` inside a surface degrades to a
                // column rather than fighting it for height.
                CompositionLocalProvider(LocalHostScrollsVertically provides true) {
                    content()
                }
            }

            ActivityPill(
                actions = actions.size,
                diagnostics = diagnostics.size,
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp),
            ) {
                showingActivity = true
            }
        }
    }

    if (showingActivity) {
        ActivitySheet(
            actions = actions,
            diagnostics = diagnostics,
            sheetState = sheetState,
            onDismiss = { showingActivity = false },
        )
    }
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
private fun Loading() {
    CircularProgressIndicator(modifier = Modifier.padding(24.dp))
}

// MARK: - The floating pill

/** Counts what the surface has said back, and nothing at all when it has said nothing. */
@Composable
private fun ActivityPill(actions: Int, diagnostics: Int, modifier: Modifier = Modifier, onClick: () -> Unit) {
    if (actions == 0 && diagnostics == 0) {
        return
    }

    Surface(
        shape = CircleShape,
        color = MaterialTheme.colorScheme.surfaceContainerHigh,
        tonalElevation = 3.dp,
        shadowElevation = 8.dp,
        modifier = modifier.clickable(onClick = onClick),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 13.dp),
        ) {
            if (actions > 0) {
                Text(counted(actions, "Action"), style = MaterialTheme.typography.labelLarge)
            }

            if (actions > 0 && diagnostics > 0) {
                Text("·", color = MaterialTheme.colorScheme.outline)
            }

            if (diagnostics > 0) {
                Text(
                    counted(diagnostics, "Diagnostic"),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.error,
                )
            }

            ChevronUp(MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

/**
 * Drawn rather than typed.
 *
 * Material's own chevron lives in `material-icons-core`, which this example does not
 * depend on, and the glyphs that look like one are not — `\u2303` is the control key.
 */
@Composable
private fun ChevronUp(color: Color) {
    Canvas(modifier = Modifier.size(12.dp)) {
        val path = Path().apply {
            moveTo(0f, size.height * 0.68f)
            lineTo(size.width / 2f, size.height * 0.32f)
            lineTo(size.width, size.height * 0.68f)
        }

        drawPath(
            path,
            color,
            style = Stroke(width = 1.6.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round),
        )
    }
}

private fun counted(count: Int, noun: String) = "$count $noun${if (count == 1) "" else "s"}"

/**
 * The two lists, out of the surface's way until asked for.
 *
 * A plain sheet of `ListItem`s, because the system already draws exactly this — sectioned
 * rows with a label on the left and its value on the right.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ActivitySheet(
    actions: List<LoggedAction>,
    diagnostics: List<String>,
    sheetState: SheetState,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(bottom = 32.dp),
        ) {
            if (diagnostics.isNotEmpty()) {
                SectionHeader("Diagnostics")

                for (message in diagnostics) {
                    Text(
                        message,
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    )
                }
            }

            if (actions.isNotEmpty()) {
                SectionHeader("Actions")

                for (entry in actions) {
                    ActionRow(entry)
                    HorizontalDivider()
                }
            }
        }
    }
}

/** The action's name, then its resolved context: key on the left, value on the right. */
@Composable
private fun ActionRow(entry: LoggedAction) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(entry.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)

        for (value in entry.payload) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(value.key, style = MaterialTheme.typography.bodySmall)

                Text(
                    value.value,
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.widthIn(max = 220.dp),
                )
            }
        }
    }
}
