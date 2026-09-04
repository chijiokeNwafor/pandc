import Papa from 'papaparse';
import {
  canonicalGuest,
  MAX_GUESTS_PER_IMPORT,
  type GuestInput,
} from './model';
export type CsvIssue = { row: number; message: string };
export type CsvPreview = {
  rows: GuestInput[];
  issues: CsvIssue[];
  duplicates: number;
  fatal: boolean;
};
export function parseGuestCsv(csv: string): CsvPreview {
  const parsed = Papa.parse<string[]>(csv.replace(/^\uFEFF/, ''), {
    skipEmptyLines: 'greedy',
    delimiter: ',',
  });
  const rows: GuestInput[] = [],
    issues: CsvIssue[] = [];
  let duplicates = 0;
  const header = parsed.data[0]?.map((v) => v.trim().toLowerCase()) ?? [];
  if (!header.includes('name'))
    return {
      rows,
      issues: [
        { row: 1, message: 'Add a name column to the first row of your CSV.' },
      ],
      duplicates,
      fatal: true,
    };
  if (new Set(header).size !== header.length)
    return {
      rows,
      issues: [{ row: 1, message: 'Column headings must be unique.' }],
      duplicates,
      fatal: true,
    };
  if (parsed.data.length - 1 > MAX_GUESTS_PER_IMPORT)
    return {
      rows,
      issues: [
        {
          row: 1,
          message: `Upload up to ${MAX_GUESTS_PER_IMPORT} guests at a time.`,
        },
      ],
      duplicates,
      fatal: true,
    };
  if (parsed.errors.length)
    return {
      rows,
      issues: parsed.errors.map((e) => ({
        row: (e.row ?? 0) + 1,
        message: e.message,
      })),
      duplicates,
      fatal: true,
    };
  const seen = new Set<string>();
  for (const [i, values] of parsed.data.slice(1).entries()) {
    const rowNumber = i + 2;
    if (values.length > header.length) {
      issues.push({
        row: rowNumber,
        message:
          'Too many values. Put names containing commas inside double quotes.',
      });
      continue;
    }
    const cell = (key: string) =>
      (values[header.indexOf(key)] ?? '').trim().replace(/[\r\n\t]+/g, ' ');
    const row = {
      name: cell('name'),
      handle: cell('handle'),
      location: cell('location'),
    };
    if (!row.name) {
      issues.push({ row: rowNumber, message: 'A guest name is required.' });
      continue;
    }
    if (
      Object.values(row).some(
        (v) =>
          v.length > 160 ||
          Array.from(v).some((char) => char.charCodeAt(0) < 32),
      )
    ) {
      issues.push({
        row: rowNumber,
        message: 'Use up to 160 readable characters per field.',
      });
      continue;
    }
    const key = canonicalGuest(row);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    rows.push(row);
  }
  if (!rows.length && !issues.length)
    issues.push({
      row: 2,
      message: 'Add at least one guest below the column headings.',
    });
  return { rows, issues, duplicates, fatal: false };
}
