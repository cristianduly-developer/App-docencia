import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin que reemplaza __BUILD__ en sw.js con el timestamp actual
function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js')
      if (fs.existsSync(swPath)) {
        const content = fs.readFileSync(swPath, 'utf-8')
        fs.writeFileSync(swPath, content.replace('__BUILD__', Date.now()))
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  publicDir: 'static',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    }
  }
})
