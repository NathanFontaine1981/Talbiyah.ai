import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Determine if we're in production
const isProduction = import.meta.env.PROD;

// Custom storage using cookies instead of localStorage for better security
// Cookies with SameSite=Strict provide CSRF protection
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) {
        try {
          return decodeURIComponent(value);
        } catch {
          return null;
        }
      }
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    // Set secure cookie attributes
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const secure = isProduction ? 'Secure;' : '';
    const sameSite = 'SameSite=Strict;';
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; ${secure} ${sameSite}`;
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Use cookie storage instead of localStorage
    storage: cookieStorage,
    // Set storage key to avoid conflicts
    storageKey: 'sb-auth-token',
  },
});
