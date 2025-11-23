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
          // HMS Video SDK - large dependency, split it out
          'hms-video': ['@100mslive/react-sdk', '@100mslive/hms-virtual-background'],

          // React core and routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Supabase
          'supabase': ['@supabase/supabase-js'],

          // Admin pages - only loaded when admin logs in
          'admin-pages': [
            './src/pages/AdminDashboard',
            './src/pages/admin/AdminHome',
            './src/pages/admin/TeacherManagement',
            './src/pages/admin/UserManagement',
            './src/pages/admin/TeacherPayouts',
            './src/pages/admin/Sessions',
            './src/pages/admin/GroupSessions',
            './src/pages/admin/CoursesManagement',
            './src/pages/admin/Recordings',
            './src/pages/admin/Analytics',
            './src/pages/admin/TeacherTiers',
          ],

          // Teacher pages - only loaded for teachers
          'teacher-pages': [
            './src/pages/teacher/TeacherHub',
            './src/pages/teacher/MyStudents',
            './src/pages/teacher/EditProfile',
            './src/pages/TeacherAvailability',
            './src/pages/TeacherEarnings',
            './src/pages/TeacherPaymentSettings',
            './src/pages/TeacherTierDashboard',
          ],

          // Lesson/video components - only loaded during lessons
          'lesson-components': [
            './src/pages/Lesson',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
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
