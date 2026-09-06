import { createClient } from '@supabase/supabase-js';
import type { Env } from '../types';

export function getSupabase(env: Env) {
  console.log('[debug] env keys:', Object.keys(env));
  console.log('[debug] has SUPABASE_URL:', typeof env.SUPABASE_URL, !!env.SUPABASE_URL);
  console.log('[debug] has SUPABASE_SECRET_KEY:', typeof env.SUPABASE_SECRET_KEY, !!env.SUPABASE_SECRET_KEY);
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
}
