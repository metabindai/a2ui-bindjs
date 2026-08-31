import './monaco-setup'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createGlobalStyle } from 'styled-components'

import { App } from './App'

const GlobalStyle = createGlobalStyle`
    *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { margin: 0; height: 100%; }
    body { background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
`

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GlobalStyle />
        <App />
    </StrictMode>
)
