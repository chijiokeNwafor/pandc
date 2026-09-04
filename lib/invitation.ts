import QRCode from 'qrcode';
import {
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  normalizePlacement,
  type Placement,
} from './model';
export function drawPersonalization(
  ctx: CanvasRenderingContext2D,
  name: string,
  url: string,
  placement: Placement,
) {
  const p = normalizePlacement(placement);
  const code = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const modules = code.modules.size,
    cell = Math.floor(p.size / (modules + 8)),
    qrSize = cell * (modules + 8);
  if (cell < 2)
    throw new Error('Make the QR code larger for this invitation link.');
  const left = p.x + Math.floor((p.size - qrSize) / 2),
    top = p.y + Math.floor((p.size - qrSize) / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(p.x, p.y, p.size, p.size + 38);
  ctx.fillStyle = '#000000';
  for (let row = 0; row < modules; row++)
    for (let column = 0; column < modules; column++)
      if (code.modules.get(row, column))
        ctx.fillRect(
          left + (column + 4) * cell,
          top + (row + 4) * cell,
          cell,
          cell,
        );
  ctx.fillStyle = '#193f42';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const words = name.split(/\s+/);
  let lines: string[] = [''];
  ctx.font = '18px Georgia';
  for (const word of words) {
    const last = lines.length - 1,
      test = lines[last] ? `${lines[last]} ${word}` : word;
    if (ctx.measureText(test).width <= p.size - 12) lines[last] = test;
    else if (lines[last]) lines.push(word);
    else lines[last] = word;
  }
  if (lines.length > 2) lines = [name];
  let fontSize = 18;
  while (
    fontSize > 12 &&
    lines.some((line) => ctx.measureText(line).width > p.size - 12)
  ) {
    fontSize--;
    ctx.font = `${fontSize}px Georgia`;
  }
  for (const [i, line] of lines.entries())
    ctx.fillText(
      line,
      p.x + p.size / 2,
      p.y + p.size + 2 + i * 18,
      p.size - 12,
    );
}
export async function createInvitation(
  name: string,
  url: string,
  placement: Placement,
) {
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not prepare the invitation.');
  const img = new Image();
  img.src = '/invitation.png';
  await img.decode();
  ctx.drawImage(img, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  drawPersonalization(ctx, name, url, placement);
  return canvas;
}
export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('The invitation could not be exported.')),
      'image/png',
    ),
  );
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function invitationFilename(name: string, index: number) {
  const safe =
    name
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 70) || 'guest';
  return `${String(index + 1).padStart(3, '0')}-${safe}.png`;
}
