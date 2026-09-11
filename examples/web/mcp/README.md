# A2UI over MCP

An MCP tool that answers with a UI instead of prose, rendered here with BindJS.

<img src="https://github.com/user-attachments/assets/1ed5aacc-1c54-4c4d-a88f-3cd2e32976db" width="640" alt="Two surfaces from two MCP tools: a recipe card and a recipe form with cooking style and protein pickers, drawn through the custom catalog">

Start the MCP server and the web app together, from this directory:

```bash
pnpm dev      # starts the MCP server (:8787) and the web app (:5185) together
```

From the repository root, `pnpm dev:mcp` does the same.

The browser talks to the server directly at `http://localhost:8787/sse` (override it with
`VITE_MCP_URL`). There is no dev proxy: the SSE handshake hands the client a path to POST
back to, and a proxy would have to rewrite that too, so the server sets its own CORS
headers instead.

## What it shows

- **`server/server.ts`**: an MCP server exposing two tools, `get_recipe_a2ui` and
  `get_recipe_form_a2ui`, each returning an embedded resource with the
  `application/a2ui+json` MIME type. It knows nothing about BindJS, React, or how the
  surfaces will look.
- **`src/useMcpSurface.ts`**: connect, call every A2UI tool, pull the resources out of
  the results, and apply their messages to one `SurfaceStore`. That is the whole
  integration. The two tools produce two surfaces, `recipe-card` and `recipe-form`, on one
  connection, each rendered separately from the same store.
- **`src/catalog.ts`**: `Card` and `Text` swapped for custom BindJS. The toggle in the UI
  re-renders the *same* messages through either catalog; the agent's payload never changes.

## The loop

Choose a cooking style and a protein, press **Get Recipe**, and the card above updates.

That round trip is the point. The button's action goes back as an ordinary MCP tool call
(`a2ui_action`), because A2UI over MCP has no bespoke channel for this, and the server
answers with more A2UI, applied to the same store. One surface updates another, and the
client code never learns what changed: it applies messages.

The server's `recipeUpdate` stands in for an agent. A real one would generate the recipe;
this one rewrites the title and cook time from the choices, which is enough to see the
mechanism.

## About the payloads

`server/recipe.json` and `server/recipe-form.json` are the A2UI project's
`a2ui-over-mcp-recipe` sample (Apache-2.0), unmodified, including their `v0.9` version,
which this renderer handles alongside v1.0.

Being real payloads rather than fixtures written to match our assumptions, they found
three bugs on the way in:

1. The card binds a rating of `4.9`, a **number**, to a `Text`. A2UI's `DynamicString`
   resolves to whatever the data model holds, and handing a number to a markdown builder
   throws, which blanks the *entire* surface because bindjs-react's ErrorBoundary falls
   back to an empty div. Every catalog component now coerces; so does the custom `Text`
   here.
1. `ChoicePicker` was written against a guessed API. Selection mode comes from `variant`
   (`mutuallyExclusive` / `multipleSelection`), not a boolean, and `value` is a
   `DynamicStringList`: always an array, even for a single choice.
1. The two payloads declare **different spellings** of the v0.9 catalog id. The card uses
   `v0_9/catalogs/basic/catalog.json`, the form uses `v0_9/basic_catalog.json`. Both are
   accepted.
