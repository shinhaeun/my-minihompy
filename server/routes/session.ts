import { Hono } from 'hono';
import type { Env } from '../types';
import { isOwnerSession } from '../lib/auth';

export const sessionRoute = new Hono<{ Bindings: Env }>();

sessionRoute.get('/', async (c) => {
  const isOwner = await isOwnerSession(c);
  return c.json({ isOwner });
});
