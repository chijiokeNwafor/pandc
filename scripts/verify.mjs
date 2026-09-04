import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { parseGuestCsv } from '../lib/csv.ts';
import { drawPersonalization } from '../lib/invitation.ts';
import { DEFAULT_PLACEMENT, normalizePlacement } from '../lib/model.ts';
const origin = 'http://localhost:3000';
const hosted =
  'https://princess-chijioke-invitations.peachy-kiwi-7794.chatgpt.site';
const sample = await fs.readFile('public/sample-guests.csv', 'utf8');
const parsed = parseGuestCsv(sample);
assert.equal(parsed.rows.length, 9);
assert.equal(parsed.issues.length, 0);
assert.equal(
  parseGuestCsv('\ufeff NAME,handle,location\r\n"Doe, Jane",jane,PT\r\n\r\n')
    .rows[0].name,
  'Doe, Jane',
);
assert.equal(parseGuestCsv('name\nAyoola\nayoola\n').duplicates, 1);
assert.equal(parseGuestCsv('name,handle\n,A\nGood,B\n').issues.length, 1);
assert.equal(parseGuestCsv('who\nAyoola').fatal, true);
assert.equal(parseGuestCsv('name\n"broken').fatal, true);
assert.equal(parseGuestCsv('name,name\nA,A').fatal, true);
assert.equal(parseGuestCsv('name\n' + 'A\n'.repeat(1001)).fatal, true);
assert.deepEqual(normalizePlacement({ x: 9999, y: 9999, size: 200 }), {
  x: 942,
  y: 1400,
  size: 200,
});
console.log(
  'PASS CSV validation: BOM, quotes, blank rows, duplicates, missing names, malformed headers and limits',
);
const signin = await fetch(`${origin}/signin-with-chatgpt?return_to=/`, {
  redirect: 'manual',
});
assert.equal(signin.status, 302);
const cookie = signin.headers.get('set-cookie').split(';')[0];
const headers = { Cookie: cookie, Origin: origin, 'Content-Type': 'text/csv' };
let response = await fetch(`${origin}/api/guests`);
assert.equal(response.status, 401);
response = await fetch(`${origin}/api/guests`, {
  headers: {
    'oai-authenticated-user-id': 'forged',
    'oai-authenticated-user-email': 'seedy@sites.test',
  },
});
assert.equal(response.status, 401);
response = await fetch(`${origin}/api/guests/import`, {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'text/csv' },
  body: sample,
});
assert.equal(response.status, 401);
response = await fetch(`${origin}/api/guests/import`, {
  method: 'POST',
  headers: { ...headers, Origin: 'https://untrusted.example' },
  body: sample,
});
assert.equal(response.status, 403);
response = await fetch(`${origin}/api/guests/import`, {
  method: 'POST',
  headers,
  body: 'wrong\nName',
});
assert.equal(response.status, 422);
response = await fetch(`${origin}/api/guests/import`, {
  method: 'POST',
  headers,
  body: sample,
});
assert.equal(response.status, 200);
const firstImport = await response.json();
const listResponse = await fetch(`${origin}/api/guests`, {
  headers: { Cookie: cookie },
});
assert.equal(listResponse.status, 200);
const { guests } = await listResponse.json();
const fixture = guests.filter((g) =>
  parsed.rows.some(
    (r) =>
      r.name === g.name && r.handle === g.handle && r.location === g.location,
  ),
);
assert.equal(fixture.length, 9);
assert.equal(new Set(fixture.map((g) => g.token)).size, 9);
for (const guest of fixture) {
  const res = await fetch(`${origin}/api/pass/${guest.token}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control'), /no-store/);
  const data = await res.json();
  assert.equal(data.pass.name, guest.name);
  assert.equal(data.canCheckIn, false);
  assert.deepEqual(Object.keys(data.pass).sort(), ['checked_in_at', 'name']);
}
response = await fetch(`${origin}/api/guests/import`, {
  method: 'POST',
  headers,
  body: sample,
});
const repeat = await response.json();
assert.equal(repeat.imported, 0);
assert.equal(repeat.skipped, 9);
const unchanged = await (
  await fetch(`${origin}/api/guests`, { headers: { Cookie: cookie } })
).json();
assert.deepEqual(unchanged.guests, guests);
console.log(
  `PASS CSV upload: nine unique persistent passes; reupload adds zero; anonymous and cross-site writes denied (${firstImport.imported} newly imported)`,
);
const target = fixture.find((g) => !g.checked_in_at);
assert.ok(
  target,
  'At least one unused sample pass is needed for the concurrency test.',
);
response = await fetch(`${origin}/api/pass/${target.token}/check-in`, {
  method: 'POST',
  headers: { Origin: origin },
});
assert.equal(response.status, 401);
const before = (
  await (await fetch(`${origin}/api/pass/${target.token}`)).json()
).pass;
assert.equal(before.checked_in_at, null);
const results = await Promise.all(
  Array.from({ length: 6 }, async () => {
    const response = await fetch(
      `${origin}/api/pass/${target.token}/check-in`,
      { method: 'POST', headers },
    );
    assert.equal(response.status, 200);
    return response.json();
  }),
);
assert.equal(results.filter((r) => r.confirmed).length, 1);
assert.equal(new Set(results.map((r) => r.pass.checked_in_at)).size, 1);
await fetch(`${origin}/api/guests/import`, {
  method: 'POST',
  headers,
  body: sample,
});
const after = (await (await fetch(`${origin}/api/pass/${target.token}`)).json())
  .pass;
assert.equal(after.checked_in_at, results[0].pass.checked_in_at);
assert.equal(
  (await fetch(`${origin}/api/pass/00000000000000000000000000000000`)).status,
  404,
);
assert.equal((await fetch(`${origin}/api/pass/invalid`)).status, 404);
const badSettings = await fetch(`${origin}/api/settings`, {
  method: 'PUT',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ x: 'bad', y: 0, size: 200 }),
});
assert.equal(badSettings.status, 422);
const settings = await fetch(`${origin}/api/settings`, {
  method: 'PUT',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(DEFAULT_PLACEMENT),
});
assert.equal(settings.status, 200);
console.log(
  'PASS check-in: merely opening a pass does not consume it; exactly one of six simultaneous confirmations succeeds; status survives reupload',
);
const original = await loadImage('public/invitation.png');
for (const [i, guest] of fixture.entries()) {
  const canvas = createCanvas(1142, 1600),
    ctx = canvas.getContext('2d');
  ctx.drawImage(original, 0, 0);
  const url = `${hosted}/pass/${guest.token}`;
  drawPersonalization(ctx, url, DEFAULT_PLACEMENT);
  const pixels = ctx.getImageData(0, 0, 1142, 1600);
  const decoded = jsQR(new Uint8ClampedArray(pixels.data), 1142, 1600);
  assert.equal(
    decoded?.data,
    url,
    `Exported QR for ${guest.name} must decode to their hosted page`,
  );
  if (i === 0) {
    const baseline = createCanvas(1142, 1600),
      bctx = baseline.getContext('2d');
    bctx.drawImage(original, 0, 0);
    const data = bctx.getImageData(0, 0, 1142, 1600).data;
    for (let y = 0; y < 1600; y++)
      for (let x = 0; x < 1142; x++) {
        if (x >= 840 && x < 1040 && y >= 1308 && y < 1508) continue;
        const pos = (y * 1142 + x) * 4;
        for (let c = 0; c < 4; c++)
          assert.equal(
            pixels.data[pos + c],
            data[pos + c],
            'Original artwork must remain unchanged outside the QR panel',
          );
      }
  }
  await fs.writeFile(
    `work/test-invitations/${String(i + 1).padStart(2, '0')}-${guest.name}.png`,
    canvas.toBuffer('image/png'),
  );
}
console.log(
  'PASS exports: all nine full-size invitation PNGs decode to the matching hosted URL; original artwork preserved outside the QR panel',
);
await fs.writeFile(
  'work/verification.json',
  JSON.stringify(
    {
      guests: fixture.map((g) => ({ name: g.name, token: g.token })),
      passed: true,
    },
    null,
    2,
  ),
);
