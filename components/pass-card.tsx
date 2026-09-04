'use client';
/* oxlint-disable next/no-html-link-for-pages -- Auth and organizer navigation must refresh the server session. */
import { useEffect, useCallback, useState, useRef } from 'react';
import {
  Check,
  CheckCheck,
  ShieldCheck,
  X,
  AlertCircle,
  LoaderCircle,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicPass } from '@/lib/model';
type State =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; pass: PublicPass; canCheckIn: boolean };
export default function PassCard({
  token,
  signInPath,
}: {
  token: string;
  signInPath: string;
}) {
  const checkedAt = useRef<string | null>(null);
  const [state, setState] = useState<State>({ kind: 'loading' }),
    [busy, setBusy] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  const load = useCallback(async () => {
    try {
      if (!navigator.onLine)
        throw new Error(
          'You are offline. Connect to the internet to verify this pass.',
        );
      const res = await fetch(`/api/pass/${token}`, { cache: 'no-store' });
      if (res.status === 404) {
        setState({ kind: 'invalid' });
        return;
      }
      const data = (await res.json()) as {
        pass: PublicPass;
        canCheckIn: boolean;
        error?: string;
      };
      if (!res.ok)
        throw new Error(
          data.error || 'We could not verify this pass. Please try again.',
        );
      if (!navigator.onLine)
        throw new Error('You are offline. Connect to verify this pass.');
      if (data.pass.checked_in_at) checkedAt.current = data.pass.checked_in_at;
      setState({
        kind: 'ready',
        pass: { ...data.pass, checked_in_at: checkedAt.current },
        canCheckIn: data.canCheckIn,
      });
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message });
    }
  }, [token]);
  useEffect(() => {
    const initial = window.setTimeout(() => {
      void load();
    }, 0);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 15000);
    const focus = () => {
      void load();
    };
    const offline = () =>
      setState({
        kind: 'error',
        message:
          'You are offline. Connect to the internet to verify this pass.',
      });
    window.addEventListener('focus', focus);
    window.addEventListener('online', focus);
    window.addEventListener('offline', offline);
    return () => {
      window.clearTimeout(initial);
      clearInterval(interval);
      window.removeEventListener('focus', focus);
      window.removeEventListener('online', focus);
      window.removeEventListener('offline', offline);
    };
  }, [load]);
  async function confirmEntry() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pass/${token}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        cache: 'no-store',
      });
      const data = (await res.json()) as {
        pass: PublicPass;
        confirmed: boolean;
        error?: string;
      };
      if (!res.ok)
        throw new Error(
          data.error || 'Entry could not be confirmed. Please verify again.',
        );
      checkedAt.current = data.pass.checked_in_at;
      setState({ kind: 'ready', pass: data.pass, canCheckIn: true });
      setConfirmed(data.confirmed);
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  const ready = state.kind === 'ready',
    used = ready && Boolean(state.pass.checked_in_at);
  return (
    <main className="pass-page">
      <header className="pass-header">
        <a href="/" className="monogram">
          P<span>&</span>C
        </a>
        <p>PRINCESS & CHIJIOKE</p>
        <span>18 DECEMBER 2026 · LAGOS</span>
      </header>
      <section
        className={`pass-card ${used ? 'pass-used' : ''}`}
        aria-live="polite"
      >
        <div className="pass-card-top">
          <span className="eyebrow">YOUR WEDDING INVITATION</span>
          <ShieldCheck size={18} />
        </div>
        {state.kind === 'loading' && (
          <div className="pass-state">
            <div className="pass-symbol">
              <LoaderCircle className="spin" size={42} />
            </div>
            <h1>Verifying your pass</h1>
            <p>Please wait while we check the guest list.</p>
          </div>
        )}
        {ready && (
          <div className="pass-state">
            <div className={`pass-symbol ${used ? 'used-symbol' : ''}`}>
              {used ? (
                <CheckCheck size={44} strokeWidth={1.7} />
              ) : (
                <Check size={48} strokeWidth={1.7} />
              )}
            </div>
            <p className="pass-status">
              {used
                ? confirmed
                  ? 'Entry confirmed'
                  : 'Already checked in'
                : 'Access allowed'}
            </p>
            <h1>{state.pass.name}</h1>
            <p>
              {used
                ? 'This invitation has already been used for entry.'
                : 'We look forward to celebrating with you.'}
            </p>
            {used && (
              <time
                className="checkin-time"
                dateTime={state.pass.checked_in_at!}
              >
                {new Date(state.pass.checked_in_at!).toLocaleString('en-GB', {
                  timeZone: 'Africa/Lagos',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                · Lagos time
              </time>
            )}
            {!used && <span className="entry-pill">ONE GUEST · ONE ENTRY</span>}
          </div>
        )}
        {state.kind === 'invalid' && (
          <div className="pass-state">
            <div className="pass-symbol invalid-symbol">
              <X size={42} />
            </div>
            <h1>Invalid pass</h1>
            <p>
              This invitation could not be found.
              <br />
              Please contact the wedding organizer.
            </p>
          </div>
        )}
        {state.kind === 'error' && (
          <div className="pass-state">
            <div className="pass-symbol invalid-symbol">
              <AlertCircle size={40} />
            </div>
            <h1>Unable to verify</h1>
            <p>{state.message}</p>
            <Button className="primary-action" onClick={() => void load()}>
              <RefreshCw size={16} /> Verify again
            </Button>
          </div>
        )}
        {ready && state.canCheckIn && !used && (
          <div className="confirm-area">
            <p>Organizer check-in</p>
            <Button
              className="primary-action"
              onClick={() => void confirmEntry()}
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}{' '}
              {busy ? 'Confirming entry…' : 'Confirm entry'}
            </Button>
            <span>Confirm when {state.pass.name} arrives.</span>
          </div>
        )}
        <div className="pass-card-bottom">
          <span>STRICTLY BY INVITATION</span>
          <span>P&C · 2026</span>
        </div>
      </section>
      <footer className="pass-footer">
        <p>With love, Princess & Chijioke</p>
        {ready && !state.canCheckIn && (
          <a href={signInPath} target="_top">
            Organizer sign in <ArrowUpRight size={13} />
          </a>
        )}
        {ready && state.canCheckIn && (
          <a href="/organizer">
            Back to guest list <ArrowUpRight size={13} />
          </a>
        )}
      </footer>
    </main>
  );
}
