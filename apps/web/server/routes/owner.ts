import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../lib/supabase';
import { verifySecret, issueOwnerSession, clearOwnerSession } from '../lib/auth';
import { getClientIp, isRateLimited, recordAttempt, clearAttempts } from '../lib/rateLimit';

export const ownerRoute = new Hono<{ Bindings: Env }>();

interface OwnerCredentialRow {
  security_answer_hash: string;
  pin_hash: string;
}

ownerRoute.post('/login', async (c) => {
  const supabase = getSupabase(c.env);
  const ip = getClientIp(c);

  if (await isRateLimited(supabase, ip)) {
    return c.json({ error: 'too_many_attempts' }, 429);
  }

  const body = await c.req.json().catch(() => null);
  const questionAnswer = typeof body?.question_answer === 'string' ? body.question_answer : '';
  const pin = typeof body?.pin === 'string' ? body.pin : '';

  await recordAttempt(supabase, ip);

  const { data: cred } = await supabase
    .from('owner_credentials')
    .select('security_answer_hash, pin_hash')
    .eq('id', 1)
    .maybeSingle<OwnerCredentialRow>();

  if (!cred) {
    return c.json({ error: 'not_configured' }, 401);
  }

  const [answerOk, pinOk] = await Promise.all([
    verifySecret(questionAnswer, cred.security_answer_hash),
    verifySecret(pin, cred.pin_hash),
  ]);

  if (!answerOk || !pinOk) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  await clearAttempts(supabase, ip);
  await issueOwnerSession(c);
  return c.json({ isOwner: true });
});

ownerRoute.post('/logout', async (c) => {
  clearOwnerSession(c);
  return c.json({ isOwner: false });
});
