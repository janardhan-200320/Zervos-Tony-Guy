import { createClient } from '@supabase/supabase-js'
import { secureLocalStorage } from './secureStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Custom storage adapter using encrypted storage for Supabase tokens
const secureStorageAdapter = {
  getItem: (key: string) => {
    const value = secureLocalStorage.getItem<string>(key);
    return value || null;
  },
  setItem: (key: string, value: string) => {
    secureLocalStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    secureLocalStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
