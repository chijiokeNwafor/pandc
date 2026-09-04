export type GuestInput = { name: string; handle: string; location: string };
export type Guest = GuestInput & {
  token: string;
  checked_in_at: string | null;
  created_at: string;
};
export type PublicPass = { name: string; checked_in_at: string | null };
export type Placement = { x: number; y: number; size: number };
export const IMAGE_WIDTH = 1142;
export const IMAGE_HEIGHT = 1600;
export const DEFAULT_PLACEMENT: Placement = { x: 840, y: 1308, size: 200 };
export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_GUESTS_PER_IMPORT = 1000;
export function validToken(token: string) {
  return /^[a-f0-9]{32}$/.test(token);
}
export function normalizePlacement(value: Placement): Placement {
  const size = Math.round(Math.max(180, Math.min(360, value.size)));
  return {
    size,
    x: Math.round(Math.max(0, Math.min(IMAGE_WIDTH - size, value.x))),
    y: Math.round(Math.max(0, Math.min(IMAGE_HEIGHT - size, value.y))),
  };
}
export function canonicalGuest(row: GuestInput) {
  return JSON.stringify(
    [row.name, row.handle, row.location].map((v) =>
      v.normalize('NFKC').trim().toLocaleLowerCase('en'),
    ),
  );
}
