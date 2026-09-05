import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { drawPersonalization } from '../lib/invitation.ts';
if (!process.env.SITE_ORIGIN) throw new Error('Set SITE_ORIGIN to the deployment origin.');
const origin = new URL(process.env.SITE_ORIGIN).origin;
const { guests } = JSON.parse(
  await fs.readFile('work/verification.json', 'utf8'),
);
const image = await loadImage('public/invitation.png');
const source = createCanvas(1142, 1600),
  sourceCtx = source.getContext('2d');
sourceCtx.drawImage(image, 0, 0);
const baseline = sourceCtx.getImageData(0, 0, 1142, 1600).data;
for (const [index, guest] of guests.entries()) {
  const url = `${origin}/pass/${guest.token}`;
  for (const size of [180, 200, 360]) {
    const canvas = createCanvas(1142, 1600),
      ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const placement = {
      x: Math.min(840, 1142 - size),
      y: Math.min(1308, 1600 - size),
      size,
    };
    drawPersonalization(ctx, url, placement);
    const pixels = ctx.getImageData(0, 0, 1142, 1600);
    const decoded = jsQR(new Uint8ClampedArray(pixels.data), 1142, 1600);
    assert.equal(
      decoded?.data,
      url,
      `${guest.name}: ${size}px P&C QR must scan`,
    );
    if (size === 200) {
      for (let y = 0; y < 1600; y++)
        for (let x = 0; x < 1142; x++) {
          if (x >= 840 && x < 1040 && y >= 1308 && y < 1508) continue;
          const p = (y * 1142 + x) * 4;
          for (let c = 0; c < 4; c++)
            assert.equal(
              pixels.data[p + c],
              baseline[p + c],
              'No label or artwork changes outside the QR square',
            );
        }
      await fs.writeFile(
        `work/test-invitations/${String(index + 1).padStart(2, '0')}-${guest.name}.png`,
        canvas.toBuffer('image/png'),
      );
    }
  }
}
console.log(
  'PASS: all 9 P&C monogram QR codes decode at 180px, 200px, and 360px. No guest name or artwork change outside the QR square.',
);
