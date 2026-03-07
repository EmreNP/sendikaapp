import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  optimizeDeps: {
    // pdfjs-dist kendi worker'ını yönetir; Vite'ın pre-bundle etmesi
    // 'a.getOrInsertComputed is not a function' gibi runtime hatalarına yol açabilir.
    exclude: ['pdfjs-dist'],
  },
  server: {
    port: 3002,
    host: true,
  },
})

