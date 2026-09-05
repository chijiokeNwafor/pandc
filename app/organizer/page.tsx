import Studio from '@/components/studio';
import { getSessionUser, signInPath } from '@/lib/session';
import { isOrganizer } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invitation Studio | Princess & Chijioke' };
export default async function Organizer() {
  const user = await getSessionUser();
  let owner = false,
    initialError = '';
  try {
    owner = await isOrganizer(user);
  } catch {
    initialError =
      'The guest workspace is temporarily unavailable. Please try again shortly.';
  }
  return (
    <Studio
      owner={owner}
      signedIn={Boolean(user)}
      signInPath={signInPath('/organizer')}
      initialError={initialError}
    />
  );
}
