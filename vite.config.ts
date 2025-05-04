import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Significantly reduces build size by using rollup options
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Disable source maps for production builds
    minify: 'terser', // Use Terser for better minification
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log calls
        drop_debugger: true, // Remove debugger statements
      },
      output: {
        comments: false,     // Remove comments
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunk for better caching
          vendor: ['react', 'react-dom'],
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Set to true for production, false for development
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});