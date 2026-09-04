'use client';
/* oxlint-disable next/no-html-link-for-pages -- Auth uses dispatch-owned full navigations; studio navigation refreshes the signed-in session. */
/* oxlint-disable next/no-img-element -- Preserve the exact supplied invitation artwork without image transformations. */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Upload,
  FileDown,
  ShieldCheck,
  Download,
  ArrowUpRight,
  Check,
  Users,
  SlidersHorizontal,
  RotateCcw,
  LoaderCircle,
  AlertCircle,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import {
  DEFAULT_PLACEMENT,
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  MAX_CSV_BYTES,
  normalizePlacement,
  type Guest,
  type Placement,
} from '@/lib/model';
import { parseGuestCsv, type CsvPreview } from '@/lib/csv';
import {
  createInvitation,
  canvasBlob,
  downloadBlob,
  invitationFilename,
} from '@/lib/invitation';
import { Zip, ZipPassThrough } from 'fflate';

type Props = {
  owner: boolean;
  signedIn: boolean;
  signInPath: string;
  initialError?: string;
};
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, cache: 'no-store' });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      'The website could not verify the latest records. Please try again.',
    );
  }
  if (!res.ok)
    throw new Error((data as { error?: string }).error || 'Please try again.');
  return data as T;
}
export default function Studio({
  owner,
  signedIn,
  signInPath,
  initialError,
}: Props) {
  const [guests, setGuests] = useState<Guest[]>([]),
    [selectedToken, setSelectedToken] = useState('');
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT),
    [savedPlacement, setSavedPlacement] =
      useState<Placement>(DEFAULT_PLACEMENT);
  const [origin, setOrigin] = useState(''),
    [loading, setLoading] = useState(owner),
    [error, setError] = useState(initialError || ''),
    [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<CsvPreview | null>(null),
    [csv, setCsv] = useState(''),
    [filename, setFilename] = useState(''),
    [importing, setImporting] = useState(false),
    [dragging, setDragging] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null),
    [saving, setSaving] = useState(false),
    [adjust, setAdjust] = useState(false),
    [imageError, setImageError] = useState('');
  const canvasHost = useRef<HTMLDivElement>(null),
    fileInput = useRef<HTMLInputElement>(null);
  const selected = guests.find((g) => g.token === selectedToken) || guests[0];
  const dirty = JSON.stringify(placement) !== JSON.stringify(savedPlacement);
  const refresh = useCallback(async () => {
    const data = await api<{
      guests: Guest[];
      placement: Placement;
      origin: string;
    }>('/api/guests');
    setGuests(data.guests);
    setOrigin(data.origin);
    setPlacement(data.placement);
    setSavedPlacement(data.placement);
    return data;
  }, []);
  useEffect(() => {
    if (!owner) return;
    const timer = window.setTimeout(() => {
      void refresh()
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [owner, refresh]);
  useEffect(() => {
    if (!selected || !origin) {
      canvasHost.current?.replaceChildren();
      return;
    }
    let cancelled = false;
    createInvitation(`${origin}/pass/${selected.token}`, placement)
      .then((canvas) => {
        if (cancelled) return;
        setImageError('');
        canvas.className = 'invitation-image';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute(
          'aria-label',
          `Personal invitation for ${selected.name}, with their QR pass`,
        );
        canvasHost.current?.replaceChildren(canvas);
      })
      .catch((e) => {
        if (!cancelled) setImageError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, origin, placement]);
  function message(text: string) {
    setNotice(text);
    setError('');
  }
  async function readFile(file: File | undefined) {
    if (!file) return;
    setError('');
    setNotice('');
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Choose a file ending in .csv.');
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setError('Choose a CSV smaller than 1 MB.');
      return;
    }
    try {
      const text = await file.text();
      setCsv(text);
      setFilename(file.name);
      setPreview(parseGuestCsv(text));
    } catch {
      setError('This file could not be read. Please choose it again.');
    }
  }
  async function doImport() {
    if (!preview || importing) return;
    setImporting(true);
    setError('');
    try {
      const result = await api<{
        imported: number;
        skipped: number;
        invalid: number;
      }>('/api/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv;charset=utf-8' },
        body: csv,
      });
      await refresh();
      setPreview(null);
      message(
        `${result.imported} guest${result.imported === 1 ? '' : 's'} imported.${result.skipped ? ` ${result.skipped} duplicate${result.skipped === 1 ? '' : 's'} skipped.` : ''}${result.invalid ? ` ${result.invalid} invalid row${result.invalid === 1 ? '' : 's'} skipped.` : ''}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
    }
  }
  async function save() {
    setSaving(true);
    try {
      const result = await api<{ placement: Placement }>('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placement),
      });
      setSavedPlacement(result.placement);
      setPlacement(result.placement);
      message('QR placement saved for every invitation.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function exportOne() {
    if (!selected || !origin) return;
    setExportProgress(0);
    try {
      const canvas = await createInvitation(
        `${origin}/pass/${selected.token}`,
        placement,
      );
      downloadBlob(
        await canvasBlob(canvas),
        invitationFilename(selected.name, guests.indexOf(selected)),
      );
      message(`Invitation for ${selected.name} downloaded.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExportProgress(null);
    }
  }
  async function exportAll() {
    if (!guests.length || !origin) return;
    setExportProgress(0);
    setError('');
    try {
      const parts: BlobPart[] = [];
      let zipError: Error | null = null;
      const zip = new Zip((err, data) => {
        if (err) {
          zipError = err;
          return;
        }
        parts.push(new Uint8Array(data).buffer);
      });
      for (const [i, guest] of guests.entries()) {
        const canvas = await createInvitation(
          `${origin}/pass/${guest.token}`,
          placement,
        );
        const blob = await canvasBlob(canvas);
        const file = new ZipPassThrough(invitationFilename(guest.name, i));
        zip.add(file);
        file.push(new Uint8Array(await blob.arrayBuffer()), true);
        canvas.width = 0;
        canvas.height = 0;
        setExportProgress(Math.round(((i + 1) / guests.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (zipError) throw zipError;
      }
      zip.end();
      if (zipError) throw zipError;
      downloadBlob(
        new Blob(parts, { type: 'application/zip' }),
        'Princess-and-Chijioke-invitations.zip',
      );
      message(`${guests.length} invitations downloaded.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExportProgress(null);
    }
  }
  function changePosition(key: keyof Placement, value: number) {
    if (Number.isFinite(value))
      setPlacement((p) => normalizePlacement({ ...p, [key]: value }));
  }
  const checked = guests.filter((g) => g.checked_in_at).length;
  return (
    <main className="workspace">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="monogram">
            P<span>&</span>C
          </span>
          <span>THE WEDDING COLLECTION</span>
        </a>
        <div className="topbar-right">
          <a className="studio-site-link" href="/">
            Wedding website <ArrowUpRight size={14} />
          </a>
          <span className="event-date">
            18 DECEMBER 2026 <i /> LAGOS
          </span>
          {signedIn && (
            <a
              className="signout"
              href="/signout-with-chatgpt?return_to=/"
              target="_top"
            >
              Sign out
            </a>
          )}
        </div>
      </header>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PRINCESS & CHIJIOKE</p>
          <h1>
            A personal invitation.
            <br />
            <em>For every guest.</em>
          </h1>
        </div>
        <span className="owner-note">
          <ShieldCheck size={18} />{' '}
          {owner ? 'Organizer workspace' : 'Your invitation studio'}
        </span>
      </div>
      {(error || notice) && (
        <div
          className={`notice ${error ? 'notice-error' : ''}`}
          role={error ? 'alert' : 'status'}
        >
          {error ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{error || notice}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss message"
            onClick={() => {
              setError('');
              setNotice('');
            }}
          >
            <X size={16} />
          </Button>
        </div>
      )}
      <div className="studio-grid">
        <section className="guest-panel">
          <div className="section-heading">
            <span className="step-number">01</span>
            <h2>Your guest list</h2>
            <span className="count-pill">{guests.length} guests</span>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Upload guest CSV"
            onChange={(e) => {
              void readFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div
            className={`upload-zone ${dragging ? 'is-dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void readFile(e.dataTransfer.files[0]);
            }}
          >
            <div className="upload-icon">
              <Upload size={24} />
            </div>
            <h3>
              {guests.length
                ? 'Add a few more names'
                : 'Every guest starts here'}
            </h3>
            <p>Drop your guest list here, or choose a CSV file.</p>
            <Button
              className="primary-action"
              onClick={() => fileInput.current?.click()}
              disabled={importing}
            >
              <Upload size={16} />
              Choose CSV file
            </Button>
            <span className="fine-print">
              A name is all you need.
              <br />
              Optional: handle and location · Up to 1,000 guests per file
            </span>
          </div>
          <a className="text-link" href="/sample-guests.csv" download>
            <FileDown size={16} /> Download the 9-guest sample CSV
          </a>
          {!owner && (
            <div className="signin-note">
              <ShieldCheck size={20} />
              <div>
                <strong>
                  {signedIn
                    ? 'This workspace belongs to the organizer.'
                    : 'Sign in to save guests and confirm entry.'}
                </strong>
                <p>You can preview a CSV before signing in.</p>
                {!signedIn && (
                  <a className="inline-signin" href={signInPath} target="_top">
                    Sign in with ChatGPT <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </div>
          )}
          {owner && (
            <>
              <div className="guest-list-heading">
                <h3>Invited guests</h3>
                <span>
                  <span className="status-dot" />
                  {checked} checked in
                </span>
              </div>
              {loading ? (
                <Empty>
                  <LoaderCircle className="spin" />
                  <EmptyTitle>Loading your guest list…</EmptyTitle>
                </Empty>
              ) : guests.length ? (
                <div className="guest-table-wrap">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <span className="sr-only">Select invitation</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guests.map((guest) => (
                        <TableRow
                          key={guest.token}
                          className={
                            selected?.token === guest.token
                              ? 'selected-row'
                              : ''
                          }
                        >
                          <TableCell>
                            <button
                              className="guest-name"
                              onClick={() => setSelectedToken(guest.token)}
                            >
                              <span className="avatar">
                                {Array.from(guest.name)[0]}
                              </span>
                              <span>
                                <strong>{guest.name}</strong>
                                {guest.handle && <small>{guest.handle}</small>}
                              </span>
                            </button>
                          </TableCell>
                          <TableCell className="location-cell">
                            {guest.location || '—'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`status-badge ${guest.checked_in_at ? 'is-used' : ''}`}
                            >
                              {guest.checked_in_at ? (
                                <Check size={12} />
                              ) : (
                                <span className="status-dot" />
                              )}
                              {guest.checked_in_at ? 'Checked in' : 'Invited'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Preview ${guest.name}'s invitation`}
                              onClick={() => setSelectedToken(guest.token)}
                            >
                              <ChevronRight size={17} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty className="guest-empty">
                  <EmptyHeader>
                    <Users size={26} strokeWidth={1.3} />
                    <EmptyTitle>Your guests will appear here</EmptyTitle>
                    <EmptyDescription>
                      Upload your CSV to create their personal passes.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              <div className="list-footer">
                <ShieldCheck size={15} />
                <p>
                  One invitation. One entry.
                  <br />
                  <span>Only you can confirm a guest’s arrival.</span>
                </p>
              </div>
            </>
          )}
        </section>
        <section className="preview-panel">
          <div className="section-heading">
            <span className="step-number">02</span>
            <h2>The invitation</h2>
            <span className="small-label">
              {selected ? 'PERSONALIZED' : 'YOUR ORIGINAL DESIGN'}
            </span>
          </div>
          <div className="invitation-stage">
            <div
              ref={canvasHost}
              className={selected ? 'canvas-host' : 'canvas-host hidden'}
            />
            {!selected && (
              <img
                className="invitation-image"
                src="/invitation.png"
                alt="Princess and Chijioke's original wedding invitation, 18 December 2026"
                width={1142}
                height={1600}
              />
            )}
          </div>
          {imageError && (
            <p className="inline-error" role="alert">
              {imageError}
            </p>
          )}
          <div className="preview-toolbar">
            <div>
              <span className="eyebrow">PREPARED FOR</span>
              <strong>{selected?.name || 'Your next guest'}</strong>
            </div>
            {owner && (
              <Button
                variant="outline"
                className="adjust-button"
                onClick={() => setAdjust(!adjust)}
                aria-expanded={adjust}
              >
                <SlidersHorizontal size={16} /> QR placement
              </Button>
            )}
          </div>
          {adjust && owner && (
            <div className="placement-controls">
              <p>Move the QR into clear space on your invitation.</p>
              {(['x', 'y', 'size'] as const).map((key) => (
                <div className="placement-row" key={key}>
                  <label htmlFor={`placement-${key}`}>
                    {key === 'x'
                      ? 'Horizontal'
                      : key === 'y'
                        ? 'Vertical'
                        : 'QR size'}
                  </label>
                  <Slider
                    aria-label={`${key === 'x' ? 'Horizontal position' : key === 'y' ? 'Vertical position' : 'QR size'}`}
                    value={[placement[key]]}
                    min={key === 'size' ? 180 : 0}
                    max={
                      key === 'x'
                        ? IMAGE_WIDTH - placement.size
                        : key === 'y'
                          ? IMAGE_HEIGHT - placement.size
                          : 360
                    }
                    step={1}
                    onValueChange={(value) =>
                      changePosition(
                        key,
                        Array.isArray(value) ? value[0] : value,
                      )
                    }
                  />
                  <Input
                    id={`placement-${key}`}
                    type="number"
                    min={key === 'size' ? 180 : 0}
                    max={
                      key === 'x'
                        ? IMAGE_WIDTH - placement.size
                        : key === 'y'
                          ? IMAGE_HEIGHT - placement.size
                          : 360
                    }
                    value={placement[key]}
                    onChange={(e) =>
                      changePosition(key, Number(e.target.value))
                    }
                  />
                </div>
              ))}
              <div className="placement-actions">
                <Button
                  variant="ghost"
                  onClick={() => setPlacement(DEFAULT_PLACEMENT)}
                >
                  <RotateCcw size={14} /> Reset
                </Button>
                <Button disabled={!dirty || saving} onClick={() => void save()}>
                  {saving ? (
                    <LoaderCircle className="spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save placement
                </Button>
              </div>
            </div>
          )}
          <div className="export-controls">
            <Button
              className="primary-action"
              onClick={() => void exportOne()}
              disabled={
                !selected ||
                !origin ||
                exportProgress !== null ||
                Boolean(imageError)
              }
            >
              <Download size={17} /> Download invitation
            </Button>
            <Button
              variant="outline"
              className="primary-action"
              onClick={() => void exportAll()}
              disabled={
                !guests.length ||
                !origin ||
                exportProgress !== null ||
                Boolean(imageError)
              }
            >
              <FileDown size={17} /> Download all
              {guests.length ? ` (${guests.length})` : ''}
            </Button>
          </div>
          {exportProgress !== null && (
            <output className="export-progress">
              <span>Preparing invitations… {exportProgress}%</span>
              <Progress aria-label="Invitation export" value={exportProgress} />
            </output>
          )}
          <p className="preview-caption">
            {selected ? (
              <a
                href={`/pass/${selected.token}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open {selected.name}’s entry pass <ArrowUpRight size={13} />
              </a>
            ) : (
              'Upload guests to add their personal QR codes.'
            )}
          </p>
        </section>
      </div>
      <footer className="studio-footer">
        <span>PRINCESS & CHIJIOKE</span>
        <span>Made for a day to remember.</span>
        <span>18.12.2026</span>
      </footer>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open && !importing) setPreview(null);
        }}
      >
        <DialogContent className="import-dialog" showCloseButton={!importing}>
          <DialogHeader>
            <p className="eyebrow">GUEST LIST IMPORT</p>
            <DialogTitle>Meet your guests</DialogTitle>
            <DialogDescription>
              {filename} · {preview?.rows.length || 0} valid guests
              {preview?.duplicates
                ? ` · ${preview.duplicates} duplicates skipped`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {preview?.issues.length ? (
            <div className="import-issues" role="alert">
              {preview.fatal && (
                <strong>This file needs a correction before importing.</strong>
              )}
              {preview.issues.slice(0, 12).map((issue, i) => (
                <p key={i}>
                  Row {issue.row}: {issue.message}
                </p>
              ))}
              {preview.issues.length > 12 && (
                <p>And {preview.issues.length - 12} more invalid rows.</p>
              )}
              {!preview.fatal && preview.rows.length > 0 && (
                <strong>Only valid guests below will be imported.</strong>
              )}
            </div>
          ) : null}
          {!!preview?.rows.length && (
            <div className="import-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Handle</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.handle || '—'}</TableCell>
                      <TableCell>{row.location || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          {!owner && (
            <p className="import-hint">
              Your preview is ready. Sign in as the organizer, then select your
              CSV again to import it.
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => setPreview(null)}
            >
              Cancel
            </Button>
            {owner ? (
              <Button
                className="primary-action"
                disabled={!preview?.rows.length || preview.fatal || importing}
                onClick={() => void doImport()}
              >
                {importing ? (
                  <LoaderCircle className="spin" />
                ) : (
                  <Check size={17} />
                )}{' '}
                {importing
                  ? 'Importing guests…'
                  : `Import ${preview?.rows.length || 0} guests`}
              </Button>
            ) : (
              <a className="signin-button" href={signInPath} target="_top">
                Sign in to import <ArrowUpRight size={16} />
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
