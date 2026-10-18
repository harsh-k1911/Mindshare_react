import { createClient } from '@supabase/supabase-js';
import { validateSupabaseConfig } from './config.js';

export const supabaseConfig = validateSupabaseConfig({
  url: import.meta.env.VITE_SUPABASE_URL?.trim(),
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim(),
});

// Lazy initialization avoids starting an auth session in the local preview.
// Authentication screens will explicitly request this shared client next.
let client;
export function getSupabaseClient() {
  if (supabaseConfig.status !== 'ready') {
    throw new Error(supabaseConfig.message);
  }
  if (!client) {
    client = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'mindshare.auth.v1',
      },
    });
  }
  return client;
}
