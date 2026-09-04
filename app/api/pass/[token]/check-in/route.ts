import { requireOrganizer, checkMutationOrigin } from '@/lib/auth';
import { checkIn } from '@/lib/store';
import { validToken } from '@/lib/model';
import { json, failure } from '@/lib/http';
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    checkMutationOrigin(request);
    await requireOrganizer();
    const { token } = await params;
    if (!validToken(token)) return json({ error: 'Invalid pass' }, 404);
    const result = await checkIn(token);
    return result ? json(result) : json({ error: 'Invalid pass' }, 404);
  } catch (error) {
    return failure(error);
  }
}
