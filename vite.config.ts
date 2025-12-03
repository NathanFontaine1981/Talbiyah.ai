import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // HMS Video SDK - large dependency, keep separate
          'hms-video': ['@100mslive/react-sdk', '@100mslive/hms-virtual-background', '@100mslive/roomkit-react'],

          // React core and routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Supabase client
          'supabase': ['@supabase/supabase-js'],

          // UI libraries
          'ui-libs': ['lucide-react'],

          // Date/time utilities
          'date-utils': ['date-fns'],

          // PDF generation
          'pdf-libs': ['jspdf', 'html2canvas'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 5174,
    host: true,
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5174,
      clientPort: 5174,
    },
  },
});
