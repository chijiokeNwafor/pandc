import { env } from 'cloudflare:workers';
export function getDb() {
  if (!env.DB) throw new Error('Guest records are temporarily unavailable.');
  return env.DB;
}
