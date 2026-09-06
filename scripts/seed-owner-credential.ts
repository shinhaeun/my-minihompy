// 주인장 인증 정보(보안질문 답/PIN)를 해시로 만들어 Supabase에 1회 주입하는 로컬 전용 스크립트.
// 절대 배포되지 않고, 이 스크립트를 실행하는 커맨드/출력도 커밋하지 않는다.
//
// 사용법 (repo 루트에서):
//   SUPABASE_URL=... \
//   SUPABASE_SECRET_KEY=... \
//   SEED_OWNER_QUESTION='좋아하는 것은?' \
//   SEED_OWNER_ANSWER='코구마' \
//   SEED_OWNER_PIN='1818' \
//   bun run scripts/seed-owner-credential.ts

import { createClient } from '@supabase/supabase-js';

const PBKDF2_ITERATIONS = 100_000;

function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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

async function hashSecret(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(plain, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  const question = process.env.SEED_OWNER_QUESTION;
  const answer = process.env.SEED_OWNER_ANSWER;
  const pin = process.env.SEED_OWNER_PIN;

  if (!url || !serviceKey || !question || !answer || !pin) {
    console.error(
      'SUPABASE_URL, SUPABASE_SECRET_KEY, SEED_OWNER_QUESTION, SEED_OWNER_ANSWER, SEED_OWNER_PIN 환경변수가 모두 필요합니다.',
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const security_answer_hash = await hashSecret(answer);
  const pin_hash = await hashSecret(pin);

  const { error } = await supabase.from('owner_credentials').upsert({
    id: 1,
    security_question: question,
    security_answer_hash,
    pin_hash,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('주입 실패:', error.message);
    process.exit(1);
  }

  console.log('주인장 인증 정보가 Supabase에 저장됐습니다. (평문은 어디에도 남지 않음)');
}

main();
