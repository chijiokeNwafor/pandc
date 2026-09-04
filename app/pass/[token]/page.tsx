import PassCard from '@/components/pass-card';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Wedding Entry Pass | Princess & Chijioke',
  robots: { index: false, follow: false },
};
export default async function PassPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <PassCard
      key={token}
      token={token}
      signInPath={chatGPTSignInPath(`/pass/${token}`)}
    />
  );
}
