import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { isOwnerSession, requireOwner } from '../lib/auth';

export const tasteRoute = new Hono<{ Bindings: Env }>();

const VISIBILITY_VALUES = ['public', 'private'] as const;
type Visibility = (typeof VISIBILITY_VALUES)[number];

const EXCERPT_LENGTH = 90;

interface TastePostRow {
  id: string;
  title: string;
  content: string;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

// 목록에서는 본문 전체 대신 앞부분만 잘라 내려보냄 — 글이 길어져도 목록 응답이 무거워지지 않게
function toSummary(row: TastePostRow) {
  const flat = row.content.replace(/\s+/g, ' ').trim();
  return {
    id: row.id,
    title: row.title,
    excerpt: flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH)}…` : flat,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

function toDetail(row: TastePostRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

function parseBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content : '';
  const visibility: Visibility = VISIBILITY_VALUES.includes(body.visibility as Visibility)
    ? (body.visibility as Visibility)
    : 'public';
  return { title, content, visibility };
}

tasteRoute.get('/', async (c) => {
  const supabase = getSupabase(c.env);
  const owner = await isOwnerSession(c);

  let query = supabase
    .from('taste_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (!owner) query = query.eq('visibility', 'public');

  const { data, error } = await query.returns<TastePostRow[]>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json((data ?? []).map(toSummary));
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
  return c.json(toDetail(post));
});

tasteRoute.post('/', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const { title, content, visibility } = parseBody(body);
  if (!title) return c.json({ error: 'title required' }, 400);

  const { data, error } = await supabase
    .from('taste_posts')
    .insert({ title, content, visibility })
    .select('*')
    .single<TastePostRow>();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(toDetail(data));
});

tasteRoute.put('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const { title, content, visibility } = parseBody(body);
  if (!title) return c.json({ error: 'title required' }, 400);

  const { data, error } = await supabase
    .from('taste_posts')
    .update({ title, content, visibility, updated_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .select('*')
    .maybeSingle<TastePostRow>();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: 'not found' }, 404);
  return c.json(toDetail(data));
});

tasteRoute.delete('/:id', requireOwner, async (c) => {
  const supabase = getSupabase(c.env);
  const { error } = await supabase.from('taste_posts').delete().eq('id', c.req.param('id'));
  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});
