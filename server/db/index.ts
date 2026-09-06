import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Env } from '../types';
import * as schema from './schema';

export function getDb(env: Env) {
  const client = postgres(env.DATABASE_URL, { prepare: false });
  return drizzle(client, { schema });
}
