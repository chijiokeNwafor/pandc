import { getSessionUser } from '@/lib/session';
import { isOrganizer } from '@/lib/auth';
import { readPass } from '@/lib/store';
import { validToken } from '@/lib/model';
import { json, failure } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!validToken(token)) return json({ error: 'Invalid pass' }, 404);
    const pass = await readPass(token);
    if (!pass) return json({ error: 'Invalid pass' }, 404);
    const user = await getSessionUser();
    return json({ pass, canCheckIn: user ? await isOrganizer(user) : false });
  } catch (error) {
    return failure(error);
  }
}
