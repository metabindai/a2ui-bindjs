/**
 * Undoing the browser's default styling inside a rendered surface.
 *
 * The renderer emits real HTML — `Text` becomes a `<p>`, and Markdown can add headings,
 * lists, `<pre>` and `<blockquote>` — so a browser's user-agent margins land on top of
 * the spacing the catalog components set. A `<p>` carries a 1em vertical margin, which
 * between two Texts in a Column adds roughly 32px nobody asked for.
 *
 * The rules are scoped to a class this package owns rather than to bindjs-react's
 * `.rendererContainer`: styling another package's DOM would leak into every renderer on
 * the page, including ones that are not showing A2UI.
 *
 * A host that wants full control can turn this off with `resetHostStyles={false}`.
 */
import { useEffect } from 'react'

/** Wrapper class the reset is scoped to. `display: contents` keeps it layout-neutral. */
export const SURFACE_CLASS = 'a2ui-surface'

const STYLE_ELEMENT_ID = 'a2ui-host-style-reset'

const RESET = `
.${SURFACE_CLASS} { display: contents; }

.${SURFACE_CLASS} :is(p, h1, h2, h3, h4, h5, h6, ul, ol, li, pre, blockquote, figure, dl, dd) {
    margin: 0;
}

/* Lists keep an indent, just not the browser's 40px one. */
.${SURFACE_CLASS} :is(ul, ol) {
    padding-left: 1.25em;
}
`

/**
 * Adds the reset to the document once, however many surfaces are mounted.
 *
 * Injected rather than shipped as a CSS file the host has to import: an import is easy to
 * miss, and the symptom — everything slightly too airy — is hard to attribute.
 */
export function useHostStyleReset(enabled: boolean): void {
    useEffect(() => {
        if (!enabled || typeof document === 'undefined') {
            return
        }

        if (document.getElementById(STYLE_ELEMENT_ID)) {
            return
        }

        const style = document.createElement('style')

        style.id = STYLE_ELEMENT_ID
        style.textContent = RESET

        // Prepended so a host's own stylesheet still wins on equal specificity.
        document.head.prepend(style)
    }, [enabled])
}
