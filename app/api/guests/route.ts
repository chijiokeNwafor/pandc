import { requireOrganizer, canonicalOrigin } from '@/lib/auth';
import { listGuests, getPlacement } from '@/lib/store';
import { json, failure } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await requireOrganizer();
    const [guests, placement] = await Promise.all([
      listGuests(),
      getPlacement(),
    ]);
    return json({ guests, placement, origin: canonicalOrigin() });
  } catch (error) {
    return failure(error);
  }
}
