import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // SheetJS (xlsx) tries to require Node.js built-ins; shim them for the browser
      fs: new URL('./src/shims/empty.js', import.meta.url).pathname,
      stream: new URL('./src/shims/empty.js', import.meta.url).pathname,
      crypto: new URL('./src/shims/empty.js', import.meta.url).pathname,
    },
  },
  optimizeDeps: {
    // Ensure xlsx is pre-bundled with the shims applied
    include: ['xlsx'],
  },
  server: {
    proxy: {
      // Redireciona /api/* para o backend Express durante o desenvolvimento
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

