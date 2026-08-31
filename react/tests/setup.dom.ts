/**
 * jsdom gaps the BindJS web renderer relies on.
 *
 * The important one is ResizeObserver: `<Renderer>` gates its content on `hasSized`
 * — a width measured by `useMeasure` — so a stub that never reports a size renders an
 * empty container forever. This one reports a viewport-sized box, matching what
 * `getBoundingClientRect` returns so the two measurements agree.
 */
const VIEWPORT = { width: 1024, height: 768 }

function rect() {
    return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: VIEWPORT.width,
        bottom: VIEWPORT.height,
        width: VIEWPORT.width,
        height: VIEWPORT.height,
        toJSON: () => ({}),
    }
}

class ResizeObserverStub {
    #callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
        this.#callback = callback
    }

    observe(target: Element): void {
        // Real observers report after the first commit, never synchronously.
        setTimeout(() => {
            this.#callback([{ target, contentRect: rect() } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
        }, 0)
    }

    unobserve(): void {}
    disconnect(): void {}
}

function matchMediaStub(query: string) {
    return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }
}

if (typeof window !== 'undefined') {
    const target = window as unknown as Record<string, unknown>

    target.ResizeObserver = ResizeObserverStub
    target.matchMedia = typeof window.matchMedia === 'function' ? window.matchMedia : matchMediaStub

    Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
        return rect() as DOMRect
    }
}
