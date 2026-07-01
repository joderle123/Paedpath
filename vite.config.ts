import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// STANDALONE=1 bündelt alles in eine einzige HTML-Datei mit einem KLASSISCHEN
// Script (kein ES-Modul) — so lässt sie sich in jedem Browser (auch Firefox)
// direkt per Doppelklick über file:// öffnen.
const standalone = process.env.STANDALONE === '1'

// Entfernt type="module"/crossorigin vom eingebetteten Script, damit es als
// klassisches Script läuft (ES-Module werden über file:// teils blockiert).
// Der App-Start in main.tsx wartet auf DOMContentLoaded, daher ist die
// Script-Position unkritisch.
function classicScript(): Plugin {
  return {
    name: 'classic-inline-script',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module"/g, '<script')
        .replace(/\scrossorigin/g, '')
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(standalone ? [viteSingleFile(), classicScript()] : []),
  ],
  base: './',
  ...(standalone
    ? {
        build: {
          // IIFE = selbstausführendes klassisches Script ohne import/export
          rollupOptions: {
            output: { format: 'iife' as const, inlineDynamicImports: true },
          },
        },
      }
    : {}),
})
