import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Add timeout to prevent hanging requests
    flowType: 'pkce',
  },
  global: {
    fetch: async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);

        // If it's a timeout or network error, clear the session
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
          console.error('Auth request timed out or failed. Clearing session...');

          // Use Supabase's built-in session cleanup (handles all storage keys automatically)
          supabase.auth.signOut().catch(() => {
            // If signOut fails, clear all Supabase-related localStorage keys
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
          });

          // Reload to reset auth state
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }

        throw error;
      }
    },
  },
});
