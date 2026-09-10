import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { requireOwner } from '../lib/auth';

export const favoritesRoute = new Hono<{ Bindings: Env }>();

interface FavoritePersonRow {
  id: string;
  name: string;
  note: string | null;
  created_at: string;
}

function serialize(row: FavoritePersonRow) {
  return { id: row.id, name: row.name, note: row.note };
}

favoritesRoute.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase
    .from('favorite_people')
    .select('*')
    .order('created_at', { ascending: true })
    .returns<FavoritePersonRow[]>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json((data ?? []).map(serialize));
});

favoritesRoute.post('/', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (!name) return c.json({ error: 'name required' }, 400);

  const { data, error } = await supabase
    .from('favorite_people')
    .insert({ name, note: note || null })
    .select('*')
    .single<FavoritePersonRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(serialize(data));
});

favoritesRoute.delete('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const id = c.req.param('id');
  const { error } = await supabase.from('favorite_people').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});
