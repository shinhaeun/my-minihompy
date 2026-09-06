import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { requireOwner, isOwnerSession } from '../lib/auth';

export const guestbookRoute = new Hono<{ Bindings: Env }>();

interface GuestbookRow {
  id: string;
  name: string;
  message: string;
  pinned: boolean;
  created_at: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

function serialize(row: GuestbookRow) {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    pinned: row.pinned,
    date: formatDate(row.created_at),
  };
}

guestbookRoute.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase
    .from('guestbook_entries')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<GuestbookRow[]>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json((data ?? []).map(serialize));
});

guestbookRoute.post('/', async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return c.json({ error: 'message required' }, 400);

  const name = (await isOwnerSession(c)) ? '주인장' : '방문자';

  const { data, error } = await supabase
    .from('guestbook_entries')
    .insert({ name, message, pinned: false })
    .select('*')
    .single<GuestbookRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(serialize(data));
});

guestbookRoute.patch('/:id/pin', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const id = c.req.param('id');

  const { data: existing } = await supabase
    .from('guestbook_entries')
    .select('pinned')
    .eq('id', id)
    .maybeSingle<{ pinned: boolean }>();
  if (!existing) return c.json({ error: 'not found' }, 404);

  const { data, error } = await supabase
    .from('guestbook_entries')
    .update({ pinned: !existing.pinned })
    .eq('id', id)
    .select('*')
    .single<GuestbookRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(serialize(data));
});

guestbookRoute.delete('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const id = c.req.param('id');
  const { error } = await supabase.from('guestbook_entries').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});
