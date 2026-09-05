import { auth } from '@/auth';
export type SessionUser = { userId: string; email: string };
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return { userId: session.user.id, email: session.user.email };
}
export function signInPath(returnTo: string) {
  const url = new URL(returnTo, 'https://app.local');
  const safe =
    url.origin === 'https://app.local'
      ? `${url.pathname}${url.search}`
      : '/organizer';
  return `/api/auth/signin?callbackUrl=${encodeURIComponent(safe)}`;
}
