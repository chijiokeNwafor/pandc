import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 1024)
    throw new Error('Use a password between 12 and 1024 characters.');
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string) {
  if (password.length > 1024) return false;
  const match = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(hash);
  if (!match) return false;
  const key = (await derive(password, match[1], 64)) as Buffer;
  return timingSafeEqual(key, Buffer.from(match[2], 'hex'));
}
