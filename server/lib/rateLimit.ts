import type { SupabaseClient } from '@supabase/supabase-js';
import type { Context } from 'hono';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function getClientIp(c: Context): string {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
}

export async function isRateLimited(supabase: SupabaseClient, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('owner_login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', since);
  return (count ?? 0) >= MAX_ATTEMPTS;
}

export async function recordAttempt(supabase: SupabaseClient, ip: string): Promise<void> {
  await supabase.from('owner_login_attempts').insert({ ip });
}

export async function clearAttempts(supabase: SupabaseClient, ip: string): Promise<void> {
  await supabase.from('owner_login_attempts').delete().eq('ip', ip);
}
