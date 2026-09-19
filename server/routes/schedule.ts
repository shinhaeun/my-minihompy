import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { isOwnerSession, requireOwner } from '../lib/auth';

export const scheduleRoute = new Hono<{ Bindings: Env }>();

const VISIBILITY_VALUES = ['public', 'private'] as const;
type Visibility = (typeof VISIBILITY_VALUES)[number];

const COLOR_VALUES = ['pink', 'purple', 'blue', 'green', 'yellow', 'orange', 'teal'] as const;
type Color = (typeof COLOR_VALUES)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const TITLE_MAX = 100;
const MEMO_MAX = 500;

interface ScheduleEventRow {
  id: string;
  event_date: string;
  start_time: string | null;
  title: string;
  memo: string | null;
  color: Color;
  visibility: Visibility;
}

function serialize(row: ScheduleEventRow) {
  return {
    id: row.id,
    date: row.event_date,
    startTime: row.start_time,
    title: row.title,
    memo: row.memo,
    color: row.color,
    visibility: row.visibility,
  };
}

function parseBody(body: Record<string, unknown>) {
  const date = typeof body.date === 'string' && DATE_RE.test(body.date) ? body.date : null;
  const rawTime = typeof body.startTime === 'string' ? body.startTime.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, TITLE_MAX) : '';
  const rawMemo = typeof body.memo === 'string' ? body.memo.trim().slice(0, MEMO_MAX) : '';
  const color: Color = COLOR_VALUES.includes(body.color as Color) ? (body.color as Color) : 'purple';
  const visibility: Visibility = VISIBILITY_VALUES.includes(body.visibility as Visibility)
    ? (body.visibility as Visibility)
    : 'public';

  return {
    date,
    // 형식이 어긋난 시간은 '종일'로 간주해 버린다
    startTime: TIME_RE.test(rawTime) ? rawTime : null,
    title,
    memo: rawMemo || null,
    color,
    visibility,
  };
}

/** 월/주/일 보기 모두 이 하나를 기간만 바꿔 호출한다 */
scheduleRoute.get('/', async (c) => {
  const start = c.req.query('start');
  const end = c.req.query('end');
  if (!start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
    return c.json({ error: 'start/end required (YYYY-MM-DD)' }, 400);
  }

  const supabase = getSupabase(c.env);
  const owner = await isOwnerSession(c);

  let query = supabase
    .from('schedule_events')
    .select('*')
    .gte('event_date', start)
    .lte('event_date', end)
    // 시간 없는 '종일' 일정이 먼저 오도록 nulls first
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true });
  if (!owner) query = query.eq('visibility', 'public');

  const { data, error } = await query.returns<ScheduleEventRow[]>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json((data ?? []).map(serialize));
});

scheduleRoute.post('/', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseBody(body);
  if (!parsed.date) return c.json({ error: 'date required' }, 400);
  if (!parsed.title) return c.json({ error: 'title required' }, 400);

  const { data, error } = await supabase
    .from('schedule_events')
    .insert({
      event_date: parsed.date,
      start_time: parsed.startTime,
      title: parsed.title,
      memo: parsed.memo,
      color: parsed.color,
      visibility: parsed.visibility,
    })
    .select('*')
    .single<ScheduleEventRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(serialize(data));
});

scheduleRoute.put('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseBody(body);
  if (!parsed.date) return c.json({ error: 'date required' }, 400);
  if (!parsed.title) return c.json({ error: 'title required' }, 400);

  const { data, error } = await supabase
    .from('schedule_events')
    .update({
      event_date: parsed.date,
      start_time: parsed.startTime,
      title: parsed.title,
      memo: parsed.memo,
      color: parsed.color,
      visibility: parsed.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq('id', c.req.param('id'))
    .select('*')
    .maybeSingle<ScheduleEventRow>();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: 'not found' }, 404);
  return c.json(serialize(data));
});

scheduleRoute.delete('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const { error } = await supabase.from('schedule_events').delete().eq('id', c.req.param('id'));
  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});
