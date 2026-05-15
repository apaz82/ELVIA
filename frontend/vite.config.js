import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':       ['@phosphor-icons/react', 'react-hot-toast'],
          'vendor-pdf':      ['html2canvas', 'html2pdf.js', 'jspdf'],
          'vendor-data':     ['recharts', 'react-markdown'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-misc':     ['framer-motion', '@marsidev/react-turnstile'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
