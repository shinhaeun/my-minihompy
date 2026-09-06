import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { isOwnerSession, requireOwner } from '../lib/auth';

export const diaryRoute = new Hono<{ Bindings: Env }>();

const SIGNED_URL_TTL = 60 * 60; // 1시간
const VISIBILITY_VALUES = ['public', 'private', 'friends'] as const;
type Visibility = (typeof VISIBILITY_VALUES)[number];

interface DiaryEntryRow {
  entry_date: string;
  content: string;
  visibility: Visibility;
  cover_photo_id: string | null;
}

interface DiaryPhotoRow {
  id: string;
  entry_date: string;
  url: string;
  sort_order: number;
}

async function signPhotoUrl(supabase: SupabaseClient, path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('diary-photos').createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

diaryRoute.get('/', async (c) => {
  const year = Number(c.req.query('year'));
  const month = Number(c.req.query('month')); // 1-12
  if (!year || !month || month < 1 || month > 12) {
    return c.json({ error: 'year/month required' }, 400);
  }

  const supabase = getSupabase(c.env);
  const owner = await isOwnerSession(c);

  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonthDate = new Date(year, month, 1); // month는 이미 1-indexed라 자연스럽게 다음달 1일
  const end = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

  let query = supabase
    .from('diary_entries')
    .select('entry_date, visibility, cover_photo_id')
    .gte('entry_date', start)
    .lt('entry_date', end);
  if (!owner) query = query.eq('visibility', 'public');

  const { data, error } = await query.returns<DiaryEntryRow[]>();
  if (error) return c.json({ error: error.message }, 500);

  const results = [];
  for (const row of data ?? []) {
    let coverUrl: string | null = null;
    if (row.cover_photo_id) {
      const { data: photo } = await supabase
        .from('diary_photos')
        .select('url')
        .eq('id', row.cover_photo_id)
        .maybeSingle<{ url: string }>();
      if (photo) coverUrl = await signPhotoUrl(supabase, photo.url);
    }
    results.push({ date: row.entry_date, visibility: row.visibility, coverUrl });
  }
  return c.json(results);
});

async function serializeFullEntry(supabase: SupabaseClient, entry: DiaryEntryRow) {
  const { data: photoRows } = await supabase
    .from('diary_photos')
    .select('*')
    .eq('entry_date', entry.entry_date)
    .order('sort_order', { ascending: true })
    .returns<DiaryPhotoRow[]>();

  const photos: { id: string; url: string }[] = [];
  for (const p of photoRows ?? []) {
    const url = await signPhotoUrl(supabase, p.url);
    if (url) photos.push({ id: p.id, url });
  }

  return {
    date: entry.entry_date,
    content: entry.content,
    visibility: entry.visibility,
    coverPhotoId: entry.cover_photo_id,
    photos,
  };
}

diaryRoute.get('/:date', async (c) => {
  const date = c.req.param('date');
  const supabase = getSupabase(c.env);
  const owner = await isOwnerSession(c);

  const { data: entry } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('entry_date', date)
    .maybeSingle<DiaryEntryRow>();

  // 존재하지 않음/비공개 둘 다 동일하게 404 처리 — 방문자가 "그날 일기가 없다"와
  // "비공개 일기가 있다"를 구분하지 못하게 함
  if (!entry || (!owner && entry.visibility !== 'public')) {
    return c.json({ error: 'not found' }, 404);
  }

  return c.json(await serializeFullEntry(supabase, entry));
});

diaryRoute.put('/:date', requireOwner, async (c) => {
  const date = c.req.param('date');
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  const content = typeof body.content === 'string' ? body.content : '';
  const visibility: Visibility = VISIBILITY_VALUES.includes(body.visibility as Visibility)
    ? (body.visibility as Visibility)
    : 'public';
  const coverPhotoId = typeof body.coverPhotoId === 'string' ? body.coverPhotoId : null;

  const { data, error } = await supabase
    .from('diary_entries')
    .upsert(
      { entry_date: date, content, visibility, cover_photo_id: coverPhotoId, updated_at: new Date().toISOString() },
      { onConflict: 'entry_date' },
    )
    .select('*')
    .single<DiaryEntryRow>();
  if (error) return c.json({ error: error.message }, 500);

  return c.json(await serializeFullEntry(supabase, data));
});

diaryRoute.post('/:date/photos', requireOwner, async (c) => {
  const date = c.req.param('date');
  const supabase = getSupabase(c.env);
  const form = await c.req.formData();
  const file = form.get('photo');
  if (!(file instanceof File)) return c.json({ error: 'no file' }, 400);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const id = crypto.randomUUID();
  const path = `diary/${date}/${id}.${ext}`;
  const buf = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('diary-photos')
    .upload(path, buf, { contentType: file.type || undefined });
  if (uploadError) return c.json({ error: uploadError.message }, 500);

  const { count } = await supabase
    .from('diary_photos')
    .select('id', { count: 'exact', head: true })
    .eq('entry_date', date);

  const { data, error } = await supabase
    .from('diary_photos')
    .insert({ id, entry_date: date, url: path, sort_order: count ?? 0 })
    .select('*')
    .single<DiaryPhotoRow>();
  if (error) return c.json({ error: error.message }, 500);

  const url = await signPhotoUrl(supabase, data.url);
  return c.json({ id: data.id, url });
});

diaryRoute.delete('/:date/photos/:photoId', requireOwner, async (c) => {
  const date = c.req.param('date');
  const photoId = c.req.param('photoId');
  const supabase = getSupabase(c.env);

  const { data: photo } = await supabase
    .from('diary_photos')
    .select('*')
    .eq('id', photoId)
    .maybeSingle<DiaryPhotoRow>();
  if (!photo) return c.json({ error: 'not found' }, 404);

  await supabase.storage.from('diary-photos').remove([photo.url]);
  await supabase.from('diary_photos').delete().eq('id', photoId);
  // 삭제한 사진이 대표사진이었다면 같이 해제
  await supabase.from('diary_entries').update({ cover_photo_id: null }).eq('entry_date', date).eq('cover_photo_id', photoId);

  return c.body(null, 204);
});
