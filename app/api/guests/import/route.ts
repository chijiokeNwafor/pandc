import { requireOrganizer, checkMutationOrigin, HttpError } from '@/lib/auth';
import { importGuests } from '@/lib/store';
import { parseGuestCsv } from '@/lib/csv';
import { MAX_CSV_BYTES } from '@/lib/model';
import { json, failure, limitedText } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkMutationOrigin(request);
    await requireOrganizer();
    if (!request.headers.get('content-type')?.startsWith('text/csv'))
      throw new HttpError(415, 'Upload a CSV file.');
    const result = parseGuestCsv(await limitedText(request, MAX_CSV_BYTES));
    if (result.fatal || !result.rows.length)
      return json(
        { error: 'Check the highlighted rows and try again.', ...result },
        422,
      );
    const imported = await importGuests(result.rows);
    return json({
      ...imported,
      skipped: imported.skipped + result.duplicates,
      invalid: result.issues.length,
      issues: result.issues,
    });
  } catch (error) {
    return failure(error);
  }
}
