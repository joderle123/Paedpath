import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// STANDALONE=1 bündelt alles in eine einzige HTML-Datei (per Doppelklick öffenbar).
const standalone = process.env.STANDALONE === '1'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(standalone ? [viteSingleFile()] : [])],
  base: './',
})
