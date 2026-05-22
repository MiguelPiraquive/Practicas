import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Sirve los PDFs del backend bajo el mismo origen del frontend
      // para que el <iframe> los pueda renderizar sin que el navegador
      // los bloquee por X-Frame-Options o por COEP.
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
