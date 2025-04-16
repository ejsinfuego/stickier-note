import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'main.ts'),
        database: resolve(__dirname, 'database.ts')
      },
      output: {
        format: 'commonjs',
        entryFileNames: (chunk) => {
          return chunk.name === 'main' || chunk.name === 'database' 
            ? '[name].js' 
            : 'assets/[name].[hash].js'
        }
      },
      external: [
        'electron'
      ]
    }
  }
})