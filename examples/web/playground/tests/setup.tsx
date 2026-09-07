/**
 * jsdom gaps. `<Renderer>` gates its content on a width measured by ResizeObserver,
 * so a stub that never reports a size renders an empty container forever.
 */
import { vi } from 'vitest'

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
        setTimeout(() => {
            this.#callback([{ target, contentRect: rect() } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
        }, 0)
    }

    unobserve(): void {}
    disconnect(): void {}
}

if (typeof window !== 'undefined') {
    const target = window as unknown as Record<string, unknown>

    target.ResizeObserver = ResizeObserverStub
    target.matchMedia =
        typeof window.matchMedia === 'function'
            ? window.matchMedia
            : (query: string) => ({
                  matches: false,
                  media: query,
                  onchange: null,
                  addListener: () => {},
                  removeListener: () => {},
                  addEventListener: () => {},
                  removeEventListener: () => {},
                  dispatchEvent: () => false,
              })

    Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
        return rect() as DOMRect
    }
}

// Monaco needs real web workers and a layout engine; neither exists in jsdom. The stub
// is a plain textarea with the same value/onChange contract, so editors stay drivable
// from tests — keyed by Monaco's model path so each one is addressable.
interface EditorStubProps {
    value?: string
    onChange?: (value: string) => void
    path?: string
}

vi.mock('@monaco-editor/react', () => ({
    default: ({ value, onChange, path }: EditorStubProps) => (
        <textarea
            data-testid={path ?? 'editor'}
            value={value ?? ''}
            onChange={(event) => onChange?.(event.target.value)}
        />
    ),
    loader: { config: () => {} },
}))

vi.mock('../src/monaco-setup', () => ({}))
