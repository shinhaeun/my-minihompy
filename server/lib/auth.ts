import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import type { Context, Next } from 'hono';
import type { Env } from '../types';

const PBKDF2_ITERATIONS = 100_000;
const SESSION_COOKIE = 'mh_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일

function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

// 저장 포맷: pbkdf2$<iterations>$<saltHex>$<hashHex>
// Bun(로컬 스크립트)과 Cloudflare Workers(프로덕션) 양쪽에서 동일하게 동작하는
// Web Crypto만 사용 — 네이티브 바인딩이 필요한 bcrypt류는 쓰지 않는다.
export async function hashSecret(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(plain, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifySecret(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  const salt = fromHex(parts[2]);
  const expected = fromHex(parts[3]);
  const actual = await pbkdf2(plain, salt, iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export async function issueOwnerSession(c: Context<{ Bindings: Env }>): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const token = await sign({ sub: 'owner', exp }, c.env.SESSION_SECRET, 'HS256');
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearOwnerSession(c: Context<{ Bindings: Env }>): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export async function isOwnerSession(c: Context<{ Bindings: Env }>): Promise<boolean> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return false;
  try {
    const payload = await verify(token, c.env.SESSION_SECRET, 'HS256');
    return payload.sub === 'owner';
  } catch {
    return false;
  }
}

export async function requireOwner(c: Context<{ Bindings: Env }>, next: Next) {
  if (!(await isOwnerSession(c))) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
}
