import QRCode from 'qrcode';
import {
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  normalizePlacement,
  type Placement,
} from './model';
export function drawPersonalization(
  ctx: CanvasRenderingContext2D,
  url: string,
  placement: Placement,
) {
  const p = normalizePlacement(placement);
  const code = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const modules = code.modules.size,
    cell = Math.floor(p.size / (modules + 8)),
    qrSize = cell * (modules + 8);
  if (cell < 2)
    throw new Error('Make the QR code larger for this invitation link.');
  const left = p.x + Math.floor((p.size - qrSize) / 2),
    top = p.y + Math.floor((p.size - qrSize) / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(p.x, p.y, p.size, p.size);
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
  // A small white-backed monogram, with high error correction to retain scan reliability.
  const centerX = left + qrSize / 2;
  const centerY = top + qrSize / 2;
  const fontSize = Math.round(qrSize * 0.105);
  ctx.font = `bold ${fontSize}px Georgia`;
  const logoWidth = Math.ceil(ctx.measureText('P&C').width) + 10;
  const logoHeight = fontSize + 12;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(
    Math.floor(centerX - logoWidth / 2),
    Math.floor(centerY - logoHeight / 2),
    logoWidth,
    logoHeight,
  );
  ctx.fillStyle = '#193f42';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P&C', centerX, centerY + 1);
}
export async function createInvitation(url: string, placement: Placement) {
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not prepare the invitation.');
  const img = new Image();
  img.src = '/invitation.png';
  await img.decode();
  ctx.drawImage(img, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  drawPersonalization(ctx, url, placement);
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
