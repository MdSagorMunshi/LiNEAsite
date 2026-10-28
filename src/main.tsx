import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@/index.css'
import App from './App'
import ErrorBoundary from './components/error-boundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

/* ---------- PWA: offline shell service worker (production builds only) ---------- */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .catch(() => {
        /* registration failed (e.g. unsupported host) — online mode only */
      })
  })
}
