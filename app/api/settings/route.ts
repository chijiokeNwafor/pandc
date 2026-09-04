import { requireOrganizer, checkMutationOrigin, HttpError } from '@/lib/auth';
import { savePlacement } from '@/lib/store';
import { normalizePlacement } from '@/lib/model';
import { json, failure, limitedText } from '@/lib/http';
export async function PUT(request: Request) {
  try {
    checkMutationOrigin(request);
    await requireOrganizer();
    let body;
    try {
      body = JSON.parse(await limitedText(request, 1024));
    } catch {
      throw new HttpError(400, 'Enter valid QR placement values.');
    }
    if (
      !body ||
      typeof body !== 'object' ||
      !['x', 'y', 'size'].every(
        (key) => typeof body[key] === 'number' && Number.isFinite(body[key]),
      )
    )
      throw new HttpError(422, 'Enter valid QR placement values.');
    return json({ placement: await savePlacement(normalizePlacement(body)) });
  } catch (error) {
    return failure(error);
  }
}
