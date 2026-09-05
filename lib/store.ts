import { getDb } from '../db';
import {
  DEFAULT_PLACEMENT,
  canonicalGuest,
  type Guest,
  type GuestInput,
  type Placement,
  type PublicPass,
} from './model';
export async function listGuests(): Promise<Guest[]> {
  const result = await getDb()
    .prepare(
      'SELECT token,name,handle,location,created_at,checked_in_at FROM guests ORDER BY created_at, id',
    )
    .all<Guest>();
  return result.results;
}
export async function importGuests(rows: GuestInput[]) {
  const db = getDb(),
    now = new Date().toISOString();
  let imported = 0;
  // Bounded chunks keep each database transaction modest. Retries are safe because dedupe_key is unique.
  for (let i = 0; i < rows.length; i += 50) {
    const results = await db.batch(
      rows
        .slice(i, i + 50)
        .map((row) =>
          db
            .prepare(
              'INSERT INTO guests (token,name,handle,location,dedupe_key,created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(dedupe_key) DO NOTHING',
            )
            .bind(
              crypto.randomUUID().replace(/-/g, ''),
              row.name,
              row.handle,
              row.location,
              canonicalGuest(row),
              now,
            ),
        ),
    );
    imported += results.reduce((sum, result) => sum + result.meta.changes, 0);
  }
  return { imported, skipped: rows.length - imported };
}
export function readPass(token: string) {
  return getDb()
    .prepare('SELECT name,checked_in_at FROM guests WHERE token=$1')
    .bind(token)
    .first<PublicPass>();
}
export async function checkIn(token: string) {
  const pass = await getDb()
    .prepare(
      'UPDATE guests SET checked_in_at=$1 WHERE token=$2 AND checked_in_at IS NULL RETURNING name,checked_in_at',
    )
    .bind(new Date().toISOString(), token)
    .first<PublicPass>();
  if (pass) return { pass, confirmed: true };
  const existing = await readPass(token);
  return existing ? { pass: existing, confirmed: false } : null;
}
export async function getPlacement(): Promise<Placement> {
  return (
    (await getDb()
      .prepare('SELECT x,y,size FROM placement WHERE id=1')
      .first<Placement>()) ?? DEFAULT_PLACEMENT
  );
}
export async function savePlacement(p: Placement) {
  await getDb()
    .prepare(
      'INSERT INTO placement (id,x,y,size) VALUES (1,$1,$2,$3) ON CONFLICT(id) DO UPDATE SET x=excluded.x,y=excluded.y,size=excluded.size',
    )
    .bind(p.x, p.y, p.size)
    .run();
  return p;
}
