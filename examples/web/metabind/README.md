# A2UI with a Metabind catalog

The agent says *what* to show. Your Metabind project says what it looks like.

<img src="https://github.com/user-attachments/assets/c2d92667-3fbe-47ea-9ab1-c4c08c1905d4" width="600" alt="An offer card drawn by the bundled catalog, which is what the example shows until it is pointed at a Metabind project">

Start it from the repository root:

```bash
pnpm dev:metabind      # :5184, runs on the bundled catalog until you configure a project
```

A Metabind package is a set of BindJS components, published and fetched at runtime. Point
this example at one and the same A2UI surface is drawn with your components instead of the
built-in ones: no redeploy, and no change to anything the agent sends. The same package
draws the iOS app too.

## Point it at your project

Copy `.env.example` to `.env.local` and fill in your organization, project, and package
ids, plus either an API key or a preview token. Without them the example runs on the
bundled catalog, so you can see it working first.

> [!TIP]
> For `VITE_METABIND_PACKAGE_ID`, use a published package id, or `draft:<projectId>:<orgId>`
> to pick up whatever is in the Composer right now, which is what you want while you are
> still editing components.

In dev, requests are proxied through Vite.

> [!WARNING]
> In production, proxy from your own server: the Metabind API sends no CORS headers, and an
> API key in a browser bundle is not a secret.

## Writing the components

Ordinary BindJS components, with three things to get right.

**Name them after the A2UI type they draw**: `A2UIText`, `A2UICard`, `A2UIButton`. Match the
names and there is nothing to configure; the package is picked up as it is.

**Props arrive under their A2UI names**, plus two the platform supplies: `action`, a function
to call when the component is tapped, and a setter for anything bound to data (a `value`
prop comes with `setValue`). A branded button, for example:

```javascript
exports.default = defineComponent({
    properties: {},
    body: (props, children) => {
        const label = HStack({ spacing: 6 }, children ?? [])
            .padding({ horizontal: 22, vertical: 12 })
            .background(Color('#5b21b6'))
            .foregroundStyle(Color('white'))
            .cornerRadius(999)

        return Button(label, props.action ?? (() => {}))
    },
})
```

**Ship only what you want to change.** A package with two components overrides those two;
everything else keeps working from the built-in catalog.

## Things that fail quietly

**Text bound to data** can arrive as a number, so convert it (`String(props.text)`) before
rendering it. Left alone it takes out the whole surface, not only that one label.

## The same package on iOS

BindJS components render as real SwiftUI, so a package written for the web restyles the
native app as well; see [`examples/ios/minimal`](../../ios/minimal/README.md). Hand the
same components to the native host once, before the first surface arrives:

```swift
host.useCatalog(sources: components)
```

Stick to components and modifiers BindJS has on every platform, and one package covers
both. Reach for something with no native equivalent and it looks right in the browser and
is missing on the phone.
