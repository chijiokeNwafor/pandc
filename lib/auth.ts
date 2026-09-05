import { getSessionUser, type SessionUser } from './session';
import { getDb } from '../db';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function isOrganizer(user: SessionUser | null) {
  // Organizer access is pinned to the configured admin email.
  // There is no public "claim this site" endpoint or first-visitor ownership rule.
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail)
    throw new Error('The organizer account has not been configured.');
  const db = getDb();
  await db
    .prepare(
      'INSERT INTO organizer (id,email,initialized_at) VALUES (1,$1,$2) ON CONFLICT(id) DO NOTHING',
    )
    .bind(configuredEmail, new Date().toISOString())
    .run();
  const owner = await db
    .prepare('SELECT email,user_id FROM organizer WHERE id=1')
    .first<{ email: string; user_id: string | null }>();
  if (!owner || owner.email !== configuredEmail)
    throw new Error(
      'Organizer configuration does not match the saved account.',
    );
  if (!user || user.email.toLowerCase() !== owner.email) return false;
  if (!owner.user_id)
    await db
      .prepare(
        'UPDATE organizer SET user_id=$1 WHERE id=1 AND user_id IS NULL AND email=$2',
      )
      .bind(user.userId, owner.email)
      .run();
  const bound = await db
    .prepare('SELECT user_id FROM organizer WHERE id=1')
    .first<{ user_id: string }>();
  return bound?.user_id === user.userId;
}
export async function requireOrganizer() {
  const user = await getSessionUser();
  if (!user)
    throw new HttpError(
      401,
      'Sign in with your organizer account to continue.',
    );
  if (!(await isOrganizer(user)))
    throw new HttpError(403, 'Only the organizer can make this change.');
  return user;
}
export function canonicalOrigin() {
  const value = process.env.SITE_ORIGIN;
  if (!value)
    throw new Error('The invitation address has not been configured.');
  const url = new URL(value);
  return url.origin;
}
export function checkMutationOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (
    !origin ||
    origin !== canonicalOrigin() ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new HttpError(403, 'Open this action from the invitation website.');
}
