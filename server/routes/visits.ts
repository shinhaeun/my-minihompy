import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';

export const visitsRoute = new Hono<{ Bindings: Env }>();

const VISIT_COOKIE = 'mh_last_visit';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readCounts(supabase: ReturnType<typeof getSupabase>, today: string) {
  const [{ data: todayRow }, { data: allRows }] = await Promise.all([
    supabase.from('visit_counts').select('count').eq('visit_date', today).maybeSingle<{ count: number }>(),
    supabase.from('visit_counts').select('count').returns<{ count: number }[]>(),
  ]);
  const total = (allRows ?? []).reduce((sum, r) => sum + r.count, 0);
  return { today: todayRow?.count ?? 0, total };
}

visitsRoute.post('/', async (c) => {
  const supabase = getSupabase(c.env);
  const today = todayStr();
  const last = getCookie(c, VISIT_COOKIE);

  if (last !== today) {
    setCookie(c, VISIT_COOKIE, today, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    const { data: existing } = await supabase
      .from('visit_counts')
      .select('count')
      .eq('visit_date', today)
      .maybeSingle<{ count: number }>();
    await supabase.from('visit_counts').upsert({ visit_date: today, count: (existing?.count ?? 0) + 1 });
  }

  return c.json(await readCounts(supabase, today));
});

visitsRoute.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  return c.json(await readCounts(supabase, todayStr()));
});
