import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { isOwnerSession, requireOwner } from '../lib/auth';

export const tasteRoute = new Hono<{ Bindings: Env }>();

const BUCKET = 'taste-images';
const SIGNED_URL_TTL = 60 * 60; // 1시간
const EXCERPT_LENGTH = 90;

const VISIBILITY_VALUES = ['public', 'private'] as const;
type Visibility = (typeof VISIBILITY_VALUES)[number];

// DB에는 사진의 스토리지 경로(path)만 저장하고, 내려보낼 때만 서명 URL로 바꾼다.
type StoredBlock = { type: 'text'; text: string } | { type: 'image'; path: string };

interface TastePostRow {
  id: string;
  category: string | null;
  title: string;
  blocks: StoredBlock[];
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

function signImageUrl(supabase: SupabaseClient, path: string) {
  return supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
}

/** 신뢰할 수 없는 입력에서 블록 배열만 걸러냄 */
function parseBlocks(raw: unknown): StoredBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: StoredBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const b = item as Record<string, unknown>;
    if (b.type === 'text' && typeof b.text === 'string') {
      blocks.push({ type: 'text', text: b.text });
    } else if (b.type === 'image' && typeof b.path === 'string') {
      blocks.push({ type: 'image', path: b.path });
    }
  }
  return blocks;
}

function blocksOf(row: TastePostRow): StoredBlock[] {
  return Array.isArray(row.blocks) ? row.blocks : [];
}

function plainText(blocks: StoredBlock[]): string {
  return blocks
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function toSummary(supabase: SupabaseClient, row: TastePostRow) {
  const blocks = blocksOf(row);
  const flat = plainText(blocks);

  // 목록 카드에는 첫 사진 한 장만 미리보기로 쓴다
  const firstImage = blocks.find((b): b is { type: 'image'; path: string } => b.type === 'image');
  let thumbUrl: string | null = null;
  if (firstImage) {
    const { data } = await signImageUrl(supabase, firstImage.path);
    thumbUrl = data?.signedUrl ?? null;
  }

  return {
    id: row.id,
    category: row.category,
    title: row.title,
    excerpt: flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH)}…` : flat,
    thumbUrl,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

async function toDetail(supabase: SupabaseClient, row: TastePostRow) {
  const blocks = [];
  for (const block of blocksOf(row)) {
    if (block.type === 'text') {
      blocks.push(block);
      continue;
    }
    const { data } = await signImageUrl(supabase, block.path);
    // 서명에 실패한(=사라진) 사진은 조용히 건너뛴다
    if (data?.signedUrl) blocks.push({ type: 'image' as const, path: block.path, url: data.signedUrl });
  }

  return {
    id: row.id,
    category: row.category,
    title: row.title,
    blocks,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

function parseBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const rawCategory = typeof body.category === 'string' ? body.category.trim() : '';
  const visibility: Visibility = VISIBILITY_VALUES.includes(body.visibility as Visibility)
    ? (body.visibility as Visibility)
    : 'public';
  return { title, category: rawCategory || null, blocks: parseBlocks(body.blocks), visibility };
}

tasteRoute.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  const owner = await isOwnerSession(c);

  let query = supabase.from('taste_posts').select('*').order('created_at', { ascending: false });
  if (!owner) query = query.eq('visibility', 'public');

  const { data, error } = await query.returns<TastePostRow[]>();
  if (error) return c.json({ error: error.message }, 500);

  return c.json(await Promise.all((data ?? []).map((row) => toSummary(supabase, row))));
});

/** 목록 화면의 카테고리 필터 버튼용 — 실제로 쓰인 카테고리만 추려서 내려줌 */
tasteRoute.get('/categories', async (c) => {
  const supabase = getSupabase(c.env);
  const owner = await isOwnerSession(c);

  let query = supabase.from('taste_posts').select('category');
  if (!owner) query = query.eq('visibility', 'public');

  const { data, error } = await query.returns<{ category: string | null }[]>();
  if (error) return c.json({ error: error.message }, 500);

  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (row.category) seen.add(row.category);
  }
  return c.json([...seen].sort((a, b) => a.localeCompare(b, 'ko')));
});

tasteRoute.post('/images', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const form = await c.req.formData();
  const file = form.get('image');
  if (!(file instanceof File)) return c.json({ error: 'no file' }, 400);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `taste/${crypto.randomUUID()}.${ext}`;
  const buf = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: file.type || undefined });
  if (error) return c.json({ error: error.message }, 500);

  const { data } = await signImageUrl(supabase, path);
  return c.json({ path, url: data?.signedUrl ?? null });
});

tasteRoute.get('/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const owner = await isOwnerSession(c);

  const { data: post } = await supabase
    .from('taste_posts')
    .select('*')
    .eq('id', c.req.param('id'))
    .maybeSingle<TastePostRow>();

  // 일기장과 같은 원칙: 없는 글과 비공개 글을 방문자가 구분하지 못하도록 둘 다 404
  if (!post || (!owner && post.visibility !== 'public')) {
    return c.json({ error: 'not found' }, 404);
  }
  return c.json(await toDetail(supabase, post));
});

tasteRoute.post('/', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const { title, category, blocks, visibility } = parseBody(body);
  if (!title) return c.json({ error: 'title required' }, 400);

  const { data, error } = await supabase
    .from('taste_posts')
    .insert({ title, category, blocks, visibility })
    .select('*')
    .single<TastePostRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(await toDetail(supabase, data));
});

tasteRoute.put('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const { title, category, blocks, visibility } = parseBody(body);
  if (!title) return c.json({ error: 'title required' }, 400);

  const { data: before } = await supabase
    .from('taste_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle<TastePostRow>();
  if (!before) return c.json({ error: 'not found' }, 404);

  const { data, error } = await supabase
    .from('taste_posts')
    .update({ title, category, blocks, visibility, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single<TastePostRow>();
  if (error) return c.json({ error: error.message }, 500);

  // 수정하면서 빠진 사진은 스토리지에서도 지워 고아 파일이 남지 않게 한다
  const kept = new Set(blocks.filter((b) => b.type === 'image').map((b) => b.path));
  const dropped = blocksOf(before)
    .filter((b): b is { type: 'image'; path: string } => b.type === 'image' && !kept.has(b.path))
    .map((b) => b.path);
  if (dropped.length > 0) await supabase.storage.from(BUCKET).remove(dropped);

  return c.json(await toDetail(supabase, data));
});

tasteRoute.delete('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const id = c.req.param('id');

  const { data: post } = await supabase
    .from('taste_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle<TastePostRow>();
  if (!post) return c.body(null, 204);

  const paths = blocksOf(post)
    .filter((b): b is { type: 'image'; path: string } => b.type === 'image')
    .map((b) => b.path);
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);

  const { error } = await supabase.from('taste_posts').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});
