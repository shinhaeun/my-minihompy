import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { requireOwner } from '../lib/auth';

export const profileRoute = new Hono<{ Bindings: Env }>();

interface ProfileRow {
  name: string | null;
  age: string | null;
  job: string | null;
  intro: string | null;
  mini_like: string | null;
  mini_color: string | null;
  mini_mood: string | null;
  photo_url: string | null;
}

function serialize(row: ProfileRow | null) {
  return {
    name: row?.name ?? null,
    age: row?.age ?? null,
    job: row?.job ?? null,
    intro: row?.intro ?? null,
    miniLike: row?.mini_like ?? null,
    miniColor: row?.mini_color ?? null,
    miniMood: row?.mini_mood ?? null,
    photoUrl: row?.photo_url ?? null,
  };
}

const FIELD_TO_COLUMN: Record<string, string> = {
  name: 'name',
  age: 'age',
  job: 'job',
  intro: 'intro',
  miniLike: 'mini_like',
  miniColor: 'mini_color',
  miniMood: 'mini_mood',
};

profileRoute.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  const { data } = await supabase.from('profile').select('*').eq('id', 1).maybeSingle<ProfileRow>();
  return c.json(serialize(data));
});

profileRoute.put('/', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [field, column] of Object.entries(FIELD_TO_COLUMN)) {
    if (field in body) {
      const value = body[field];
      patch[column] = typeof value === 'string' && value.trim() !== '' ? value : null;
    }
  }

  const { data, error } = await supabase
    .from('profile')
    .update(patch)
    .eq('id', 1)
    .select('*')
    .single<ProfileRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(serialize(data));
});

profileRoute.post('/photo', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const form = await c.req.formData();
  const file = form.get('photo');
  if (!(file instanceof File)) return c.json({ error: 'no file' }, 400);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `avatar/current.${ext}`;
  const buf = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, buf, { upsert: true, contentType: file.type || undefined });
  if (uploadError) return c.json({ error: uploadError.message }, 500);

  const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path);
  const url = `${pub.publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabase
    .from('profile')
    .update({ photo_url: url, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('*')
    .single<ProfileRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(serialize(data));
});
