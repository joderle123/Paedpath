import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function boot() {
  const el = document.getElementById('root')
  if (!el) return
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Bei klassischem Script (Standalone-Datei) kann der Code im <head> laufen,
// bevor #root existiert — dann auf DOMContentLoaded warten.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
