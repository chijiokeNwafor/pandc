import Studio from '@/components/studio';
import { getChatGPTUser, chatGPTSignInPath } from '../chatgpt-auth';
import { isOrganizer } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invitation Studio | Princess & Chijioke' };
export default async function Organizer() {
  const user = await getChatGPTUser();
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
      signInPath={chatGPTSignInPath('/organizer')}
      initialError={initialError}
    />
  );
}
