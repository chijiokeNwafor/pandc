import { HttpError } from './auth';
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  console.error(
    'request_failed',
    error instanceof Error ? error.message : 'Unknown error',
  );
  return json(
    { error: 'We could not verify the latest records. Please try again.' },
    503,
  );
}
export async function limitedText(request: Request, maxBytes: number) {
  if (Number(request.headers.get('content-length')) > maxBytes)
    throw new HttpError(
      413,
      'This file is too large. Use a CSV smaller than 1 MB.',
    );
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError(
        413,
        'This file is too large. Use a CSV smaller than 1 MB.',
      );
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
